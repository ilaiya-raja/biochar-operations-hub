
import { supabase } from '@/lib/supabase';

export const authService = {
  async getUserRole() {
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .single();
    
    return userRoles?.role;
  },

  async getCurrentUserProfile() {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*, coordinator:coordinators(*)')
      .single();
    
    return profile;
  }
};
