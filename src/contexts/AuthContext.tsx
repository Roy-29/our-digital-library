'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface AppUser {
  id: 'swapnil' | 'bipro';
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: AppUser | null;
  profile: any;
  session: any;
  loading: boolean;
  loginAs: (id: 'swapnil' | 'bipro') => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS: Record<'swapnil' | 'bipro', AppUser> = {
  swapnil: { id: 'swapnil', email: 'swapnil@example.com', name: 'Swapnil', role: 'admin' },
  bipro: { id: 'bipro', email: 'bipro@example.com', name: 'Bipro', role: 'admin' }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check local storage on mount
    const savedUserId = localStorage.getItem('library_user_id') as 'swapnil' | 'bipro';
    if (savedUserId && USERS[savedUserId]) {
      setUser(USERS[savedUserId]);
    }
    setLoading(false);
  }, []);

  const loginAs = (id: 'swapnil' | 'bipro') => {
    localStorage.setItem('library_user_id', id);
    setUser(USERS[id]);
    router.push('/dashboard');
  };

  const signOut = () => {
    localStorage.removeItem('library_user_id');
    setUser(null);
    router.push('/');
  };

  const dummyProfile = user ? { id: user.id, display_name: user.name, role: user.role } : null;

  return (
    <AuthContext.Provider value={{ user, profile: dummyProfile, session: { user }, loading, loginAs, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
