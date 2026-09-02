import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { getApiUrl } from '../services/apiUrl';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(async ({ data: { session }, error }) => {
        if (error) throw error;
        setSession(session);
        setUser(session?.user ?? null);
        await checkAdminStatus(session?.user?.id, session?.access_token);
      })
      .catch((error) => {
        console.error('Unable to restore authentication session:', error);
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      })
      .finally(() => setIsLoading(false));

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      void checkAdminStatus(session?.user?.id, session?.access_token);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string | undefined, accessToken: string | undefined) => {
    if (!userId || !accessToken) {
      setIsAdmin(false);
      return;
    }
    
    try {
      const response = await fetch(`${getApiUrl()}/admin/status`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setIsAdmin(response.ok);
    } catch {
      setIsAdmin(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
