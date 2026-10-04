import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeRole: UserRole;
  isDemoMode: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  setDemoMode: (active: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'usr-admin-1',
    name: 'Inspector Vikram Singh',
    email: 'vikram.singh@ReturnHome.gov.in',
    role: 'Admin',
    organization: 'Special Missing Persons Unit, Delhi Police',
    status: 'Active',
    createdAt: '2026-01-15T09:00:00.000Z'
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('khojsetu_token') || 'demo-jwt-token-2026');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeRole, setActiveRole] = useState<UserRole>('Admin');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await apiService.login(email, pass);
      if (res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        setActiveRole(res.user.role);
        localStorage.setItem('khojsetu_token', res.token);
        setIsLoading(false);
        return true;
      }
    } catch {
      // Demo fallback login
      const demoUser: User = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0].toUpperCase(),
        email,
        role: email.includes('admin') ? 'Admin' : 'Investigator',
        organization: 'ReturnHome Special Investigation Unit',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      setUser(demoUser);
      setActiveRole(demoUser.role);
      setToken('demo-token-2026');
    }
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('khojsetu_token');
  };

  const switchRole = (role: UserRole) => {
    setActiveRole(role);
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        activeRole,
        isDemoMode,
        login,
        logout,
        switchRole,
        setDemoMode: setIsDemoMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
