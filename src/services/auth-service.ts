
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
        return 'admin'; // Default role if there's an error
      }
      
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
