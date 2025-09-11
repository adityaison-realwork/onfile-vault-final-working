import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface EditGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupData;
  onGroupUpdated: () => void;
}

const EditGroupDialog: React.FC<EditGroupDialogProps> = ({
  open,
  onOpenChange,
  group,
  onGroupUpdated,
}) => {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [files, setFiles] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setName(group.name);
    setDescription(group.description || '');
  }, [group]);

  const resetForm = () => {
    setName(group.name);
    setDescription(group.description || '');
    setFiles(null);
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
      // Update group info
      const { error: groupError } = await supabase
        .from('file_groups')
        .update({
          name: name.trim(),
          description: description.trim() || null,
        })
        .eq('id', group.id);

      if (groupError) {
        toast({
          title: "Error",
          description: "Failed to update group",
          variant: "destructive",
        });
        return;
      }

      // Upload new files if any
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileId = crypto.randomUUID();
          const fileName = `${fileId}-${file.name}`;
          const storagePath = `groups/${group.id}/${fileName}`;

          try {
            // Upload to storage
            const { error: uploadError } = await supabase.storage
              .from('onfile-storage')
              .upload(storagePath, file);

            if (uploadError) {
              console.error('Upload error:', uploadError);
              continue;
            }

            // Save file record
            await supabase.from('files').insert({
              id: fileId,
              group_id: group.id,
              name: file.name,
              storage_path: storagePath,
              mime_type: file.type || 'application/octet-stream',
              file_size: file.size,
            });
          } catch (error) {
            console.error('Error processing file:', file.name, error);
          }
        }
      }

      toast({
        title: "Success",
        description: "Group updated successfully",
      });

      resetForm();
      onGroupUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: "Error",
        description: "Failed to update group",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    if (files) {
      const newFiles = Array.from(files);
      newFiles.splice(index, 1);
      const dt = new DataTransfer();
      newFiles.forEach(file => dt.items.add(file));
      setFiles(dt.files);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Update group information and add new files
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Add New Files</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <input
                id="files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
              />
              <Label
                htmlFor="files"
                className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
              >
                Click to select files or drag and drop
              </Label>
            </div>
          </div>

          {files && files.length > 0 && (
            <div className="space-y-2">
              <Label>New Files ({files.length})</Label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {Array.from(files).map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <span className="truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                  Updating...
                </div>
              ) : (
                'Update Group'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGroupDialog;