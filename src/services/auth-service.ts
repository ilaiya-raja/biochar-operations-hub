
import { supabase } from '@/lib/supabase';

export const authService = {
  async getUserRole() {
    try {
      console.log('Fetching user role...');
      
      // First try to get the role from user_roles table
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role');
      
      if (error) {
        console.error('Error fetching user role from user_roles:', error);
        
        // If user_roles table doesn't exist or no role found,
        // Check if we can detect a coordinator profile
        console.log('Checking for coordinator profile...');
        
        // Try to get the current user's ID first
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        if (!userId) {
          console.log('No user ID found, defaulting to admin');
          return 'admin';
        }
        
        // First try to find by user_id if the column exists
        try {
          const { data: coordinatorData, error: coordError } = await supabase
            .from('coordinators')
            .select('id, email')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (!coordError && coordinatorData) {
            console.log('Detected coordinator from profile with user_id, setting role as coordinator');
            return 'coordinator';
          }
        } catch (e) {
          console.log('Coordinator lookup by user_id failed, likely column does not exist', e);
        }
        
        // If that fails, try to match by email
        try {
          // Get user email
          const userEmail = userData?.user?.email;
          
          if (userEmail) {
            const { data: coordinatorByEmail, error: emailError } = await supabase
              .from('coordinators')
              .select('id')
              .eq('email', userEmail)
              .maybeSingle();
              
            if (!emailError && coordinatorByEmail) {
              console.log('Detected coordinator from profile by email match, setting role as coordinator');
              return 'coordinator';
            }
          }
        } catch (e) {
          console.log('Coordinator lookup by email failed', e);
        }
        
        console.log('No user role or coordinator profile found, defaulting to admin');
        return 'admin'; // Default role if there's an error
      }
      
      if (userRoles && userRoles.length > 0) {
        console.log('Retrieved user role:', userRoles[0]?.role);
        return userRoles[0]?.role || 'admin';
      }
      
      console.log('No role found in user_roles table, checking coordinator profiles');
      
      // If no roles in user_roles, check coordinators as fallback
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      const userEmail = userData?.user?.email;
      
      if (!userId) {
        console.log('No user ID found, defaulting to admin');
        return 'admin';
      }
      
      // Try by user_id first if column exists
      try {
        const { data: coordinatorData, error: coordError } = await supabase
          .from('coordinators')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (!coordError && coordinatorData) {
          console.log('Detected coordinator from profile by user_id (fallback), setting role as coordinator');
          return 'coordinator';
        }
      } catch (e) {
        console.log('Coordinator lookup by user_id failed, likely column does not exist', e);
      }
      
      // Try by email as fallback
      if (userEmail) {
        const { data: coordinatorByEmail, error: emailError } = await supabase
          .from('coordinators')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();
          
        if (!emailError && coordinatorByEmail) {
          console.log('Detected coordinator from profile by email (fallback), setting role as coordinator');
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
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
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
        
        // If no profile, check if user is a coordinator
        console.log('Checking if user is a coordinator...');
        
        // First try by user_id if column exists
        try {
          const { data: coordinator, error: coordError } = await supabase
            .from('coordinators')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (!coordError && coordinator) {
            console.log('Coordinator profile found by user_id:', coordinator);
            return { 
              ...coordinator,
              role: 'coordinator'
            };
          }
        } catch (e) {
          console.log('Coordinator lookup by user_id failed, likely column does not exist', e);
        }
        
        // Try by email as fallback
        const userEmail = userData?.user?.email;
        if (userEmail) {
          const { data: coordinatorByEmail, error: emailError } = await supabase
            .from('coordinators')
            .select('*')
            .eq('email', userEmail)
            .maybeSingle();
            
          if (!emailError && coordinatorByEmail) {
            console.log('Coordinator profile found by email match:', coordinatorByEmail);
            return { 
              ...coordinatorByEmail,
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
