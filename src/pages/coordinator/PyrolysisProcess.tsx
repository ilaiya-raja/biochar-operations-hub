
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface PyrolysisProcessData {
  id?: string;
  kilnId: string;
  biomassTypeId: string;
  coordinatorId?: string;
  startTime?: string;
  endTime?: string;
  inputQuantity: number;
  outputQuantity?: number;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

const PyrolysisProcess = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeProcess, setActiveProcess] = useState<any>(null);
  const [kilns, setKilns] = useState<any[]>([]);
  const [biomassTypes, setBiomassTypes] = useState<any[]>([]);
  const [formData, setFormData] = useState<PyrolysisProcessData>({
    kilnId: '',
    biomassTypeId: '',
    inputQuantity: 0,
    photoUrl: ''
  });
  const [outputQuantity, setOutputQuantity] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch kilns based on coordinator's location
        const { data: kilnsData, error: kilnsError } = await supabase
          .from('kilns')
          .select('id, name')
          .eq('location_id', userProfile?.location_id)
          .eq('status', 'active')
          .order('name');

        if (kilnsError) throw kilnsError;
        setKilns(kilnsData || []);

        // Fetch biomass types
        const { data: biomassTypesData, error: biomassTypesError } = await supabase
          .from('biomass_types')
          .select('id, name')
          .order('name');

        if (biomassTypesError) throw biomassTypesError;
        setBiomassTypes(biomassTypesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load form data');
      }
    };

    if (userProfile?.location_id) {
      fetchData();
    }
  }, [userProfile?.location_id]);

  const startProcess = async (data: PyrolysisProcessData) => {
    setLoading(true);
    try {
      const { data: newProcess, error } = await supabase.from('pyrolysis_processes').insert({
        kiln_id: data.kilnId,
        biomass_type_id: data.biomassTypeId,
        coordinator_id: userProfile?.id,
        input_quantity: data.inputQuantity,
        photo_url: data.photoUrl,
        start_time: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).select().single();

      if (error) throw error;
      setActiveProcess(newProcess);
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
          updated_at: new Date().toISOString()
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
        <CardContent className="space-y-4">
          {!activeProcess ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              startProcess(formData);
            }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="kilnId">Kiln</Label>
                  <Select
                    value={formData.kilnId}
                    onValueChange={(value) => setFormData({ ...formData, kilnId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a kiln" />
                    </SelectTrigger>
                    <SelectContent>
                      {kilns.map((kiln) => (
                        <SelectItem key={kiln.id} value={kiln.id}>
                          {kiln.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="biomassTypeId">Biomass Type</Label>
                  <Select
                    value={formData.biomassTypeId}
                    onValueChange={(value) => setFormData({ ...formData, biomassTypeId: value })}
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

                <div className="space-y-2">
                  <Label htmlFor="inputQuantity">Input Quantity</Label>
                  <Input
                    id="inputQuantity"
                    type="number"
                    value={formData.inputQuantity}
                    onChange={(e) => setFormData({ ...formData, inputQuantity: parseFloat(e.target.value) })}
                    placeholder="Enter input quantity"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photoUrl">Photo URL</Label>
                  <Input
                    id="photoUrl"
                    type="text"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="Enter photo URL"
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Starting Process...' : 'Start Process'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="outputQuantity">Output Quantity</Label>
                <Input
                  id="outputQuantity"
                  type="number"
                  value={outputQuantity}
                  onChange={(e) => setOutputQuantity(parseFloat(e.target.value))}
                  placeholder="Enter output quantity"
                />
              </div>

              <Button
                onClick={() => endProcess(activeProcess.id, outputQuantity)}
                disabled={loading}
              >
                {loading ? 'Completing Process...' : 'Complete Process'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PyrolysisProcess;
