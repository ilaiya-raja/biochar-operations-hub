
import { supabase } from '@/lib/supabase';

export const authService = {
  async getUserRole() {
    try {
      console.log('Fetching user role...');
      const userId = (await supabase.auth.getUser()).data.user?.id;
      
      if (!userId) {
        console.log('No user ID found, returning null role');
        return null;
      }
      
      // First try to get the role from user_roles table
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error fetching user role from user_roles:', error);
        
        // If user_roles table doesn't exist or no role found,
        // Check if we can detect a coordinator by email
        console.log('Checking for coordinator profile by email...');
        const userEmail = (await supabase.auth.getUser()).data.user?.email;
        
        if (userEmail) {
          const { data: coordinators, error: coordError } = await supabase
            .from('coordinators')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();
            
          if (coordError) {
            console.error('Error checking coordinator by email:', coordError);
          }
          
          if (coordinators) {
            console.log('Detected coordinator from profile by email match, setting role as coordinator');
            return 'coordinator';
          }
        }
        
        console.log('No user role or coordinator profile found, defaulting to admin');
        return 'admin'; // Default role if there's an error
      }
      
      if (userRoles && userRoles.length > 0) {
        console.log('Retrieved user role:', userRoles[0]?.role);
        return userRoles[0]?.role || 'admin';
      }
      
      console.log('No role found in user_roles table, checking coordinator profiles by email');
      
      // If no roles in user_roles, check coordinators by email as fallback
      const userEmail = (await supabase.auth.getUser()).data.user?.email;
      
      if (userEmail) {
        const { data: coordinators, error: coordError } = await supabase
          .from('coordinators')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (coordError) {
          console.error('Error checking coordinator by email (fallback):', coordError);
        }
        
        if (coordinators) {
          console.log('Detected coordinator from profile by email match, setting role as coordinator');
          return 'coordinator';
        }
      }
      
      console.log('No role found, defaulting to admin');
      return 'admin'; // Default role
    } catch (error) {
      console.error('Exception fetching user role:', error);
      return 'admin'; // Default role if there's an exception
    }
  },

  async getCurrentUserProfile() {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const userEmail = (await supabase.auth.getUser()).data.user?.email;
      
      if (!userId) {
        console.log('No user ID found, returning null profile');
        return null;
      }
      
      console.log('Fetching user profile for ID:', userId);
      
      // Try to get the user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If no profile, check if user is a coordinator by email
        if (userEmail) {
          console.log('Checking if user is a coordinator...');
          const { data: coordinator, error: coordError } = await supabase
            .from('coordinators')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();
            
          if (coordError) {
            console.error('Error checking coordinator profile:', coordError);
            return null;
          }
          
          if (coordinator) {
            console.log('Coordinator profile found by email match:', coordinator);
            return { 
              ...coordinator,
              role: 'coordinator'
            };
          }
        }
        
        console.log('No profile found, returning null');
        return null;
      }
      
      console.log('User profile found:', profile);
      return profile;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  }
};
