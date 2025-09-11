import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Archive, Files, Shuffle } from 'lucide-react';

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileCount: number;
  onDownload: (asZip: boolean, zipName?: string) => void;
}

const generateRandomZipName = (): string => {
  const adjectives = ['Quick', 'Smart', 'Super', 'Magic', 'Epic', 'Cool', 'Swift', 'Bold'];
  const nouns = ['Files', 'Pack', 'Bundle', 'Archive', 'Collection', 'Set', 'Batch', 'Group'];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  return `${randomAdjective}_${randomNoun}_${randomNumber}`;
};

const DownloadDialog: React.FC<DownloadDialogProps> = ({
  open,
  onOpenChange,
  fileCount,
  onDownload,
}) => {
  const [downloadType, setDownloadType] = useState<'individual' | 'zip'>('individual');
  const [zipName, setZipName] = useState('');

  const handleRandomName = () => {
    setZipName(generateRandomZipName());
  };

  const handleDownload = () => {
    if (downloadType === 'zip') {
      const finalZipName = zipName.trim() || generateRandomZipName();
      onDownload(true, finalZipName);
    } else {
      onDownload(false);
    }
    onOpenChange(false);
    setZipName('');
    setDownloadType('individual');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gradient-card z-[9999] pointer-events-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Download {fileCount} Files
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to download these files
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 pointer-events-auto">
          {/* Download Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Download Options</Label>
            
            {/* Individual Files Option */}
            <button 
              type="button"
              className={`w-full p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 text-left pointer-events-auto ${
                downloadType === 'individual' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-border/80'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDownloadType('individual');
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 transition-all duration-300 ${
                  downloadType === 'individual' 
                    ? 'border-primary bg-primary' 
                    : 'border-muted-foreground'
                }`}>
                  {downloadType === 'individual' && (
                    <div className="w-full h-full rounded-full bg-background scale-50"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Files className="h-4 w-4 text-primary" />
                    <span className="font-medium">Download Individually</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Each file will be downloaded separately to your device
                  </p>
                </div>
              </div>
            </button>

            {/* Zip Archive Option */}
            <button 
              type="button"
              className={`w-full p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 text-left pointer-events-auto ${
                downloadType === 'zip' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-border/80'
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDownloadType('zip');
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 transition-all duration-300 ${
                  downloadType === 'zip' 
                    ? 'border-primary bg-primary' 
                    : 'border-muted-foreground'
                }`}>
                  {downloadType === 'zip' && (
                    <div className="w-full h-full rounded-full bg-background scale-50"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Archive className="h-4 w-4 text-primary" />
                    <span className="font-medium">Download as ZIP Archive</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    All files will be compressed into a single ZIP file
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* ZIP Name Input */}
          {downloadType === 'zip' && (
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="zipName" className="text-sm font-medium">
                ZIP File Name (Optional)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="zipName"
                  value={zipName}
                  onChange={(e) => setZipName(e.target.value)}
                  placeholder="Enter custom name or leave empty"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRandomName();
                  }}
                  className="px-3 pointer-events-auto"
                  title="Generate random name"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to auto-generate a name
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDownload();
            }}
            className="flex-1 btn-gradient pointer-events-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Download {downloadType === 'zip' ? 'ZIP' : 'Files'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadDialog;