import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, X, FolderPlus, Sparkles } from 'lucide-react';
import { useUpload } from '@/contexts/UploadContext';
import { useNavigate } from 'react-router-dom';
import FileEditCard from '@/components/FileEditCard';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: () => void;
}

const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({
  open,
  onOpenChange,
  onGroupCreated,
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { startUpload } = useUpload();

  const resetForm = () => {
    setName('');
    setDescription('');
    setFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Group name is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create file group
      const { data: group, error: groupError } = await supabase
        .from('file_groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
        })
        .select()
        .single();

      if (groupError) {
        toast({
          title: "Error",
          description: "Failed to create group",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Group "${name}" created successfully`,
      });

      // Close dialog immediately and redirect
      resetForm();
      onOpenChange(false);
      onGroupCreated();
      
      // Redirect to the new group first
      navigate(`/group/${group.id}`);

      // Start background uploads if files are selected (after redirect)
      if (files && files.length > 0) {
        const fileList = new DataTransfer();
        files.forEach(file => fileList.items.add(file));
        await startUpload(group.id, group.name, fileList.files);
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const renameFile = (index: number, newName: string) => {
    setFiles(prev => prev.map((file, i) => {
      if (i === index) {
        // Create a new File object with the new name
        const renamedFile = new File([file], newName, { type: file.type });
        return renamedFile;
      }
      return file;
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col mx-2 sm:mx-4 w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)]">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <FolderPlus className="h-5 w-5 text-primary" />
            </div>
            Create New Group
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </DialogTitle>
          <DialogDescription className="text-base">
            Create a new file group to organize your files with style
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Group Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a descriptive name"
              disabled={isLoading}
              required
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description to help organize your files"
              disabled={isLoading}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="files" className="text-sm font-medium">Files (Optional)</Label>
            <div className="relative">
              <div className="border-2 border-dashed border-border rounded-xl p-6 sm:p-8 text-center bg-muted/20 hover:bg-muted/30 transition-all duration-300 group cursor-pointer">
                <Upload className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                <input
                  id="files"
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isLoading}
                />
                <Label
                  htmlFor="files"
                  className="cursor-pointer text-sm text-muted-foreground group-hover:text-foreground transition-colors block font-medium"
                >
                  Click to select files or drag and drop
                </Label>
                <p className="text-xs text-muted-foreground mt-2">
                  Files will be uploaded instantly after group creation
                </p>
              </div>
            </div>
          </div>

          {files && files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Selected Files ({files.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFiles([]);
                  }}
                  disabled={isLoading}
                  className="text-xs h-8 px-3 text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground cursor-pointer transition-all"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
              <div className="max-h-48 sm:max-h-64 overflow-y-auto space-y-2 rounded-lg border p-3 bg-muted/10">
                {files.map((file, index) => (
                  <FileEditCard
                    key={`${file.name}-${index}`}
                    file={file}
                    onRemove={() => removeFile(index)}
                    onRename={(newName) => renameFile(index, newName)}
                    className="bg-background/50"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 btn-glass"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="flex-1 btn-gradient relative overflow-hidden"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FolderPlus className="h-4 w-4" />
                  Create Group
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGroupDialog;