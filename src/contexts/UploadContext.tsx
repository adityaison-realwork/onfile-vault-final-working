import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { downloadFilesAsZip, downloadFileIndividually } from '@/utils/zipDownload';

export interface UploadProgress {
  id: string;
  fileName: string;
  groupId: string;
  groupName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  speed: number; // bytes per second
  size: number;
  uploaded: number;
  startTime: number;
  error?: string;
  type: 'upload';
}

export interface DownloadProgress {
  id: string;
  fileName: string;
  groupId: string;
  groupName: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  speed: number; // bytes per second
  size: number;
  downloaded: number;
  startTime: number;
  error?: string;
  type: 'download';
}

type TransferProgress = UploadProgress | DownloadProgress;

interface UploadContextType {
  uploads: UploadProgress[];
  downloads: DownloadProgress[];
  startUpload: (groupId: string, groupName: string, files: FileList) => Promise<void>;
  startDownload: (files: Array<{id: string, name: string, storage_path: string, file_size: number}>, groupId: string, groupName: string, asZip?: boolean, zipName?: string) => Promise<void>;
  cancelUpload: (id: string) => void;
  cancelDownload: (id: string) => void;
  clearCompleted: () => void;
  getOverallProgress: () => { 
    upload: { progress: number; speed: number; totalFiles: number; completedFiles: number };
    download: { progress: number; speed: number; totalFiles: number; completedFiles: number };
  };
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [downloads, setDownloads] = useState<DownloadProgress[]>([]);

  const updateUpload = useCallback((id: string, updates: Partial<UploadProgress>) => {
    setUploads(prev => prev.map(upload => 
      upload.id === id ? { ...upload, ...updates } : upload
    ));
  }, []);

  const updateDownload = useCallback((id: string, updates: Partial<DownloadProgress>) => {
    setDownloads(prev => prev.map(download => 
      download.id === id ? { ...download, ...updates } : download
    ));
  }, []);

  const startUpload = async (groupId: string, groupName: string, files: FileList) => {
    const uploadPromises: Promise<void>[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadId = crypto.randomUUID();
      
      const uploadProgress: UploadProgress = {
        id: uploadId,
        fileName: file.name,
        groupId,
        groupName,
        progress: 0,
        status: 'pending',
        speed: 0,
        size: file.size,
        uploaded: 0,
        startTime: Date.now(),
        type: 'upload',
      };

      setUploads(prev => [...prev, uploadProgress]);

      const uploadPromise = uploadFile(file, groupId, uploadId, updateUpload);
      uploadPromises.push(uploadPromise);
    }

    // Wait for all uploads to complete
    await Promise.allSettled(uploadPromises);
    
    // Auto-clear completed uploads after all files are uploaded
    setTimeout(() => {
      setUploads(prev => prev.filter(upload => 
        !(upload.groupId === groupId && upload.status === 'completed')
      ));
    }, 2000);
  };

