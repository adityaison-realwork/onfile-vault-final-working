import React, { useState, useEffect, useMemo } from 'react';
import { Plus, FolderOpen, Calendar, FileText, Trash2, CheckSquare, Square, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import CreateGroupDialog from '@/components/CreateGroupDialog';
import Navbar from '@/components/Navbar';
import SearchAndFilter, { SortOption, FilterOption } from '@/components/SearchAndFilter';
import DownloadDialog from '@/components/DownloadDialog';
import { useUpload } from '@/contexts/UploadContext';

interface FileGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  file_count?: number;
  total_size?: number;
  storage_percentage?: number;
}

const Dashboard: React.FC = () => {
  const [fileGroups, setFileGroups] = useState<FileGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState<any[]>([]);
  const { startDownload } = useUpload();

  useEffect(() => {
    fetchFileGroups();
  }, []);

  const fetchFileGroups = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all file groups first
      const { data: groups, error: groupsError } = await supabase
        .from('file_groups')
        .select(`
          id,
          name,
          description,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (groupsError) {
        toast({
          title: "Error",
          description: "Failed to load file groups",
          variant: "destructive",
        });
        return;
      }

      // Fetch files separately for each group
      const groupsWithFiles = await Promise.all(
        (groups || []).map(async (group) => {
          const { data: files } = await supabase
            .from('files')
            .select('file_size')
            .eq('group_id', group.id);
          
          return {
            ...group,
            files: files || []
          };
        })
      );

      // Calculate total storage across all groups
      const totalStorage = groupsWithFiles.reduce((sum, group) => {
        const files = group.files || [];
        const groupSize = files.reduce((groupSum: number, file: any) => 
          groupSum + (file.file_size || 0), 0);
        return sum + groupSize;
      }, 0);

      const groupsWithCount = groupsWithFiles.map(group => {
        const files = group.files || [];
        const groupSize = files.reduce((sum: number, file: any) => 
          sum + (file.file_size || 0), 0);
        const storagePercentage = totalStorage > 0 ? (groupSize / totalStorage) * 100 : 0;
        
        return {
          ...group,
          file_count: files.length,
          total_size: groupSize,
          storage_percentage: storagePercentage
        };
      });

      setFileGroups(groupsWithCount);
    } catch (error) {
      console.error('Error fetching file groups:', error);
      toast({
        title: "Error",
        description: "Failed to load file groups",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedGroups = useMemo(() => {
    let filtered = fileGroups;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    switch (filterBy) {
      case 'recent':
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(group => new Date(group.created_at) >= sevenDaysAgo);
        break;
      case 'large':
        filtered = filtered.filter(group => (group.total_size || 0) > 10 * 1024 * 1024); // 10MB
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
        filtered.sort((a, b) => (a.total_size || 0) - (b.total_size || 0));
        break;
      case 'size-desc':
        filtered.sort((a, b) => (b.total_size || 0) - (a.total_size || 0));
        break;
    }

    return filtered;
  }, [fileGroups, searchTerm, sortBy, filterBy]);

  const handleGroupCreated = () => {
    fetchFileGroups();
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedGroups(new Set());
  };

  const selectAllGroups = () => {
    if (selectedGroups.size === filteredAndSortedGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(filteredAndSortedGroups.map(group => group.id)));
    }
  };

  const downloadSelectedGroups = async () => {
    if (selectedGroups.size === 0) return;
    
    try {
      // Get all files for selected groups
      const { data: files, error } = await supabase
        .from('files')
        .select('id, name, storage_path, file_size')
        .in('group_id', Array.from(selectedGroups));

      if (error || !files || files.length === 0) {
        toast({
          title: "Error",
          description: "No files found in selected groups",
          variant: "destructive",
        });
        return;
      }

      setDownloadingFiles(files);
      setShowDownloadDialog(true);
    } catch (error) {
      console.error('Error preparing download:', error);
      toast({
        title: "Error",
        description: "Failed to prepare download",
        variant: "destructive",
      });
    }
  };

  const handleMassDownload = async (asZip: boolean, zipName?: string) => {
    if (downloadingFiles.length === 0) return;

    setShowDownloadDialog(false);
    
    try {
      await startDownload(downloadingFiles, 'multiple', 'Selected Groups', asZip, zipName);
      toast({
        title: "Download started",
        description: "Track progress in the Downloads page",
      });
    } catch (error) {
      console.error('Error starting downloads:', error);
      toast({
        title: "Error",
        description: "Failed to start downloads",
        variant: "destructive",
      });
    }
  };

  const deleteSelectedGroups = async () => {
    if (selectedGroups.size === 0) return;
    
    try {
      // Get files for all selected groups
      const { data: filesToDelete } = await supabase
        .from('files')
        .select('storage_path')
        .in('group_id', Array.from(selectedGroups));

      // Delete files from storage
      if (filesToDelete && filesToDelete.length > 0) {
        const storagePaths = filesToDelete.map(file => file.storage_path);
        await supabase.storage
          .from('onfile-storage')
          .remove(storagePaths);
      }

      // Delete groups (cascade will handle file records)
      const { error } = await supabase
        .from('file_groups')
        .delete()
        .in('id', Array.from(selectedGroups));

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete some groups",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `${selectedGroups.size} groups deleted successfully`,
      });

      setSelectionMode(false);
      setSelectedGroups(new Set());
      fetchFileGroups();
    } catch (error) {
      console.error('Error deleting groups:', error);
      toast({
        title: "Error",
        description: "Failed to delete groups",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="animate-fade-in">
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                File Groups
              </h1>
              <p className="text-muted-foreground mt-2 text-base sm:text-lg">
                Organize and manage your files in groups with style
              </p>
            </div>
            
            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex gap-2 animate-scale-in">
              {fileGroups.length > 0 && (
                <Button onClick={toggleSelectionMode} variant="outline" size="lg">
                  {selectionMode ? <CheckSquare className="h-5 w-5 mr-2" /> : <Square className="h-5 w-5 mr-2" />}
                  {selectionMode ? 'Cancel' : 'Select'}
                </Button>
              )}
              
              {selectionMode && selectedGroups.size > 0 && (
                <>
                  <Button onClick={downloadSelectedGroups} variant="outline" size="lg">
                    <Download className="h-5 w-5 mr-2" />
                    Download ({selectedGroups.size})
                  </Button>
                  <Button onClick={() => setShowDeleteDialog(true)} variant="destructive" size="lg">
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete ({selectedGroups.size})
                  </Button>
                </>
              )}
              
              {selectionMode && (
                <Button onClick={selectAllGroups} variant="outline" size="lg">
                  <CheckSquare className="h-5 w-5 mr-2" />
                  {selectedGroups.size === filteredAndSortedGroups.length ? 'Deselect All' : 'Select All'}
                </Button>
              )}
              
              <Button onClick={() => setShowCreateDialog(true)} size="lg" className="btn-gradient">
                <Plus className="h-5 w-5 mr-2" />
                <span className="hidden md:inline">Create Group</span>
                <span className="md:hidden">Create</span>
              </Button>
            </div>
          </div>

          {/* Mobile Actions (Top) */}
          <div className="sm:hidden flex flex-wrap items-center gap-2 mb-4">
            {fileGroups.length > 0 && (
              <Button onClick={toggleSelectionMode} variant="outline" size="sm">
                {selectionMode ? 'Cancel' : 'Select'}
              </Button>
            )}
            {selectionMode && selectedGroups.size > 0 && (
              <>
                <Button onClick={downloadSelectedGroups} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
                <Button onClick={() => setShowDeleteDialog(true)} variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </>
            )}
            {selectionMode && (
              <Button onClick={selectAllGroups} variant="outline" size="sm">
                <CheckSquare className="h-4 w-4 mr-1" />
                {selectedGroups.size === filteredAndSortedGroups.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="mb-8 animate-fade-in">
            <SearchAndFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              sortBy={sortBy}
              onSortChange={setSortBy}
              filterBy={filterBy}
              onFilterChange={setFilterBy}
              placeholder="Search groups by name or description..."
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse gradient-card">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4 shimmer-effect"></div>
                    <div className="h-4 bg-muted rounded w-1/2 shimmer-effect"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-muted rounded w-full mb-2 shimmer-effect"></div>
                    <div className="h-4 bg-muted rounded w-2/3 shimmer-effect"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredAndSortedGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl animate-pulse-glow"></div>
                <FolderOpen className="h-16 w-16 text-primary relative z-10" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                {searchTerm ? 'No groups found' : 'No file groups yet'}
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md text-lg leading-relaxed">
                {searchTerm 
                  ? `No groups match "${searchTerm}". Try adjusting your search or filters.`
                  : 'Create your first file group to start organizing and sharing files between your devices'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateDialog(true)} size="lg" className="btn-gradient">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Group
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
              {filteredAndSortedGroups.map((group, index) => (
                <div key={group.id} className="relative">
                  {selectionMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <div 
                        className={`w-6 h-6 rounded-md border-2 cursor-pointer transition-all duration-300 ${
                          selectedGroups.has(group.id) 
                            ? 'bg-primary border-primary' 
                            : 'bg-background border-border hover:border-primary'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newSelected = new Set(selectedGroups);
                          if (selectedGroups.has(group.id)) {
                            newSelected.delete(group.id);
                          } else {
                            newSelected.add(group.id);
                          }
                          setSelectedGroups(newSelected);
                        }}
                      >
                        {selectedGroups.has(group.id) && (
                          <CheckSquare className="h-4 w-4 text-primary-foreground absolute top-0.5 left-0.5" />
                        )}
                      </div>
                    </div>
                  )}
                  
                  <Link to={selectionMode ? '#' : `/group/${group.id}`} className="block">
                    <Card 
                      className={`file-card group h-full gradient-card transition-all duration-300 hover:shadow-2xl ${
                        selectionMode ? 'cursor-pointer' : ''
                      } ${selectedGroups.has(group.id) ? 'ring-2 ring-primary' : ''}`}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={selectionMode ? (e) => {
                        e.preventDefault();
                        const newSelected = new Set(selectedGroups);
                        if (selectedGroups.has(group.id)) {
                          newSelected.delete(group.id);
                        } else {
                          newSelected.add(group.id);
                        }
                        setSelectedGroups(newSelected);
                      } : undefined}
                    >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0">
                            <FolderOpen className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                          </div>
                          <CardTitle className="text-base sm:text-lg truncate group-hover:text-primary transition-colors">
                            {group.name}
                          </CardTitle>
                        </div>
                      </div>
                      {group.description && (
                        <CardDescription className="text-sm line-clamp-2 mt-3 leading-relaxed">
                          {group.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="font-medium">{group.file_count || 0} files</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="truncate">{formatDate(group.created_at)}</span>
                          </div>
                        </div>
                        {group.total_size !== undefined && group.total_size > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span className="font-medium">Storage: {formatFileSize(group.total_size)}</span>
                              <span>{group.storage_percentage?.toFixed(1)}% of total</span>
                            </div>
                            <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-2 rounded-full transition-all duration-700 ease-out"
                                style={{ 
                                  width: `${Math.min(group.storage_percentage || 0, 100)}%`,
                                  background: 'var(--gradient-primary)'
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                </div>
              ))}
            </div>
          )}

          {/* Mobile Action Buttons */}
          <div className="sm:hidden">
            {selectionMode ? (
              <div className="fixed bottom-4 left-4 right-4 flex gap-2 z-40">
                <Button onClick={toggleSelectionMode} variant="outline" className="flex-1">
                  Cancel Selection
                </Button>
                {selectedGroups.size > 0 && (
                  <>
                    <Button onClick={downloadSelectedGroups} variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button onClick={() => setShowDeleteDialog(true)} variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                <Button onClick={selectAllGroups} variant="outline" size="sm">
                  <CheckSquare className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="fixed bottom-4 right-4 z-40">
                <button 
                  className="fab animate-pulse-glow"
                  onClick={() => setShowCreateDialog(true)}
                  aria-label="Create new group"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>
            )}
          </div>

          <CreateGroupDialog 
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onGroupCreated={handleGroupCreated}
          />

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Selected Groups</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedGroups.size} group{selectedGroups.size > 1 ? 's' : ''}? This will permanently delete all files in {selectedGroups.size > 1 ? 'these groups' : 'this group'}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={deleteSelectedGroups} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete {selectedGroups.size > 1 ? 'Groups' : 'Group'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <DownloadDialog
            open={showDownloadDialog}
            onOpenChange={setShowDownloadDialog}
            fileCount={downloadingFiles.length}
            onDownload={handleMassDownload}
          />
        </div>
      </div>
    </>
  );
};

export default Dashboard;