
import { useState } from 'react';
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
  const [formData, setFormData] = useState({
    farmerId: '',
    quantity: '',
    quantityUnit: 'kg'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('fertilizer_distributions').insert({
        farmer_id: formData.farmerId,
        coordinator_id: userProfile?.coordinator?.id,
        quantity: parseFloat(formData.quantity),
        quantity_unit: formData.quantityUnit
      });

      if (error) throw error;

      toast.success('Fertilizer distribution recorded successfully');
      setFormData({
        farmerId: '',
        quantity: '',
        quantityUnit: 'kg'
      });
    } catch (error) {
      toast.error('Failed to record distribution');
      console.error('Error:', error);
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
            {/* Form fields will be implemented here */}
            <Button type="submit" disabled={loading}>
              Record Distribution
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FertilizerDistribution;
