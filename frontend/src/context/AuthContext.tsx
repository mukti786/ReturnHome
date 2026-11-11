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
  authStartupError: string;
  login: (email: string, pass: string) => Promise<boolean>;
  loginGoogle: (credential: string, role?: string, organization?: string) => Promise<string | void>;
  loginDemo: (role?: string) => Promise<void>;
  register: (user: { name: string; email: string; organization?: string; password: string; phone?: string }) => Promise<string>;
  registerCitizen: (user: { name: string; email: string; password: string; phone?: string }) => Promise<string>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  setDemoMode: (active: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [authStartupError, setAuthStartupError] = useState('');

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      try {
        const result = await apiService.getMe();
        if (active && result.success && result.user) {
          setUser(result.user);
          setIsDemoMode(!!result.user.isDemo);
          setAuthStartupError('');
        }
      } catch (sessionError: any) {
        if (active) {
          setUser(null);
          // Only show error if backend connection completely failed, not for normal signed-out state
          if (sessionError?.message &&
              !sessionError.message.includes('Sign in to continue') &&
              !sessionError.message.includes('HTTP 401') &&
              !sessionError.message.includes('expired')) {
            setAuthStartupError(sessionError.message);
          }
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void restoreSession();
    return () => { active = false; };
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await apiService.login(email, pass);
      setUser(result.user);
      setIsDemoMode(!!result.user.isDemo);
      setAuthStartupError('');
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const loginGoogle = async (credential: string, role: string = 'Citizen', organization?: string) => {
    setIsLoading(true);
    try {
      const result = await apiService.googleAuth(credential, role, organization);
      if (result.user && result.user.status === 'Active') {
        setUser(result.user);
        setIsDemoMode(false);
        setAuthStartupError('');
      }
      return result.message;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = async (role: string = 'Investigator') => {
    setIsLoading(true);
    try {
      const result = await apiService.devLogin(role);
      setUser(result.user);
      setIsDemoMode(true);
      setAuthStartupError('');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (input: { name: string; email: string; organization?: string; password: string; phone?: string }) => {
    const result = await apiService.register(input);
    return result.message;
  };

  const registerCitizen = async (input: { name: string; email: string; password: string; phone?: string }) => {
    const result = await apiService.registerCitizen(input);
    if (result.user && result.user.status === 'Active') {
      setUser(result.user);
      setIsDemoMode(false);
      setAuthStartupError('');
    }
    return result.message;
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } finally {
      setUser(null);
      setIsDemoMode(false);
    }
  };

  const switchRole = (_role: UserRole) => {
    // Authenticated role comes strictly from server session
  };

  return (
    <AuthContext.Provider value={{
      user,
      token: null,
      isAuthenticated: !!user,
      isLoading,
      activeRole: user?.role || 'Public',
      isDemoMode,
      authStartupError,
      login,
      loginGoogle,
      loginDemo,
      register,
      registerCitizen,
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

export default AuthContext;
