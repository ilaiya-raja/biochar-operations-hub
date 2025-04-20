
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// Location types
export interface Location {
  id: string;
  name: string;
  address?: string;
  district?: string;
  state?: string;
  country?: string;
  coordinates?: any;
  created_at: string;
  updated_at: string;
}

// Coordinator types
export interface Coordinator {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  location_id?: string;
  location?: Location;
  status: string;
  created_at: string;
  updated_at: string;
}

// Kiln types
export interface Kiln {
  id: string;
  name: string;
  type?: string;
  capacity?: number;
  capacity_unit?: string;
  location_id?: string;
  location?: Location;
  coordinator_id?: string;
  coordinator?: Coordinator;
  status: string;
  created_at: string;
  updated_at: string;
}

// Activity types
export interface Activity {
  id: string;
  coordinator_id: string;
  coordinator?: Coordinator;
  activity_type: string;
  description?: string;
  kiln_id?: string;
  kiln?: Kiln;
  location_id?: string;
  location?: Location;
  date_performed: string;
  quantity?: number;
  quantity_unit?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Analytics data types
export interface AnalyticsData {
  id: string;
  metric_name: string;
  metric_value: number;
  date_recorded: string;
  location_id?: string;
  location?: Location;
  coordinator_id?: string;
  coordinator?: Coordinator;
  kiln_id?: string;
  kiln?: Kiln;
  created_at: string;
}

// Generic error handler
const handleError = (error: any, operation: string) => {
  console.error(`Error ${operation}:`, error);
  toast.error(`Failed to ${operation.toLowerCase()}`);
  return null;
};

// Locations service
export const locationService = {
  async getLocations() {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'fetching locations');
    }
  },
  
  async getLocationById(id: string) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'fetching location');
    }
  },
  
  async createLocation(location: Partial<Location>) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .insert([location])
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Location created successfully');
      return data;
    } catch (error) {
      return handleError(error, 'creating location');
    }
  },
  
  async updateLocation(id: string, location: Partial<Location>) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .update(location)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Location updated successfully');
      return data;
    } catch (error) {
      return handleError(error, 'updating location');
    }
  },
  
  async deleteLocation(id: string) {
    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Location deleted successfully');
      return true;
    } catch (error) {
      return handleError(error, 'deleting location');
    }
  }
};

// Coordinators service
export const coordinatorService = {
  async getCoordinators() {
    try {
      const { data, error } = await supabase
        .from('coordinators')
        .select('*, location:locations(*)')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'fetching coordinators');
    }
  },
  
  async getCoordinatorById(id: string) {
    try {
      const { data, error } = await supabase
        .from('coordinators')
        .select('*, location:locations(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'fetching coordinator');
    }
  },
  
  async createCoordinator(coordinator: Partial<Coordinator>) {
    try {
      const { data, error } = await supabase
        .from('coordinators')
        .insert([coordinator])
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Coordinator created successfully');
      return data;
    } catch (error) {
      return handleError(error, 'creating coordinator');
    }
  },
  
  async updateCoordinator(id: string, coordinator: Partial<Coordinator>) {
    try {
      const { data, error } = await supabase
        .from('coordinators')
        .update(coordinator)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Coordinator updated successfully');
      return data;
    } catch (error) {
      return handleError(error, 'updating coordinator');
    }
  },
  
  async deleteCoordinator(id: string) {
    try {
      const { error } = await supabase
        .from('coordinators')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Coordinator deleted successfully');
      return true;
    } catch (error) {
      return handleError(error, 'deleting coordinator');
    }
  }
};

// Kilns service
export const kilnService = {
  async getKilns() {
    try {
      const { data, error } = await supabase
        .from('kilns')
        .select('*, location:locations(*), coordinator:coordinators(*)')
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'fetching kilns');
    }
  },
  
  async getKilnById(id: string) {
    try {
      const { data, error } = await supabase
        .from('kilns')
        .select('*, location:locations(*), coordinator:coordinators(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'fetching kiln');
    }
  },
  
  async createKiln(kiln: Partial<Kiln>) {
    try {
      const { data, error } = await supabase
        .from('kilns')
        .insert([kiln])
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Kiln created successfully');
      return data;
    } catch (error) {
      return handleError(error, 'creating kiln');
    }
  },
  
  async updateKiln(id: string, kiln: Partial<Kiln>) {
    try {
      const { data, error } = await supabase
        .from('kilns')
        .update(kiln)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Kiln updated successfully');
      return data;
    } catch (error) {
      return handleError(error, 'updating kiln');
    }
  },
  
  async deleteKiln(id: string) {
    try {
      const { error } = await supabase
        .from('kilns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Kiln deleted successfully');
      return true;
    } catch (error) {
      return handleError(error, 'deleting kiln');
    }
  }
};

// Activities service
export const activityService = {
  async getActivities() {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*, coordinator:coordinators(*), location:locations(*), kiln:kilns(*)')
        .order('date_performed', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'fetching activities');
    }
  },
  
  async getActivityById(id: string) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*, coordinator:coordinators(*), location:locations(*), kiln:kilns(*)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'fetching activity');
    }
  },
  
  async createActivity(activity: Partial<Activity>) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .insert([activity])
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Activity created successfully');
      return data;
    } catch (error) {
      return handleError(error, 'creating activity');
    }
  },
  
  async updateActivity(id: string, activity: Partial<Activity>) {
    try {
      const { data, error } = await supabase
        .from('activities')
        .update(activity)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Activity updated successfully');
      return data;
    } catch (error) {
      return handleError(error, 'updating activity');
    }
  },
  
  async deleteActivity(id: string) {
    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Activity deleted successfully');
      return true;
    } catch (error) {
      return handleError(error, 'deleting activity');
    }
  }
};

// Analytics service
export const analyticsService = {
  async getAnalyticsData() {
    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .select('*, location:locations(*), coordinator:coordinators(*), kiln:kilns(*)')
        .order('date_recorded', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      return handleError(error, 'fetching analytics data');
    }
  },
  
  async createAnalyticsData(analyticsData: Partial<AnalyticsData>) {
    try {
      const { data, error } = await supabase
        .from('analytics_data')
        .insert([analyticsData])
        .select()
        .single();
      
      if (error) throw error;
      toast.success('Analytics data created successfully');
      return data;
    } catch (error) {
      return handleError(error, 'creating analytics data');
    }
  }
};
