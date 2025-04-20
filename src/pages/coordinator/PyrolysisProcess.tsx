
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/Spinner';
import { Flame, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PyrolysisProcess = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeProcesses, setActiveProcesses] = useState<any[]>([]);
  const [kilns, setKilns] = useState<any[]>([]);
  const [biomassTypes, setBiomassTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [formData, setFormData] = useState({
    kilnId: '',
    biomassTypeId: '',
    inputQuantity: '',
    quantityUnit: 'kg'
  });
  const [outputQuantity, setOutputQuantity] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const coordinatorId = userProfile?.coordinator?.id;
        
        if (!coordinatorId) {
          toast.error('Coordinator profile not found');
          return;
        }

        // Fetch kilns assigned to this coordinator
        const { data: kilnsData, error: kilnsError } = await supabase
          .from('kilns')
          .select('id, name, type')
          .eq('coordinator_id', coordinatorId);

        if (kilnsError) throw kilnsError;
        
        // Fetch biomass types
        const { data: biomassData, error: biomassError } = await supabase
          .from('biomass_types')
          .select('id, name');
          
        if (biomassError) throw biomassError;

        // Fetch active processes for this coordinator
        const { data: processesData, error: processesError } = await supabase
          .from('pyrolysis_processes')
          .select(`
            id, 
            input_quantity,
            start_time,
            status,
            kiln_id,
            biomass_type_id,
            kilns (id, name, type),
            biomass_types (id, name)
          `)
          .eq('coordinator_id', coordinatorId)
          .order('start_time', { ascending: false });

        if (processesError) throw processesError;

        setKilns(kilnsData || []);
        setBiomassTypes(biomassData || []);
        setActiveProcesses(processesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const startProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('pyrolysis_processes').insert({
        kiln_id: formData.kilnId,
        biomass_type_id: formData.biomassTypeId,
        coordinator_id: userProfile?.coordinator?.id,
        input_quantity: parseFloat(formData.inputQuantity),
        status: 'in_progress'
      });

      if (error) throw error;
      
      toast.success('Pyrolysis process started');
      setIsFormDialogOpen(false);
      setFormData({
        kilnId: '',
        biomassTypeId: '',
        inputQuantity: '',
        quantityUnit: 'kg'
      });
      
      // Refresh the data
      fetchActiveProcesses();
    } catch (error) {
      toast.error('Failed to start process');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!selectedProcess) return;
      
      const { error } = await supabase
        .from('pyrolysis_processes')
        .update({
          end_time: new Date().toISOString(),
          output_quantity: parseFloat(outputQuantity),
          status: 'completed'
        })
        .eq('id', selectedProcess.id);

      if (error) throw error;
      
      toast.success('Pyrolysis process completed');
      setIsCompleteDialogOpen(false);
      setSelectedProcess(null);
      setOutputQuantity('');
      
      // Refresh the data
      fetchActiveProcesses();
    } catch (error) {
      toast.error('Failed to complete process');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveProcesses = async () => {
    try {
      const coordinatorId = userProfile?.coordinator?.id;
      
      if (!coordinatorId) return;

      const { data, error } = await supabase
        .from('pyrolysis_processes')
        .select(`
          id, 
          input_quantity,
          start_time,
          status,
          kiln_id,
          biomass_type_id,
          kilns (id, name, type),
          biomass_types (id, name)
        `)
        .eq('coordinator_id', coordinatorId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      
      setActiveProcesses(data || []);
    } catch (error) {
      console.error('Error fetching processes:', error);
    }
  };

  const openCompleteDialog = (process: any) => {
    setSelectedProcess(process);
    setIsCompleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pyrolysis Process</h1>
          <p className="text-muted-foreground">Manage biochar production processes</p>
        </div>
        <Button onClick={() => setIsFormDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Start New Process
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Active and Recent Processes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kiln</TableHead>
                  <TableHead>Biomass Type</TableHead>
                  <TableHead>Input Quantity</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeProcesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No processes found</TableCell>
                  </TableRow>
                ) : (
                  activeProcesses.map((process) => (
                    <TableRow key={process.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Flame className="mr-2 h-4 w-4 text-orange-500" />
                          {process.kilns?.name || process.kilns?.type || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>{process.biomass_types?.name || 'Unknown'}</TableCell>
                      <TableCell>{process.input_quantity} kg</TableCell>
                      <TableCell>{formatDate(process.start_time)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          process.status === 'in_progress' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : process.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {process.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {process.status === 'in_progress' && (
                          <Button 
                            size="sm" 
                            onClick={() => openCompleteDialog(process)}
                          >
                            Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Start Process Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Start New Pyrolysis Process</DialogTitle>
          </DialogHeader>
          <form onSubmit={startProcess}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="kiln" className="text-right">Kiln</Label>
                <Select 
                  value={formData.kilnId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, kilnId: value }))}
                  required
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a kiln" />
                  </SelectTrigger>
                  <SelectContent>
                    {kilns.map((kiln) => (
                      <SelectItem key={kiln.id} value={kiln.id}>
                        {kiln.name || kiln.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="biomassType" className="text-right">Biomass Type</Label>
                <Select 
                  value={formData.biomassTypeId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, biomassTypeId: value }))}
                  required
                >
                  <SelectTrigger className="col-span-3">
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
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="inputQuantity" className="text-right">Input Quantity (kg)</Label>
                <Input
                  id="inputQuantity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.inputQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, inputQuantity: e.target.value }))}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Starting...' : 'Start Process'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Complete Process Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Complete Pyrolysis Process</DialogTitle>
          </DialogHeader>
          <form onSubmit={completeProcess}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="outputQuantity" className="text-right">Output Quantity (kg)</Label>
                <Input
                  id="outputQuantity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={outputQuantity}
                  onChange={(e) => setOutputQuantity(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Completing...' : 'Complete Process'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PyrolysisProcess;
