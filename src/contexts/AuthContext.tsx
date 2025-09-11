import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUsername: string | null;
  login: (username: string) => Promise<boolean>;
  logout: () => void;
  updateUsername: (newUsername: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const savedUsername = localStorage.getItem('onfile_username');
    if (savedUsername) {
      setCurrentUsername(savedUsername);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string): Promise<boolean> => {
    try {
      // Check if username exists in config table
      const { data, error } = await supabase
        .from('config')
        .select('username')
        .eq('id', 1)
        .single();

      if (error || !data) {
        return false;
      }

      if (data.username === username) {
        localStorage.setItem('onfile_username', username);
        setCurrentUsername(username);
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('onfile_username');
    setCurrentUsername(null);
    setIsAuthenticated(false);
  };

  const updateUsername = async (newUsername: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('config')
        .update({ username: newUsername })
        .eq('id', 1);

      if (error) {
        return false;
      }

      localStorage.setItem('onfile_username', newUsername);
      setCurrentUsername(newUsername);
      return true;
    } catch (error) {
      console.error('Update username error:', error);
      return false;
    }
  };

  const value = {
    isAuthenticated,
    currentUsername,
    login,
    logout,
    updateUsername,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};