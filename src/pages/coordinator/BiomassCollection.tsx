
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const BiomassCollection = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    farmerId: '',
    biomassTypeId: '',
    quantity: '',
    quantityUnit: 'kg'
  });

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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields will be implemented here */}
            <Button type="submit" disabled={loading}>
              Record Collection
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BiomassCollection;
