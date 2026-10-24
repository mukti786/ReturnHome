import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (user: { name: string; email: string; organization: string; password: string }) => Promise<string>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  setDemoMode: (active: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    apiService.getMe()
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await apiService.login(email, pass);
      setUser(result.user);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: { name: string; email: string; organization: string; password: string }) => {
    const result = await apiService.register(input);
    return result.message;
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
    setIsDemoMode(false);
  };

  const switchRole = (_role: UserRole) => {
    // The authenticated role comes from the server and cannot be changed in the browser.
  };

  return (
    <AuthContext.Provider value={{
      user,
      token: null,
      isAuthenticated: !!user,
      isLoading,
      activeRole: user?.role || 'Public',
      isDemoMode,
      login,
      register,
      logout,
      switchRole,
      setDemoMode: setIsDemoMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};



