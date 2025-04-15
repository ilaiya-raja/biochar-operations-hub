
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  role: 'admin' | 'coordinator';
  coordinator_id?: string | null;
}

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      console.log('User profile retrieved:', data);
      // For development purposes, if no profile found, we'll create a mock admin profile
      if (!data) {
        console.warn('No user profile found, using default admin profile for testing');
        return { id: userId, role: 'admin' } as UserProfile;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Unexpected error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up the listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Initialize the current session
    const initSession = async () => {
      try {
        console.log('Initializing auth session...');
        setIsLoading(true);
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          const profile = await fetchUserProfile(data.session.user.id);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error initializing auth session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Clean up the listener when the component unmounts
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { error };
      }

      toast.success('Successfully logged in');
      return { error: null };
    } catch (error) {
      console.error('Unexpected login error:', error);
      return { error };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Successfully logged out');
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        isLoading,
        login,
        logout,
      }}
    >
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
