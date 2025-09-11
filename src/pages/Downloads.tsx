import React from 'react';
import { Download, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useUpload } from '@/contexts/UploadContext';
import Navbar from '@/components/Navbar';

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

const Downloads: React.FC = () => {
  const { 
    uploads, 
    downloads, 
    cancelUpload, 
    cancelDownload, 
    clearCompleted, 
    getOverallProgress 
  } = useUpload();

  const overall = getOverallProgress();

  const renderTransferItem = (item: typeof uploads[0] | typeof downloads[0], isUpload: boolean) => {
    const cancelFn = isUpload ? cancelUpload : cancelDownload;
    const transferred = isUpload ? (item as typeof uploads[0]).uploaded : (item as typeof downloads[0]).downloaded;
    
    return (
      <Card key={item.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {item.status === 'completed' && (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              )}
              {item.status === 'error' && (
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              )}
              {(item.status === 'uploading' || item.status === 'downloading' || item.status === 'pending') && (
                <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
              )}
              
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{item.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  {item.groupName} • {formatFileSize(item.size)}
                </p>
              </div>
            </div>
            
            {item.status !== 'completed' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => cancelFn(item.id)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {(item.status === 'uploading' || item.status === 'downloading') && (
            <div className="space-y-2">
              <Progress value={item.progress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{Math.round(item.progress)}% complete</span>
                <div className="flex gap-4">
                  <span>{formatFileSize(transferred)}/{formatFileSize(item.size)}</span>
                  <span>{formatSpeed(item.speed)}</span>
                </div>
              </div>
            </div>
          )}
          
          {item.status === 'error' && (
            <div className="mt-2 p-2 bg-destructive/10 text-destructive text-sm rounded">
              {item.error}
            </div>
          )}
          
          {item.status === 'completed' && (
            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
              ✓ {isUpload ? 'Upload' : 'Download'} completed successfully
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Downloads & Uploads</h1>
            <p className="text-muted-foreground mt-1">
              Track your file transfers in real-time
            </p>
          </div>
          
          {(uploads.length > 0 || downloads.length > 0) && (
            <Button onClick={clearCompleted} variant="outline">
              Clear Completed
            </Button>
          )}
        </div>

        <Tabs defaultValue="uploads" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="uploads" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Uploads ({uploads.length})
            </TabsTrigger>
            <TabsTrigger value="downloads" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Downloads ({downloads.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="uploads" className="space-y-6">
            {overall.upload.totalFiles > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Overall Upload Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={overall.upload.progress} className="h-3 mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {overall.upload.completedFiles} of {overall.upload.totalFiles} files completed
                    </span>
                    <span>{formatSpeed(overall.upload.speed)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {uploads.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No uploads yet</h3>
                    <p className="text-muted-foreground">
                      Upload files to groups to see them here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                uploads.map((upload) => renderTransferItem(upload, true))
              )}
            </div>
          </TabsContent>

          <TabsContent value="downloads" className="space-y-6">
            {overall.download.totalFiles > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Overall Download Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={overall.download.progress} className="h-3 mb-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {overall.download.completedFiles} of {overall.download.totalFiles} files completed
                    </span>
                    <span>{formatSpeed(overall.download.speed)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {downloads.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Download className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No downloads yet</h3>
                    <p className="text-muted-foreground">
                      Download files from groups to see them here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                downloads.map((download) => renderTransferItem(download, false))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Downloads;