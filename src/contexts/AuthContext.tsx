import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/services/auth-service';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  userRole: string | null;
  userProfile: any | null;
  login: (email: string, password: string) => Promise<{ error: any | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const navigate = useNavigate();

  const fetchUserData = async (userId: string) => {
    try {
      console.log('Fetching user data for ID:', userId);
      const [role, profile] = await Promise.all([
        authService.getUserRole(),
        authService.getCurrentUserProfile()
      ]);
      console.log('Fetched user role:', role);
      setUserRole(role || 'admin'); // Default to admin if no role found
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Set a default role if we can't fetch one
      setUserRole('admin');
    }
  };

  useEffect(() => {
    let authStateSubscription: { unsubscribe: () => void } | null = null;

    const initAuth = async () => {
      try {
        setIsLoading(true);
        
        authStateSubscription = supabase.auth.onAuthStateChange(
          async (event, currentSession) => {
            console.log('Auth state changed:', event);
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              setTimeout(() => {
                fetchUserData(currentSession.user.id);
                setIsLoading(false);
              }, 0);
            } else {
              setUserRole(null);
              setUserProfile(null);
              setIsLoading(false);
            }
          }
        ).data.subscription;

        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user) {
          await fetchUserData(data.session.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUserRole('admin');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (authStateSubscription) {
        authStateSubscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsLoading(false);
        return { error };
      }

      toast.success('Successfully logged in');
      return { error: null };
    } catch (error) {
      setIsLoading(false);
      return { error };
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      toast.success('Successfully logged out');
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
      console.error('Error logging out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        userRole,
        userProfile,
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
