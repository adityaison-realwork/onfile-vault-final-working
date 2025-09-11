import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Edit, Trash2, Upload, MoreVertical, FileText, File, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import EditGroupDialog from '@/components/EditGroupDialog';
import EnhancedFileItem from '@/components/EnhancedFileItem';
import { useUpload } from '@/contexts/UploadContext';
import SearchAndFilter, { SortOption, FilterOption } from '@/components/SearchAndFilter';
import DownloadDialog from '@/components/DownloadDialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface FileData {
  id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  created_at: string;
}

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const GroupDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startDownload, startUpload, uploads, getOverallProgress } = useUpload();
  const [group, setGroup] = useState<GroupData | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [fileTypeExtensions, setFileTypeExtensions] = useState<string[]>([]);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showSelectedDownloadDialog, setShowSelectedDownloadDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGroupData();
    }
  }, [id]);

  const fetchGroupData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);

      // Fetch group data
      const { data: groupData, error: groupError } = await supabase
        .from('file_groups')
        .select('*')
        .eq('id', id)
        .single();

      if (groupError) {
        toast({
          title: "Error",
          description: "Group not found",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setGroup(groupData);

      // Fetch files
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('group_id', id)
        .order('created_at', { ascending: false });

      if (filesError) {
        console.error('Error fetching files:', filesError);
      } else {
        setFiles(filesData || []);
      }
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast({
        title: "Error",
        description: "Failed to load group data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!id) return;

    try {
      // Delete all files from storage first
      for (const file of files) {
        await supabase.storage
          .from('onfile-storage')
          .remove([file.storage_path]);
      }

      // Delete group (cascade will handle file records)
      const { error } = await supabase
        .from('file_groups')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete group",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Group deleted successfully",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    }
  };

  const downloadAllFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "Info",
        description: "No files to download",
      });
      return;
    }

    if (files.length === 1) {
      // Single file - download directly
      await downloadFile(files[0]);
    } else {
      // Multiple files - show download dialog
      setShowDownloadDialog(true);
    }
  };

  const downloadFile = async (file: FileData) => {
    if (group) {
      await startDownload([{
        id: file.id,
        name: file.name,
        storage_path: file.storage_path,
        file_size: file.file_size
      }], group.id, group.name);
    }
  };

  const downloadSelectedFiles = async () => {
    if (selectedFiles.size === 0 || !group) return;
    
    const filesToDownload = files
      .filter(file => selectedFiles.has(file.id))
      .map(file => ({
        id: file.id,
        name: file.name,
        storage_path: file.storage_path,
        file_size: file.file_size
      }));

    if (filesToDownload.length === 1) {
      // Single file - download directly
      await startDownload(filesToDownload, group.id, group.name);
      setSelectionMode(false);
      setSelectedFiles(new Set());
    } else {
      // Multiple files - show download dialog
      setShowSelectedDownloadDialog(true);
    }
  };

  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return;
    
    const filesToDelete = files.filter(file => selectedFiles.has(file.id));
    
    try {
      // Delete from storage
      const storagePromises = filesToDelete.map(file =>
        supabase.storage.from('onfile-storage').remove([file.storage_path])
      );
      await Promise.all(storagePromises);

      // Delete from database
      const { error } = await supabase
        .from('files')
        .delete()
        .in('id', Array.from(selectedFiles));

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete some files",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${selectedFiles.size} files deleted successfully`,
      });

      setSelectionMode(false);
      setSelectedFiles(new Set());
      fetchGroupData();
    } catch (error) {
      console.error('Error deleting files:', error);
      toast({
        title: "Error",
        description: "Failed to delete files",
        variant: "destructive",
      });
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedFiles(new Set());
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(file => file.id)));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && group) {
      await startUpload(group.id, group.name, files);
      
      toast({
        title: "Upload Started",
        description: `Uploading ${files.length} files to ${group.name}`,
      });
    }
    
    // Reset input
    e.target.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(file =>
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.mime_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply file type extension filter
    if (fileTypeExtensions.length > 0) {
      filtered = filtered.filter(file =>
        fileTypeExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext.toLowerCase())
        )
      );
    }

    // Apply type filter  
    switch (filterBy) {
      case 'recent':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(file => new Date(file.created_at) >= sevenDaysAgo);
        break;
      case 'large':
        filtered = filtered.filter(file => file.file_size > 10 * 1024 * 1024); // 10MB
        break;
      case 'documents':
        filtered = filtered.filter(file => 
          file.mime_type.includes('document') || 
          file.mime_type.includes('pdf') || 
          file.mime_type.includes('text')
        );
        break;
      case 'images':
        filtered = filtered.filter(file => file.mime_type.startsWith('image/'));
        break;
      case 'archives':
        filtered = filtered.filter(file => 
          file.mime_type.includes('zip') || 
          file.mime_type.includes('rar') || 
          file.mime_type.includes('archive')
        );
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'size-asc':
        filtered.sort((a, b) => a.file_size - b.file_size);
        break;
      case 'size-desc':
        filtered.sort((a, b) => b.file_size - a.file_size);
        break;
    }

    return filtered;
  }, [files, searchTerm, sortBy, filterBy, fileTypeExtensions]);

  // Get current uploads for this group
  const currentUploads = uploads.filter(upload => upload.groupId === id);
  const overallProgress = getOverallProgress();
  const hasActiveUploads = currentUploads.length > 0;

  // Auto-refresh files when uploads complete
  useEffect(() => {
    const completedUploads = currentUploads.filter(upload => upload.status === 'completed');
    if (completedUploads.length > 0) {
      fetchGroupData();
    }
  }, [currentUploads.map(u => u.status).join(',')]);

  // Auto-clear completed uploads
  useEffect(() => {
    if (currentUploads.length > 0 && currentUploads.every(upload => upload.status === 'completed')) {
      setTimeout(() => {
        // This will be handled by the UploadContext auto-clear
      }, 2000);
    }
  }, [currentUploads]);

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!group) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">Group not found</h1>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header Section - Fixed for Desktop */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="p-2 flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold">{group.name}</h1>
              {group.description && (
                <p className="text-muted-foreground mt-1 text-sm sm:text-base line-clamp-2">{group.description}</p>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Created {formatDate(group.created_at)} • {files.length} files
              </p>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {/* Upload Files Button */}
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />
              <Button variant="default" size="sm" className="text-xs sm:text-sm">
                <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Upload Files</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            </div>

            {files.length > 0 && (
              <>
                <Button onClick={toggleSelectionMode} variant="outline" size="sm" className="text-xs sm:text-sm">
                  {selectionMode ? <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" /> : <Square className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />}
                  <span className="hidden sm:inline">{selectionMode ? 'Cancel' : 'Select'}</span>
                  <span className="sm:hidden">{selectionMode ? 'Cancel' : 'Select'}</span>
                </Button>

                {selectionMode && selectedFiles.size > 0 && (
                  <>
                    <Button onClick={downloadSelectedFiles} variant="outline" size="sm" className="text-xs sm:text-sm">
                      <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Download ({selectedFiles.size})
                    </Button>
                    <Button onClick={deleteSelectedFiles} variant="destructive" size="sm" className="text-xs sm:text-sm">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Delete ({selectedFiles.size})
                    </Button>
                  </>
                )}

                {!selectionMode && (
                  <Button onClick={downloadAllFiles} variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Download All</span>
                    <span className="sm:hidden">Download</span>
                  </Button>
                )}
              </>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Group
                </DropdownMenuItem>
                {selectionMode && (
                  <DropdownMenuItem onClick={selectAllFiles}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Upload Status - Show only if there are active uploads for this group */}
        {hasActiveUploads && (
          <Card className="mb-6 border border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Uploading Files ({overallProgress.upload.completedFiles}/{overallProgress.upload.totalFiles})
                </CardTitle>
              </div>
              <div className="space-y-2">
                <Progress value={overallProgress.upload.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{Math.round(overallProgress.upload.progress)}% complete</span>
                  <span>{formatSpeed(overallProgress.upload.speed)}</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {currentUploads.map((upload) => (
                <div key={upload.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {upload.status === 'completed' && (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                      {upload.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      )}
                      {(upload.status === 'uploading' || upload.status === 'pending') && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{upload.fileName}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(upload.size)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {upload.status === 'uploading' && (
                    <>
                      <Progress value={upload.progress} className="h-1" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{Math.round(upload.progress)}%</span>
                        <div className="flex gap-2">
                          <span>{formatFileSize(upload.uploaded || 0)}/{formatFileSize(upload.size)}</span>
                          <span>{formatSpeed(upload.speed)}</span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {upload.status === 'error' && (
                    <p className="text-xs text-destructive">{upload.error}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        {files.length > 0 && (
          <div className="mb-6">
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              onSortChange={setSortBy}
              filterBy={filterBy}
              onFilterChange={setFilterBy}
              placeholder="Search files by name or type..."
              fileTypeExtensions={fileTypeExtensions}
              onExtensionsChange={setFileTypeExtensions}
            />
          </div>
        )}

        {filteredAndSortedFiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No files yet</h3>
              <p className="text-muted-foreground mb-4">
                Add files to this group to start organizing
              </p>
              <Button onClick={() => setShowEditDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Add Files
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredAndSortedFiles.map((file) => (
              <EnhancedFileItem
                key={file.id}
                file={file}
                onRefresh={fetchGroupData}
                onDownload={() => downloadFile(file)}
                isSelected={selectedFiles.has(file.id)}
                onSelectionChange={(selected) => {
                  const newSelected = new Set(selectedFiles);
                  if (selected) {
                    newSelected.add(file.id);
                  } else {
                    newSelected.delete(file.id);
                  }
                  setSelectedFiles(newSelected);
                }}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        )}

        <EditGroupDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          group={group}
          onGroupUpdated={fetchGroupData}
        />

        <DownloadDialog
          open={showDownloadDialog}
          onOpenChange={setShowDownloadDialog}
          fileCount={files.length}
          onDownload={async (asZip: boolean, zipName?: string) => {
            if (asZip) {
              // ZIP download functionality
              toast({
                title: "Download Started", 
                description: `Creating ${zipName || 'archive'}.zip...`,
              });
              
              // Create ZIP download by passing special parameter to download context
              const filesData = files.map(file => ({
                id: file.id,
                name: file.name,
                storage_path: file.storage_path,
                file_size: file.file_size
              }));
              
              await startDownload(filesData, group.id, group.name, true, zipName);
            } else {
              // Individual downloads
              toast({
                title: "Download Started",
                description: "Downloading files individually...",
              });
              
              for (const file of files) {
                await downloadFile(file);
              }
            }
          }}
        />

        <DownloadDialog
          open={showSelectedDownloadDialog}
          onOpenChange={setShowSelectedDownloadDialog}
          fileCount={selectedFiles.size}
          onDownload={async (asZip: boolean, zipName?: string) => {
            const filesToDownload = files
              .filter(file => selectedFiles.has(file.id))
              .map(file => ({
                id: file.id,
                name: file.name,
                storage_path: file.storage_path,
                file_size: file.file_size
              }));
              
            if (asZip) {
              toast({
                title: "Download Started", 
                description: `Creating ${zipName || 'archive'}.zip...`,
              });              
              await startDownload(filesToDownload, group.id, group.name, true, zipName);
            } else {
              toast({
                title: "Download Started",
                description: "Downloading selected files individually...",
              });
              await startDownload(filesToDownload, group.id, group.name, false);
            }
            
            setSelectionMode(false);
            setSelectedFiles(new Set());
          }}
        />

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Group</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{group.name}"? This will permanently delete all files in this group. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default GroupDetail;