import React, { useState } from 'react';
import { Pencil, X, Check, FileText, Image, Archive, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileEditCardProps {
  file: File;
  onRemove: () => void;
  onRename: (newName: string) => void;
  className?: string;
}

const FileEditCard: React.FC<FileEditCardProps> = ({ file, onRemove, onRename, className = "" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(file.name);

  const handleSave = () => {
    if (editedName.trim() && editedName !== file.name) {
      onRename(editedName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(file.name);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) {
      return <Image className="h-4 w-4 text-primary" />;
    }
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) {
      return <Archive className="h-4 w-4 text-orange-500" />;
    }
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  const getFileTypeLabel = () => {
    const type = file.type.toLowerCase();
    if (type.startsWith('image/')) return 'Image';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('document')) return 'Document';
    if (type.includes('text')) return 'Text';
    if (type.includes('zip') || type.includes('rar')) return 'Archive';
    return 'File';
  };

  return (
    <div className={`file-card group ${className}`}>
      <div className="flex items-start gap-3">
        {/* File Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getFileIcon()}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0 space-y-1">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyPress}
                className="text-sm h-7 flex-1"
                autoFocus
                onFocus={(e) => {
                  // Select filename without extension
                  const lastDot = e.target.value.lastIndexOf('.');
                  if (lastDot > 0) {
                    e.target.setSelectionRange(0, lastDot);
                  } else {
                    e.target.select();
                  }
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSave}
                className="h-7 w-7 p-0 text-green-500 hover:text-green-600"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {file.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{getFileTypeLabel()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {!isEditing && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
            >
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Shimmer effect for visual appeal */}
      <div className="shimmer-effect absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default FileEditCard;