
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const FertilizerDistribution = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [fertilizers, setFertilizers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    farmerId: '',
    fertilizerId: '',
    quantity: '',
    quantityUnit: 'kg'
  });

  // Fetch farmers and fertilizers when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [farmersResponse, fertilizersResponse] = await Promise.all([
          supabase.from('farmers').select('id, name'),
          supabase.from('fertilizers').select('id, name, type, quantity').where('status', 'eq', 'available')
        ]);

        if (farmersResponse.data) setFarmers(farmersResponse.data);
        if (fertilizersResponse.data) setFertilizers(fertilizersResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch farmers or fertilizers');
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if selected fertilizer has enough quantity
      const selectedFertilizer = fertilizers.find(f => f.id === formData.fertilizerId);
      const requestedQuantity = parseFloat(formData.quantity);

      if (!selectedFertilizer || selectedFertilizer.quantity < requestedQuantity) {
        toast.error('Insufficient fertilizer quantity available');
        return;
      }

      // Record fertilizer distribution
      const { error: distributionError } = await supabase.from('fertilizer_distributions').insert({
        farmer_id: formData.farmerId,
        coordinator_id: userProfile?.coordinator?.id,
        fertilizer_id: formData.fertilizerId,
        quantity: requestedQuantity,
        quantity_unit: formData.quantityUnit
      });

      if (distributionError) throw distributionError;

      // Update fertilizer quantity
      const { error: fertilizersError } = await supabase
        .from('fertilizers')
        .update({ 
          quantity: selectedFertilizer.quantity - requestedQuantity,
          status: selectedFertilizer.quantity - requestedQuantity <= 0 ? 'depleted' : 'available'
        })
        .eq('id', formData.fertilizerId);

      if (fertilizersError) throw fertilizersError;

      toast.success('Fertilizer distributed successfully');
      setFormData({
        farmerId: '',
        fertilizerId: '',
        quantity: '',
        quantityUnit: 'kg'
      });
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to record fertilizer distribution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Fertilizer Distribution</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Distribution Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="farmer">Select Farmer</Label>
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
                <Label htmlFor="fertilizer">Select Fertilizer</Label>
                <Select 
                  value={formData.fertilizerId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, fertilizerId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a fertilizer" />
                  </SelectTrigger>
                  <SelectContent>
                    {fertilizers.map((fertilizer) => (
                      <SelectItem key={fertilizer.id} value={fertilizer.id}>
                        {fertilizer.name} - {fertilizer.type} (Available: {fertilizer.quantity} kg)
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
                <Label htmlFor="quantityUnit">Quantity Unit</Label>
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
              {loading ? 'Recording Distribution...' : 'Record Distribution'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FertilizerDistribution;
