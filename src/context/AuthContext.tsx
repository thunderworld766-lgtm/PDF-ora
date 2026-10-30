import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { storageService } from '../services/storageService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  continueAsGuest: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalMode: 'login' | 'signup' | 'forgot';
  setAuthModalMode: (mode: 'login' | 'signup' | 'forgot') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => storageService.getUserProfile());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');

  const login = async (email: string): Promise<boolean> => {
    // Simulated smooth auth
    const currentProfile = storageService.getUserProfile();
    const updatedUser = {
      ...currentProfile,
      email: email || currentProfile.email,
    };
    setUser(updatedUser);
    setIsAuthenticated(true);
    storageService.saveUserProfile(updatedUser);
    setShowAuthModal(false);
    return true;
  };

  const signup = async (name: string, email: string): Promise<boolean> => {
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: name || 'PDFora Creator',
      email: email || 'creator@pdfora.io',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      tier: 'Pro',
      storageUsedBytes: 0,
      storageLimitBytes: 10 * 1024 * 1024 * 1024,
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
    setIsAuthenticated(true);
    storageService.saveUserProfile(newUser);
    setShowAuthModal(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const continueAsGuest = () => {
    const guestUser: UserProfile = {
      id: `guest_${Date.now()}`,
      name: 'Guest Explorer',
      email: 'guest@pdfora.io',
      tier: 'Free',
      storageUsedBytes: 0,
      storageLimitBytes: 500 * 1024 * 1024,
      createdAt: new Date().toISOString(),
    };
    setUser(guestUser);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    storageService.saveUserProfile(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        signup,
        logout,
        continueAsGuest,
        updateUser,
        showAuthModal,
        setShowAuthModal,
        authModalMode,
        setAuthModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