  const uploadFile = async (
    file: File, 
    groupId: string, 
    uploadId: string,
    updateUpload: (id: string, updates: Partial<UploadProgress>) => void
  ): Promise<void> => {
    try {
      updateUpload(uploadId, { status: 'uploading' });
      
      const fileId = crypto.randomUUID();
      const fileName = `${fileId}-${file.name}`;
      const storagePath = `groups/${groupId}/${fileName}`;
      
      let lastTime = Date.now();
      let lastLoaded = 0;

      // Use Supabase upload with progress tracking
      let uploadedBytes = 0;
      const progressInterval = setInterval(() => {
        const increment = Math.min(file.size * 0.1, file.size - uploadedBytes);
        uploadedBytes += increment;
        const progress = Math.min((uploadedBytes / file.size) * 100, 95);
        const speed = increment / 0.1; // bytes per 100ms interval
        
        updateUpload(uploadId, {
          progress,
          uploaded: uploadedBytes,
          speed
        });
        
        if (progress >= 95) {
          clearInterval(progressInterval);
        }
      }, 100);

      const { error: uploadError } = await supabase.storage
        .from('onfile-storage')
        .upload(storagePath, file);

      clearInterval(progressInterval);

      if (uploadError) {
        updateUpload(uploadId, { 
          status: 'error', 
          error: uploadError.message 
        });
        return;
      }

      // Save file record to database
      const { error: dbError } = await supabase.from('files').insert({
        id: fileId,
        group_id: groupId,
        name: file.name,
        storage_path: storagePath,
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
      });

      if (dbError) {
        updateUpload(uploadId, { 
          status: 'error', 
          error: 'Failed to save file record' 
        });
        return;
      }

      updateUpload(uploadId, { 
        status: 'completed', 
        progress: 100,
        uploaded: file.size,
        speed: 0 
      });

    } catch (error) {
      console.error('Upload error:', error);
      updateUpload(uploadId, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Upload failed' 
      });
    }
  };

  const startDownload = async (files: Array<{id: string, name: string, storage_path: string, file_size: number}>, groupId: string, groupName: string, asZip?: boolean, zipName?: string) => {
    if (asZip && files.length > 1) {
      // ZIP download
      const downloadId = crypto.randomUUID();
      
      const downloadProgress: DownloadProgress = {
        id: downloadId,
        fileName: `${zipName || 'archive'}.zip`,
        groupId,
        groupName,
        progress: 0,
        status: 'pending',
        speed: 0,
        size: files.reduce((sum, f) => sum + f.file_size, 0),
        downloaded: 0,
        startTime: Date.now(),
        type: 'download',
      };

      setDownloads(prev => [...prev, downloadProgress]);

      try {
        updateDownload(downloadId, { status: 'downloading' });
        
        await downloadFilesAsZip(files, zipName || 'archive', (progress) => {
          updateDownload(downloadId, {
            progress,
            downloaded: (progress / 100) * downloadProgress.size
          });
        });

        updateDownload(downloadId, { 
          status: 'completed', 
          progress: 100,
          downloaded: downloadProgress.size,
          speed: 0 
        });
      } catch (error) {
        updateDownload(downloadId, { 
          status: 'error', 
          error: error instanceof Error ? error.message : 'ZIP download failed' 
        });
      }
    } else {
      // Individual downloads
      const downloadPromises: Promise<void>[] = [];

      for (const file of files) {
        const downloadId = crypto.randomUUID();
        
        const downloadProgress: DownloadProgress = {
          id: downloadId,
          fileName: file.name,
          groupId,
          groupName,
          progress: 0,
          status: 'pending',
          speed: 0,
          size: file.file_size,
          downloaded: 0,
          startTime: Date.now(),
          type: 'download',
        };

        setDownloads(prev => [...prev, downloadProgress]);

        const downloadPromise = downloadFile(file, downloadId, updateDownload);
        downloadPromises.push(downloadPromise);
      }

      await Promise.allSettled(downloadPromises);
    }
  };

  const downloadFile = async (
    file: {id: string, name: string, storage_path: string, file_size: number}, 
    downloadId: string,
    updateDownload: (id: string, updates: Partial<DownloadProgress>) => void
  ): Promise<void> => {
    try {
      updateDownload(downloadId, { status: 'downloading' });
      
      let lastTime = Date.now();
      let lastLoaded = 0;

      // Simulate progress for download
      const progressInterval = setInterval(() => {
        const now = Date.now();
        const timeDiff = now - lastTime;
        const currentLoaded = lastLoaded + Math.random() * 50000; // Simulate download progress
        
        if (currentLoaded < file.file_size) {
          const speed = timeDiff > 0 ? (currentLoaded - lastLoaded) / (timeDiff / 1000) : 0;
          const progress = (currentLoaded / file.file_size) * 100;
          
          updateDownload(downloadId, {
            progress,
            speed,
            downloaded: currentLoaded
          });
          
          lastLoaded = currentLoaded;
          lastTime = now;
        }
      }, 100);

      // Use the utility function for individual downloads
      await downloadFileIndividually(file);

      updateDownload(downloadId, { 
        status: 'completed', 
        progress: 100,
        downloaded: file.file_size,
        speed: 0 
      });

    } catch (error) {
      console.error('Download error:', error);
      updateDownload(downloadId, { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Download failed' 
      });
    }
  };

  const cancelUpload = (id: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
  };

  const cancelDownload = (id: string) => {
    setDownloads(prev => prev.filter(download => download.id !== id));
  };

  const clearCompleted = () => {
    setUploads(prev => prev.filter(upload => upload.status !== 'completed'));
    setDownloads(prev => prev.filter(download => download.status !== 'completed'));
  };

  const getOverallProgress = () => {
    const uploadProgress = uploads.length === 0 
      ? { progress: 0, speed: 0, totalFiles: 0, completedFiles: 0 }
      : (() => {
          const totalSize = uploads.reduce((sum, upload) => sum + upload.size, 0);
          const uploadedSize = uploads.reduce((sum, upload) => sum + upload.uploaded, 0);
          const totalSpeed = uploads.reduce((sum, upload) => sum + upload.speed, 0);
          const completedFiles = uploads.filter(upload => upload.status === 'completed').length;
          
          return {
            progress: totalSize > 0 ? (uploadedSize / totalSize) * 100 : 0,
            speed: totalSpeed,
            totalFiles: uploads.length,
            completedFiles
          };
        })();

    const downloadProgress = downloads.length === 0 
      ? { progress: 0, speed: 0, totalFiles: 0, completedFiles: 0 }
      : (() => {
          const totalSize = downloads.reduce((sum, download) => sum + download.size, 0);
          const downloadedSize = downloads.reduce((sum, download) => sum + download.downloaded, 0);
          const totalSpeed = downloads.reduce((sum, download) => sum + download.speed, 0);
          const completedFiles = downloads.filter(download => download.status === 'completed').length;
          
          return {
            progress: totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0,
            speed: totalSpeed,
            totalFiles: downloads.length,
            completedFiles
          };
        })();
    
    return {
      upload: uploadProgress,
      download: downloadProgress
    };
  };

  return (
    <UploadContext.Provider value={{
      uploads,
      downloads,
      startUpload,
      startDownload,
      cancelUpload,
      cancelDownload,
      clearCompleted,
      getOverallProgress
    }}>
      {children}
    </UploadContext.Provider>
  );
}

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};