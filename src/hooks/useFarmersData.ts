
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Farmer, Location, Coordinator } from '@/types/farmer';

export const useFarmersData = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('*, location:locations(id, name), coordinator:coordinators(id, name)')
        .order('name');
      
      if (error) throw error;
      setFarmers(data || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error('Failed to load farmers');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const fetchCoordinators = async () => {
    try {
      const { data, error } = await supabase
        .from('coordinators')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCoordinators(data || []);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      toast.error('Failed to load coordinators');
    }
  };

  const addFarmer = async (formData: Omit<Farmer, 'id' | 'created_at' | 'updated_at' | 'location' | 'coordinator'>) => {
    try {
      const { error } = await supabase
        .from('farmers')
        .insert({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address || null,
          location_id: formData.location_id,
          coordinator_id: formData.coordinator_id,
        });

      if (error) throw error;
      toast.success('Farmer added successfully');
      return true;
    } catch (error) {
      console.error('Error adding farmer:', error);
      toast.error('Failed to add farmer');
      return false;
    }
  };

  const updateFarmer = async (id: string, formData: Omit<Farmer, 'id' | 'created_at' | 'updated_at' | 'location' | 'coordinator'>) => {
    try {
      const { error } = await supabase
        .from('farmers')
        .update({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          address: formData.address || null,
          location_id: formData.location_id,
          coordinator_id: formData.coordinator_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Farmer updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating farmer:', error);
      toast.error('Failed to update farmer');
      return false;
    }
  };

  const deleteFarmer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('farmers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Farmer deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting farmer:', error);
      toast.error('Failed to delete farmer');
      return false;
    }
  };

  useEffect(() => {
    fetchFarmers();
    fetchLocations();
    fetchCoordinators();
  }, []);

  return {
    farmers,
    locations,
    coordinators,
    loading,
    refreshFarmers: fetchFarmers,
    addFarmer,
    updateFarmer,
    deleteFarmer
  };
};
