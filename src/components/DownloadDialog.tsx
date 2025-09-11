import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, Archive, Files, Shuffle, Sparkles } from 'lucide-react';

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileCount: number;
  onDownload: (asZip: boolean, zipName?: string) => void;
}

const generateRandomZipName = (): string => {
  const adjectives = ['Quick', 'Smart', 'Super', 'Magic', 'Epic', 'Cool', 'Swift', 'Bold', 'Prime', 'Ultra'];
  const nouns = ['Files', 'Pack', 'Bundle', 'Archive', 'Collection', 'Set', 'Batch', 'Group', 'Cache', 'Vault'];
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 999) + 1;
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

  const resetState = () => {
    setZipName('');
    setDownloadType('individual');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetState();
    }}>
      <DialogContent className="sm:max-w-lg bg-card border border-border/50 shadow-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-lg bg-primary/10">
              <Download className="h-5 w-5 text-primary" />
            </div>
            Download {fileCount} {fileCount === 1 ? 'File' : 'Files'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose your preferred download method below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <RadioGroup
            value={downloadType}
            onValueChange={(value) => setDownloadType(value as 'individual' | 'zip')}
            className="space-y-4"
          >
            {/* Individual Download Option */}
            <div className="relative">
              <div className={`rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer hover:border-primary/50 ${
                downloadType === 'individual' 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border'
              }`}>
                <Label htmlFor="individual" className="flex items-start gap-4 cursor-pointer">
                  <RadioGroupItem value="individual" id="individual" className="mt-1" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Files className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Download Individually</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Each file downloads separately - perfect for selective saving and organization
                    </p>
                  </div>
                </Label>
              </div>
            </div>

            {/* ZIP Download Option */}
            <div className="relative">
              <div className={`rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer hover:border-primary/50 ${
                downloadType === 'zip' 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-border'
              }`}>
                <Label htmlFor="zip" className="flex items-start gap-4 cursor-pointer">
                  <RadioGroupItem value="zip" id="zip" className="mt-1" />
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Download as ZIP Archive</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      All files compressed into one convenient archive - ideal for bulk transfers
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>

          {/* ZIP Name Configuration */}
          {downloadType === 'zip' && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="h-px bg-border/50" />
              
              <div className="space-y-3">
                <Label htmlFor="zipName" className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Archive Name
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    id="zipName"
                    value={zipName}
                    onChange={(e) => setZipName(e.target.value)}
                    placeholder="Enter custom name (optional)"
                    className="flex-1 bg-background/50"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRandomName}
                    className="px-4 hover:bg-primary/10 hover:border-primary/50"
                    title="Generate random name"
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  💡 Leave empty for auto-generated name
                </p>
              </div>
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
            onClick={handleDownload}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadType === 'zip' ? 'Create ZIP' : 'Download Files'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadDialog;