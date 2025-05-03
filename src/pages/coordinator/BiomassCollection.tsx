
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const BiomassCollection = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState([]);
  const [biomassTypes, setBiomassTypes] = useState([]);
  const [formData, setFormData] = useState({
    farmerId: '',
    biomassTypeId: '',
    quantity: '',
    quantityUnit: 'kg',
    // photoUrl: '',
    collectionDate: new Date().toISOString()
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch farmers based on coordinator's location
        const { data: farmersData, error: farmersError } = await supabase
          .from('farmers')
          .select('id, name')
          .eq('location_id', userProfile?.location_id)
          .order('name');

        if (farmersError) throw farmersError;
        setFarmers(farmersData || []);

        // Fetch biomass types
        const { data: typesData, error: typesError } = await supabase
          .from('biomass_types')
          .select('id, name')
          .order('name');

        if (typesError) throw typesError;
        setBiomassTypes(typesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load form data');
      }
    };

    if (userProfile?.location_id) {
      fetchData();
    }
  }, [userProfile?.location_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.from('biomass_collections').insert({
        farmer_id: formData.farmerId,
        biomass_type_id: formData.biomassTypeId,
        coordinator_id: userProfile?.coordinator?.id,
        quantity: parseFloat(formData.quantity),
        quantity_unit: formData.quantityUnit,
        // photo_url: formData.photoUrl || null,
        collection_date: formData.collectionDate
      }).select();

      if (error) {
        console.error('Error details:', error);
        throw error;
      }

      console.log('Recorded biomass collection:', data);

      toast.success('Biomass collection recorded successfully');
      setFormData({
        farmerId: '',
        biomassTypeId: '',
        quantity: '',
        quantityUnit: 'kg',
        // photoUrl: '',
        collectionDate: new Date().toISOString()
      });
    } catch (error) {
      toast.error('Failed to record biomass collection');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Record Biomass Collection</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Collection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="farmerId" className="text-sm font-medium">Farmer</label>
                <select
                  id="farmerId"
                  value={formData.farmerId}
                  onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Farmer</option>
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="biomassTypeId" className="text-sm font-medium">Biomass Type</label>
                <select
                  id="biomassTypeId"
                  value={formData.biomassTypeId}
                  onChange={(e) => setFormData({ ...formData, biomassTypeId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Biomass Type</option>
                  {biomassTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="quantityUnit" className="text-sm font-medium">Quantity Unit</label>
                <select
                  id="quantityUnit"
                  value={formData.quantityUnit}
                  onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="ton">Tons</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="collectionDate" className="text-sm font-medium">Collection Date</label>
                <input
                  type="datetime-local"
                  id="collectionDate"
                  value={formData.collectionDate.slice(0, 16)}
                  onChange={(e) => setFormData({ ...formData, collectionDate: new Date(e.target.value).toISOString() })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              {/* <div className="space-y-2">
                <label htmlFor="photoUrl" className="text-sm font-medium">Photo URL (Optional)</label>
                <input
                  type="url"
                  id="photoUrl"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  placeholder="https://example.com/photo.jpg"
                />
              </div> */}
            </div>

            <Button type="submit" disabled={loading} className="w-full mt-6">
              {loading ? 'Recording...' : 'Record Collection'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiomassCollection;
