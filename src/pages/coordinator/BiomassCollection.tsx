
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/Spinner';

const BiomassCollection = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    farmerId: '',
    biomassTypeId: '',
    quantity: '',
    quantityUnit: 'kg'
  });
  const [farmers, setFarmers] = useState<any[]>([]);
  const [biomassTypes, setBiomassTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const coordinatorId = userProfile?.coordinator?.id;
        
        if (!coordinatorId) {
          toast.error('Coordinator profile not found');
          return;
        }

        // Fetch farmers assigned to this coordinator
        const { data: farmersData, error: farmersError } = await supabase
          .from('farmers')
          .select('id, name')
          .eq('coordinator_id', coordinatorId);

        if (farmersError) throw farmersError;
        
        // Fetch biomass types
        const { data: biomassData, error: biomassError } = await supabase
          .from('biomass_types')
          .select('id, name');
          
        if (biomassError) throw biomassError;

        setFarmers(farmersData || []);
        setBiomassTypes(biomassData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('biomass_collections').insert({
        farmer_id: formData.farmerId,
        biomass_type_id: formData.biomassTypeId,
        coordinator_id: userProfile?.coordinator?.id,
        quantity: parseFloat(formData.quantity),
        quantity_unit: formData.quantityUnit
      });

      if (error) throw error;

      toast.success('Biomass collection recorded successfully');
      setFormData({
        farmerId: '',
        biomassTypeId: '',
        quantity: '',
        quantityUnit: 'kg'
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
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="farmer">Farmer</Label>
                  <Select 
                    value={formData.farmerId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, farmerId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a farmer" />
                    </SelectTrigger>
                    <SelectContent>
                      {farmers.map((farmer) => (
                        <SelectItem key={farmer.id} value={farmer.id}>
                          {farmer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="biomassType">Biomass Type</Label>
                  <Select 
                    value={formData.biomassTypeId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, biomassTypeId: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select biomass type" />
                    </SelectTrigger>
                    <SelectContent>
                      {biomassTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    min="0"
                    step="0.1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="quantityUnit">Unit</Label>
                  <Select 
                    value={formData.quantityUnit} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, quantityUnit: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="tonnes">Tonnes</SelectItem>
                      <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Recording...' : 'Record Collection'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BiomassCollection;
