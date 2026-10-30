import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { UserProfile } from '../types';
import { storageService } from '../services/storageService';
import { firebaseAuth } from '../services/firebase';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  authModalMode: 'login' | 'signup' | 'forgot';
  setAuthModalMode: (mode: 'login' | 'signup' | 'forgot') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');

  useEffect(() => onAuthStateChanged(firebaseAuth, (firebaseUser) => {
    if (firebaseUser) {
      const profile: UserProfile = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'PDFora User',
        email: firebaseUser.email || '',
        avatar: firebaseUser.photoURL || '',
        tier: 'Free',
        storageUsedBytes: 0,
        storageLimitBytes: 500 * 1024 * 1024,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
      };
      setUser(profile);
      storageService.saveUserProfile(profile);
    } else {
      setUser(null);
      storageService.clearUserProfile();
    }
    setIsAuthLoading(false);
  }), []);

  const loginWithGoogle = async (): Promise<boolean> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(firebaseAuth, provider);
    setShowAuthModal(false);
    return true;
  };

  const logout = async () => {
    await signOut(firebaseAuth);
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    storageService.saveUserProfile(updated);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: Boolean(user),
      isAuthLoading,
      loginWithGoogle,
      logout,
      updateUser,
      showAuthModal,
      setShowAuthModal,
      authModalMode,
      setAuthModalMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
