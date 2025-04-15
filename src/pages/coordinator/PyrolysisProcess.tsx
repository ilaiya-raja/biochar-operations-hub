
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const PyrolysisProcess = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeProcess, setActiveProcess] = useState<any>(null);

  const startProcess = async (data: any) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('pyrolysis_processes').insert({
        kiln_id: data.kilnId,
        biomass_type_id: data.biomassTypeId,
        coordinator_id: userProfile?.coordinator?.id,
        input_quantity: parseFloat(data.inputQuantity),
        status: 'in_progress'
      });

      if (error) throw error;
      toast.success('Pyrolysis process started');
    } catch (error) {
      toast.error('Failed to start process');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const endProcess = async (processId: string, outputQuantity: number) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('pyrolysis_processes')
        .update({
          end_time: new Date().toISOString(),
          output_quantity: outputQuantity,
          status: 'completed'
        })
        .eq('id', processId);

      if (error) throw error;
      toast.success('Pyrolysis process completed');
    } catch (error) {
      toast.error('Failed to complete process');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pyrolysis Process</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Process Control</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Process control interface will be implemented here */}
        </CardContent>
      </Card>
    </div>
  );
};

export default PyrolysisProcess;
