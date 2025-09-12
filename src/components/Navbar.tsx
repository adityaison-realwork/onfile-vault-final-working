import React from 'react';
import { Settings, FileText, Sun, Moon, Download, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useUpload } from '@/contexts/UploadContext';

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { downloads } = useUpload();
  const hasActiveDownloads = downloads.some(d => d.status === 'downloading' || d.status === 'pending');

  return (
    <nav className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 navbar-brand">
          <FileText className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">Onfile</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <Link 
            to="/downloads" 
            className="relative p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Downloads"
          >
            <Download className={`h-5 w-5 transition-colors ${hasActiveDownloads ? 'text-primary animate-bounce' : 'text-muted-foreground hover:text-foreground'}`} />
            {hasActiveDownloads && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
            )}
          </Link>
          
          <Link 
            to="/storage" 
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Storage"
          >
            <HardDrive className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 h-9 w-9"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          <Link 
            to="/settings" 
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;