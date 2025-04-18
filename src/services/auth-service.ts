
import { supabase } from '@/lib/supabase';

export const authService = {
  async getUserRole() {
    try {
      // First try to get the role from user_roles table
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        
        // If user_roles table doesn't exist or no role found,
        // Check if we can detect a coordinator profile
        const { data: coordinatorProfile, error: coordError } = await supabase
          .from('coordinators')
          .select('id')
          .single();
          
        if (coordError) {
          console.error('Error checking coordinator profile:', coordError);
        }
        
        if (coordinatorProfile) {
          console.log('Detected coordinator from profile, setting role as coordinator');
          return 'coordinator';
        }
        
        return 'admin'; // Default role if there's an error
      }
      
      console.log('Retrieved user role:', userRoles?.role);
      return userRoles?.role || 'admin'; // Return the role or default to admin
    } catch (error) {
      console.error('Exception fetching user role:', error);
      return 'admin'; // Default role if there's an exception
    }
  },

  async getCurrentUserProfile() {
    try {
      // Try to get the user profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If no profile, check if user is a coordinator
        const { data: coordinator, error: coordError } = await supabase
          .from('coordinators')
          .select('*')
          .single();
          
        if (coordError) {
          console.error('Error checking coordinator profile:', coordError);
          return null;
        }
        
        if (coordinator) {
          return { 
            ...coordinator,
            role: 'coordinator'
          };
        }
        
        return null;
      }
      
      return profile;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  }
};
