import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [processes, setProcesses] = useState<any[]>([]);
  // New state for edit and delete functionality
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<PyrolysisProcessData>({
    kilnId: '',
    biomassTypeId: '',
    inputQuantity: 0
  });

  // Add this function to fetch processes
  const fetchProcesses = async () => {
    try {
      const { data, error } = await supabase
        .from('pyrolysis_processes')
        .select(`
          *,
          kiln:kiln_id(name),
          biomass_type:biomass_type_id(name)
        `)
        .eq('coordinator_id', userProfile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProcesses(data || []);
    } catch (error) {
      console.error('Error fetching processes:', error);
      toast.error('Failed to load processes');
    }
  };

  // Modify useEffect to include fetchProcesses
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
        await fetchProcesses();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load form data');
      }
    };

    if (userProfile?.location_id) {
      fetchData();
    }
  }, [userProfile?.location_id]);

  // Modify startProcess to include fetchProcesses
  const startProcess = async (data: PyrolysisProcessData) => {
    setLoading(true);
    try {
      // Validate required fields
      if (!data.kilnId || !data.biomassTypeId || !data.inputQuantity) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Validate input quantity
      if (data.inputQuantity <= 0) {
        toast.error('Input quantity must be greater than 0');
        return;
      }

      const { data: newProcess, error } = await supabase
        .from('pyrolysis_processes')
        .insert([{
          kiln_id: data.kilnId,
          biomass_type_id: data.biomassTypeId,
          coordinator_id: userProfile?.id,
          input_quantity: data.inputQuantity,
          start_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select(`
          *,
          kiln:kiln_id(name),
          biomass_type:biomass_type_id(name)
        `)
        .single();

      if (error) throw error;

      setActiveProcess(newProcess);
      toast.success('Pyrolysis process started successfully');
      await fetchProcesses(); // Refresh the processes list
      setIsDialogOpen(false);
      
      // Reset form data
      setFormData({
        kilnId: '',
        biomassTypeId: '',
        inputQuantity: 0,
        photoUrl: ''
      });
    } catch (error: any) {
      console.error('Error starting process:', error);
      toast.error(error.message || 'Failed to start process');
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
      setActiveProcess(null);
      toast.success('Pyrolysis process completed');
      fetchProcesses(); // Refresh the processes list
    } catch (error) {
      toast.error('Failed to complete process');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // New functions for edit and delete
  const openEditDialog = (process: any) => {
    setSelectedProcess(process);
    setEditFormData({
      kilnId: process.kiln_id,
      biomassTypeId: process.biomass_type_id,
      inputQuantity: process.input_quantity,
      outputQuantity: process.output_quantity || 0
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (process: any) => {
    setSelectedProcess(process);
    setIsDeleteDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate required fields
      if (!editFormData.kilnId || !editFormData.biomassTypeId || !editFormData.inputQuantity) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Validate input quantity
      if (editFormData.inputQuantity <= 0) {
        toast.error('Input quantity must be greater than 0');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('pyrolysis_processes')
        .update({
          kiln_id: editFormData.kilnId,
          biomass_type_id: editFormData.biomassTypeId,
          input_quantity: editFormData.inputQuantity,
          output_quantity: editFormData.outputQuantity || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedProcess.id);

      if (error) throw error;
      
      toast.success('Process updated successfully');
      setIsEditDialogOpen(false);
      await fetchProcesses(); // Refresh the processes list
    } catch (error: any) {
      console.error('Error updating process:', error);
      toast.error(error.message || 'Failed to update process');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProcess) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('pyrolysis_processes')
        .delete()
        .eq('id', selectedProcess.id);

      if (error) throw error;
      
      toast.success('Process deleted successfully');
      setIsDeleteDialogOpen(false);
      await fetchProcesses(); // Refresh the processes list
    } catch (error: any) {
      console.error('Error deleting process:', error);
      toast.error(error.message || 'Failed to delete process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pyrolysis Process</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Start New Process
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Processes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start Time</TableHead>
                <TableHead>Kiln</TableHead>
                <TableHead>Biomass Type</TableHead>
                <TableHead>Input Quantity</TableHead>
                <TableHead>Output Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes.map((process) => (
                <TableRow key={process.id}>
                  <TableCell>
                    {format(new Date(process.start_time), 'PPp')}
                  </TableCell>
                  <TableCell>{process.kiln?.name}</TableCell>
                  <TableCell>{process.biomass_type?.name}</TableCell>
                  <TableCell>{process.input_quantity}</TableCell>
                  <TableCell>{process.output_quantity || '-'}</TableCell>
                  <TableCell>
                    {process.end_time ? 'Completed' : 'In Progress'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(process)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDeleteDialog(process)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {processes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No processes recorded yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Start New Pyrolysis Process</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!formData.kilnId || !formData.biomassTypeId || !formData.inputQuantity) {
                toast.error('Please fill in all required fields');
                return;
              }
              startProcess(formData);
            }} 
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kilnId">Kiln *</Label>
                <Select
                  value={formData.kilnId}
                  onValueChange={(value) => setFormData({ ...formData, kilnId: value })}
                  required
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
                <Label htmlFor="biomassTypeId">Biomass Type *</Label>
                <Select
                  value={formData.biomassTypeId}
                  onValueChange={(value) => setFormData({ ...formData, biomassTypeId: value })}
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

              <div className="space-y-2">
                <Label htmlFor="inputQuantity">Input Quantity (kg) *</Label>
                <Input
                  id="inputQuantity"
                  type="number"
                  value={formData.inputQuantity}
                  onChange={(e) => setFormData({ ...formData, inputQuantity: parseFloat(e.target.value) })}
                  placeholder="Enter input quantity"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading || !formData.kilnId || !formData.biomassTypeId || !formData.inputQuantity} 
                className="w-full mt-6"
              >
                {loading ? 'Starting Process...' : 'Start Process'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {activeProcess && (
        <Dialog open={!!activeProcess} onOpenChange={() => setActiveProcess(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Complete Process</DialogTitle>
            </DialogHeader>
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
                className="w-full"
              >
                {loading ? 'Completing Process...' : 'Complete Process'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Pyrolysis Process</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-kilnId">Kiln *</Label>
                <Select
                  value={editFormData.kilnId}
                  onValueChange={(value) => setEditFormData({ ...editFormData, kilnId: value })}
                  required
                >
                  <SelectTrigger id="edit-kilnId">
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
                <Label htmlFor="edit-biomassTypeId">Biomass Type *</Label>
                <Select
                  value={editFormData.biomassTypeId}
                  onValueChange={(value) => setEditFormData({ ...editFormData, biomassTypeId: value })}
                  required
                >
                  <SelectTrigger id="edit-biomassTypeId">
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
                <Label htmlFor="edit-inputQuantity">Input Quantity (kg) *</Label>
                <Input
                  id="edit-inputQuantity"
                  type="number"
                  value={editFormData.inputQuantity}
                  onChange={(e) => setEditFormData({ ...editFormData, inputQuantity: parseFloat(e.target.value) })}
                  placeholder="Enter input quantity"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {selectedProcess && selectedProcess.end_time && (
                <div className="space-y-2">
                  <Label htmlFor="edit-outputQuantity">Output Quantity (kg)</Label>
                  <Input
                    id="edit-outputQuantity"
                    type="number"
                    value={editFormData.outputQuantity || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, outputQuantity: parseFloat(e.target.value) })}
                    placeholder="Enter output quantity"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !editFormData.kilnId || !editFormData.biomassTypeId || !editFormData.inputQuantity}
                >
                  {loading ? 'Updating...' : 'Update Process'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this pyrolysis process? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PyrolysisProcess;