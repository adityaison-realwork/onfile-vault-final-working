import React, { useState, useEffect } from 'react';
import { HardDrive, FolderOpen, Database, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

interface StorageInfo {
  totalStorage: number;
  usedStorage: number;
  availableStorage: number;
  usagePercentage: number;
}

interface GroupStorageInfo {
  id: string;
  name: string;
  fileCount: number;
  totalSize: number;
  percentage: number;
  percentageOfTotal: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const Storage: React.FC = () => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [groupStorage, setGroupStorage] = useState<GroupStorageInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'total' | 'used'>('total');

  useEffect(() => {
    fetchStorageInfo();
  }, []);

  const fetchStorageInfo = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all files to calculate storage usage
      const { data: files, error: filesError } = await supabase
        .from('files')
        .select(`
          id,
          file_size,
          group_id,
          file_groups!inner(id, name)
        `);

      if (filesError) {
        toast({
          title: "Error",
          description: "Failed to load storage information",
          variant: "destructive",
        });
        return;
      }

      // Calculate total used storage
      const totalUsed = files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
      
      // Supabase free tier has 1GB storage (1,073,741,824 bytes)
      // For demo purposes, we'll assume 1GB total storage
      const totalStorage = 1073741824; // 1GB in bytes
      const availableStorage = totalStorage - totalUsed;
      const usagePercentage = (totalUsed / totalStorage) * 100;

      setStorageInfo({
        totalStorage,
        usedStorage: totalUsed,
        availableStorage,
        usagePercentage
      });

      // Group files by group and calculate storage per group
      const groupMap = new Map<string, {
        name: string;
        files: Array<{file_size: number}>;
      }>();

      files?.forEach(file => {
        const groupId = file.group_id;
        const groupName = file.file_groups?.name || 'Unknown Group';
        
        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, {
            name: groupName,
            files: []
          });
        }
        
        groupMap.get(groupId)!.files.push({ file_size: file.file_size });
      });

      const groupStorageData: GroupStorageInfo[] = Array.from(groupMap.entries()).map(([id, data]) => {
        const totalSize = data.files.reduce((sum, file) => sum + (file.file_size || 0), 0);
        const percentageOfUsed = totalUsed > 0 ? (totalSize / totalUsed) * 100 : 0;
        const percentageOfTotal = totalStorage > 0 ? (totalSize / totalStorage) * 100 : 0;
        
        return {
          id,
          name: data.name,
          fileCount: data.files.length,
          totalSize,
          percentage: percentageOfUsed,
          percentageOfTotal: percentageOfTotal
        };
      }).sort((a, b) => b.totalSize - a.totalSize);

      setGroupStorage(groupStorageData);
      
    } catch (error) {
      console.error('Error fetching storage info:', error);
      toast({
        title: "Error",
        description: "Failed to load storage information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">Storage Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor your Supabase storage usage and group analytics
          </p>
        </div>

        {/* Storage Overview Cards */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storageInfo ? formatFileSize(storageInfo.totalStorage) : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                Supabase allocation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Used Storage</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storageInfo ? formatFileSize(storageInfo.usedStorage) : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                {storageInfo ? `${storageInfo.usagePercentage.toFixed(1)}% used` : '--'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storageInfo ? formatFileSize(storageInfo.availableStorage) : '--'}
              </div>
              <p className="text-xs text-muted-foreground">
                Remaining space
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groupStorage.length}</div>
              <p className="text-xs text-muted-foreground">
                Active file groups
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Storage Usage Chart */}
        {storageInfo && (
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Storage Usage Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={storageInfo.usagePercentage} className="h-4" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatFileSize(storageInfo.usedStorage)} used
                  </span>
                  <span className="text-muted-foreground">
                    {formatFileSize(storageInfo.availableStorage)} available
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Group Storage Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Storage by Group</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'total' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('total')}
              >
                % of Total
              </Button>
              <Button
                variant={viewMode === 'used' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('used')}
              >
                % of Used
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {groupStorage.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No file groups found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupStorage.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{group.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.fileCount} files • {formatFileSize(group.totalSize)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {viewMode === 'total' 
                            ? group.percentageOfTotal.toFixed(1) 
                            : group.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {viewMode === 'total' ? 'of total' : 'of used'}
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={viewMode === 'total' ? group.percentageOfTotal : group.percentage} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Storage;