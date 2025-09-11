import React from 'react';
import { X, CheckCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUpload } from '@/contexts/UploadContext';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSecond: number): string => {
  return `${formatFileSize(bytesPerSecond)}/s`;
};

const DownloadStatus: React.FC = () => {
  const { downloads, cancelDownload, clearCompleted, getOverallProgress } = useUpload();
  
  if (downloads.length === 0) return null;

  const overall = getOverallProgress();
  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'pending');
  const hasActiveDownloads = activeDownloads.length > 0;

  return (
    <Card className="fixed bottom-4 left-4 w-80 max-w-[calc(100vw-2rem)] max-h-96 overflow-hidden z-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" />
            Downloads {hasActiveDownloads && `(${overall.download.completedFiles}/${overall.download.totalFiles})`}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearCompleted}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {hasActiveDownloads && (
          <div className="space-y-2">
            <Progress value={overall.download.progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(overall.download.progress)}% complete</span>
              <span>{formatSpeed(overall.download.speed)}</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="max-h-64 overflow-y-auto space-y-3">
        {downloads.map((download) => (
          <div key={download.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {download.status === 'completed' && (
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                )}
                {download.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                )}
                {(download.status === 'downloading' || download.status === 'pending') && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{download.fileName}</p>
                  <p className="text-xs text-muted-foreground truncate">{download.groupName}</p>
                </div>
              </div>
              {download.status !== 'completed' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => cancelDownload(download.id)}
                  className="flex-shrink-0 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {download.status === 'downloading' && (
              <>
                <Progress value={download.progress} className="h-1" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(download.progress)}%</span>
                  <div className="flex gap-2">
                    <span>{formatFileSize(download.downloaded || 0)}/{formatFileSize(download.size)}</span>
                    <span>{formatSpeed(download.speed)}</span>
                  </div>
                </div>
              </>
            )}
            
            {download.status === 'error' && (
              <p className="text-xs text-destructive">{download.error}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DownloadStatus;