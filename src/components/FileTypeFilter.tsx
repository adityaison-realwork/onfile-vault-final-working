import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { X, Search } from 'lucide-react';

interface FileTypeFilterProps {
  selectedExtensions: string[];
  onExtensionsChange: (extensions: string[]) => void;
  className?: string;
}

const commonExtensions = [
  { ext: '.pdf', label: 'PDF Documents', color: 'bg-red-100 text-red-800' },
  { ext: '.docx', label: 'Word Documents', color: 'bg-blue-100 text-blue-800' },
  { ext: '.xlsx', label: 'Excel Files', color: 'bg-green-100 text-green-800' },
  { ext: '.pptx', label: 'PowerPoint', color: 'bg-orange-100 text-orange-800' },
  { ext: '.jpg', label: 'JPEG Images', color: 'bg-purple-100 text-purple-800' },
  { ext: '.png', label: 'PNG Images', color: 'bg-purple-100 text-purple-800' },
  { ext: '.mp4', label: 'Videos', color: 'bg-indigo-100 text-indigo-800' },
  { ext: '.zip', label: 'Archives', color: 'bg-gray-100 text-gray-800' },
  { ext: '.txt', label: 'Text Files', color: 'bg-yellow-100 text-yellow-800' },
];

const FileTypeFilter: React.FC<FileTypeFilterProps> = ({
  selectedExtensions,
  onExtensionsChange,
  className = '',
}) => {
  const [customExtension, setCustomExtension] = useState('');

  const handleAddExtension = (ext: string) => {
    const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
    if (normalizedExt.length > 1 && !selectedExtensions.includes(normalizedExt)) {
      onExtensionsChange([...selectedExtensions, normalizedExt]);
    }
  };

  const handleRemoveExtension = (ext: string) => {
    onExtensionsChange(selectedExtensions.filter(e => e !== ext));
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customExtension.trim()) {
      handleAddExtension(customExtension.trim());
      setCustomExtension('');
    }
  };

  const clearAllFilters = () => {
    onExtensionsChange([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selected Extensions */}
      {selectedExtensions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Active Filters</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-6 px-2 text-muted-foreground hover:text-destructive"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedExtensions.map((ext) => (
              <Badge
                key={ext}
                variant="secondary"
                className="text-xs px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20"
              >
                {ext}
                <button
                  onClick={() => handleRemoveExtension(ext)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Common Extensions */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Common File Types</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {commonExtensions.map((item) => (
            <button
              key={item.ext}
              onClick={() => handleAddExtension(item.ext)}
              disabled={selectedExtensions.includes(item.ext)}
              className={`p-2 rounded-lg text-left text-xs transition-all duration-300 ${
                selectedExtensions.includes(item.ext)
                  ? 'bg-primary/20 text-primary cursor-not-allowed opacity-50'
                  : 'bg-muted/50 hover:bg-muted hover:scale-105 cursor-pointer'
              }`}
            >
              <div className="font-medium">{item.ext}</div>
              <div className="text-muted-foreground text-xs">{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Extension Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Custom File Extension</Label>
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={customExtension}
              onChange={(e) => setCustomExtension(e.target.value)}
              placeholder="Type extension (e.g., .ai, .sketch)"
              className="pl-10"
            />
          </div>
          <Button type="submit" size="sm" disabled={!customExtension.trim()}>
            Add
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Enter any file extension to filter by custom file types
        </p>
      </div>
    </div>
  );
};

export default FileTypeFilter;