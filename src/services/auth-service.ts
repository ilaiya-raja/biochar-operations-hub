
import { supabase } from '@/lib/supabase';

export const authService = {
  async getUserRole() {
    try {
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('role')
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        // First check if we can detect a coordinator profile
        const { data: coordinatorProfile } = await supabase
          .from('coordinators')
          .select('id')
          .single();
          
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
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*, coordinator:coordinators(*)')
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return profile;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  }
};
