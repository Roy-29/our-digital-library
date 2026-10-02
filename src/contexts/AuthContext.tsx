'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export type UserId = 'swapnil' | 'bipro' | 'srrijan';

export interface AppUser {
  id: UserId;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: AppUser | null;
  profile: any;
  session: any;
  loading: boolean;
  loginAs: (id: UserId) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS: Record<UserId, AppUser> = {
  swapnil: { id: 'swapnil', email: 'swapnil@example.com', name: 'স্বপ্নীল', role: 'admin' },
  bipro: { id: 'bipro', email: 'bipro@example.com', name: 'বিপ্রতীব', role: 'admin' },
  srrijan: { id: 'srrijan', email: 'srrijan@example.com', name: 'সৃজন', role: 'admin' }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check local storage on mount
    const savedUserId = localStorage.getItem('library_user_id') as UserId;
    if (savedUserId && USERS[savedUserId]) {
      setUser(USERS[savedUserId]);
    }
    setLoading(false);
  }, []);

  const loginAs = (id: UserId) => {
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
