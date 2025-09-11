import React, { useState } from 'react';
import { ArrowLeft, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

const Settings: React.FC = () => {
  const { currentUsername, logout, updateUsername } = useAuth();
  const navigate = useNavigate();
  const [newUsername, setNewUsername] = useState(currentUsername || '');
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (newUsername === currentUsername) {
      toast({
        title: "Info",
        description: "Username is already set to this value",
      });
      return;
    }

    setIsUpdatingUsername(true);

    const success = await updateUsername(newUsername);
    
    if (success) {
      toast({
        title: "Success",
        description: "Username updated successfully",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update username",
        variant: "destructive",
      });
      setNewUsername(currentUsername || '');
    }

    setIsUpdatingUsername(false);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate('/login');
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and preferences
            </p>
          </div>
        </div>

        <div className="max-w-2xl space-y-6">
          {/* Username Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Username
              </CardTitle>
              <CardDescription>
                Change your username to access the application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUsernameUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Current Username</Label>
                  <div className="flex gap-2">
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Enter new username"
                      disabled={isUpdatingUsername}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={isUpdatingUsername || newUsername === currentUsername}
                    >
                      {isUpdatingUsername ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                          Updating...
                        </div>
                      ) : (
                        'Update'
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Note: You cannot reuse the same username after changing it
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Actions related to your account session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setShowLogoutDialog(true)}
                className="w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </CardContent>
          </Card>

          {/* App Information */}
          <Card>
            <CardHeader>
              <CardTitle>About Onfile</CardTitle>
              <CardDescription>
                Personal file storage and transfer application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Version: 1.0.0</p>
              <p>
                Onfile is a secure, personal file storage solution designed for single-user use. 
                Transfer files easily between your devices without relying on third-party services.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to logout? You will need to enter your username again to access the application.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default Settings;