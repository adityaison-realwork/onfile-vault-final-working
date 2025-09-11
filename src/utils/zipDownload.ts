import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';

interface FileToDownload {
  id: string;
  name: string;
  storage_path: string;
  file_size: number;
}

export const downloadFilesAsZip = async (
  files: FileToDownload[],
  zipName: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  const zip = new JSZip();
  
  // Download all files and add to zip
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const { data, error } = await supabase.storage
        .from('onfile-storage')
        .download(file.storage_path);
      
      if (error) {
        console.error(`Error downloading ${file.name}:`, error);
        continue;
      }
      
      // Add file to zip
      zip.file(file.name, data);
      
      // Update progress
      const progress = ((i + 1) / files.length) * 100;
      onProgress?.(progress);
    } catch (error) {
      console.error(`Error downloading ${file.name}:`, error);
    }
  }
  
  // Generate zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  // Create download link
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${zipName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadFileIndividually = async (file: FileToDownload): Promise<void> => {
  try {
    const { data, error } = await supabase.storage
      .from('onfile-storage')
      .download(file.storage_path);

    if (error) {
      throw new Error(error.message);
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(`Error downloading ${file.name}:`, error);
    throw error;
  }
};