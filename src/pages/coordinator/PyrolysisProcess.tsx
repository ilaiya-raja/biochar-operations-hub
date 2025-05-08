import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
 
interface Process {
  id: string;
  kiln_id: string;
  biomass_type_id: string;
  start_time: string;
  end_time: string | null;
  input_quantity: number;
  output_quantity: number | null;
  kilns: { name: string }; // Single object, not array
  biomass_types: { name: string }; // Single object, not array
}
 
interface PyrolysisProcessData {
  id?: string;
  kilnId: string;
  biomassTypeId: string;
  farmerId?: string;  // Add this line
  coordinatorId?: string;
  startTime?: string;
  endTime?: string;
  inputQuantity: number;
  outputQuantity?: number;
  createdAt?: string;
  updatedAt?: string;
}
 
interface BiomassCollection {
  id: string;
  biomass_type_id: string;
  quantity: number;
  biomass_type?: {
    name: string;
  };
}
 
const PyrolysisProcess = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [kilns, setKilns] = useState<any[]>([]);
  const [biomassTypes, setBiomassTypes] = useState<any[]>([]);
  const [farmers, setFarmers] = useState<any[]>([]);
  const [outputQuantity, setOutputQuantity] = useState<number>(0);
  const [totalAvailableQuantity, setTotalAvailableQuantity] = useState<number>(0);
  const [biomassCollections, setBiomassCollections] = useState<BiomassCollection[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [formData, setFormData] = useState<PyrolysisProcessData>({
    kilnId: '',
    biomassTypeId: '',
    inputQuantity: 0,
  });
 
  const fetchProcesses = async () => {
    try {
      const { data, error } = await supabase
        .from('pyrolysis_processes')
        .select(`
          id,
          kiln_id,
          biomass_type_id,
          start_time,
          end_time,
          input_quantity,
          output_quantity,
          kilns:kiln_id (name),
          biomass_types:biomass_type_id (name)
        `)
        .order('start_time', { ascending: false });
 
      if (error) throw error;
      setProcesses((data || []) as unknown as Process[]);
    } catch (error) {
      console.error('Error fetching processes:', error);
      toast.error('Failed to load processes');
    }
  };
 
  // New function to fetch biomass collections
  const fetchBiomassCollections = async () => {
    if (!userProfile?.id) return;
 
    try {
      const { data, error } = await supabase
        .from('biomass_collections')
        .select(`
          id,
          biomass_type_id,
          quantity,
          biomass_type:biomass_type_id(name)
        `)
        .eq('coordinator_id', userProfile.id)
        .order('collection_date', { ascending: false });
 
      if (error) throw error;
      setBiomassCollections((data || []) as unknown as BiomassCollection[]);
    } catch (error) {
      console.error('Error fetching biomass collections:', error);
      toast.error('Failed to load biomass collections');
    }
  };
  useEffect(() => {
    if (userProfile?.id) {
      fetchInventoryData();
    }
  }, [userProfile?.id]);
  const fetchInventoryData = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          farmer_id,
          biomass_type_id,
          quantity,
          farmers:farmer_id(id, name)
        `)
        .eq('coordinator_id', userProfile?.id);
 
      if (error) throw error;
      setInventoryData(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory data');
    }
  };
  const fetchFarmerCollection = async (farmerId: string) => {
    try {
      const { data, error } = await supabase
        .from('biomass_collections')
        .select(`
          biomass_type_id,
          quantity
        `)
        .eq('farmer_id', farmerId)
        .order('collection_date', { ascending: false })
        .limit(1)
        .single();
 
      if (error) {
        if (error.code !== 'PGRST116') { // No rows returned code
          throw error;
        }
        return;
      }
 
      if (data) {
        setFormData(prev => ({
          ...prev,
          biomassTypeId: data.biomass_type_id,
          inputQuantity: data.quantity
        }));
      }
    } catch (error) {
      console.error('Error fetching farmer collection:', error);
      toast.error('Failed to load farmer data');
    }
  };
 
  const fetchTotalAvailableQuantity = async (biomassTypeId: string) => {
    if (!biomassTypeId || !userProfile?.location_id) {
      setTotalAvailableQuantity(0);
      return;
    }
 
    try {
      // First get all farmers at this location
      const { data: farmersData, error: farmersError } = await supabase
        .from('farmers')
        .select('id')
        .eq('location_id', userProfile.location_id);
 
      if (farmersError) throw farmersError;
 
      if (!farmersData || farmersData.length === 0) {
        setTotalAvailableQuantity(0);
        return;
      }
 
      // Get the farmer IDs
      const farmerIds = farmersData.map(farmer => farmer.id);
 
      // Then query collections for these farmers with the selected biomass type
      const { data, error } = await supabase
        .from('biomass_collections')
        .select('quantity')
        .eq('biomass_type_id', biomassTypeId)
        .in('farmer_id', farmerIds);
 
      if (error) throw error;
 
      // Calculate the total quantity from all collections
      const total = data?.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0) || 0;
      setTotalAvailableQuantity(total);
    } catch (error) {
      console.error('Error fetching total available quantity:', error);
      setTotalAvailableQuantity(0);
    }
  };
 
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch farmers
        const { data: farmersData, error: farmersError } = await supabase
          .from('farmers')
          .select('id, name')
          .eq('location_id', userProfile?.location_id)
          .order('name');
 
        if (farmersError) throw farmersError;
        setFarmers(farmersData || []);
 
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
 
        // Fetch processes
        await fetchProcesses();
 
        // Fetch biomass collections
        await fetchBiomassCollections();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      }
    };
 
    if (userProfile?.location_id) {
      fetchData();
    }
  }, [userProfile?.location_id, userProfile?.id]);
 
  useEffect(() => {
    if (formData.biomassTypeId && formData.farmerId) {
      const selectedInventory = inventoryData.find(
        item => item.farmer_id === formData.farmerId && item.biomass_type_id === formData.biomassTypeId
      );
      setTotalAvailableQuantity(selectedInventory ? parseFloat(selectedInventory.quantity) : 0);
    } else {
      setTotalAvailableQuantity(0);
    }
  }, [formData.biomassTypeId, formData.farmerId, inventoryData]);
 
  const startProcess = async (data: PyrolysisProcessData) => {
    if (!data.kilnId) {
      toast.error('Please select a kiln');
      return;
    }
    if (!data.biomassTypeId) {
      toast.error('Please select a biomass type');
      return;
    }
    if (!data.inputQuantity || data.inputQuantity <= 0) {
      toast.error('Please enter a valid input quantity');
      return;
    }
    setLoading(true);
    try {
      // First get current inventory quantity
      const { data: currentInventory, error: fetchError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('farmer_id', data.farmerId)
        .eq('biomass_type_id', data.biomassTypeId)
        .single();
 
      if (fetchError) throw fetchError;
      if (!currentInventory) throw new Error('Inventory record not found');
      const currentQuantity = parseFloat(currentInventory.quantity);
      const inputQuantity = parseFloat(data.inputQuantity.toString());
      const newQuantity = currentQuantity - inputQuantity;
      
      if (currentQuantity < inputQuantity) {
        throw new Error('Input quantity exceeds available inventory');
      }
 
      // Then update the inventory with new quantity
      console.log('Current inventory:', currentQuantity);
      console.log('Input quantity:', inputQuantity);
      console.log('New quantity:', newQuantity);
 
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('farmer_id', data.farmerId)
        .eq('biomass_type_id', data.biomassTypeId);
 
      console.log('Inventory update error:', inventoryError);
 
      if (inventoryError) throw inventoryError;
 
      // Then create the process
      const { error } = await supabase.from('pyrolysis_processes').insert({
        kiln_id: data.kilnId,
        biomass_type_id: data.biomassTypeId,
        coordinator_id: userProfile?.id,
        input_quantity: data.inputQuantity,
        start_time: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
 
      if (error) throw error;
 
      await fetchProcesses();
      await fetchInventoryData(); // Refresh inventory data
      toast.success('Pyrolysis process started');
 
      setFormData({
        kilnId: '',
        biomassTypeId: '',
        inputQuantity: 0,
      });
      setTotalAvailableQuantity(0);
      setShowForm(false);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Failed to start process');
    } finally {
      setLoading(false);
    }
  };
 
  const completeProcess = async (process: Process) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('pyrolysis_processes')
        .update({
          end_time: new Date().toISOString(),
          output_quantity: outputQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', process.id);
 
      if (error) throw error;
      toast.success('Pyrolysis process completed');
      setSelectedProcess(null);
      setOutputQuantity(0);
      fetchProcesses();
    } catch (error) {
      toast.error('Failed to complete process');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
 
  // Remove the getUniqueBiomassTypesFromCollections function as we won't need it anymore
 
  // Get biomass type for the selected farmer from inventory
  const getSelectedFarmerBiomassType = () => {
    const selectedFarmerInventoryItems = inventoryData.filter(item => item.farmer_id === formData.farmerId);
    if (selectedFarmerInventoryItems.length > 0) {
      return biomassTypes.filter(type =>
        selectedFarmerInventoryItems.some(item => item.biomass_type_id === type.id)
      );
    }
    return [];
  };
 
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Pyrolysis Process</h1>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>Add Process</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Process</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              startProcess(formData);
            }}>
              <div className="space-y-4">
 
                <div className="space-y-2">
                  <Label htmlFor="farmerId">Farmer</Label>
                  <Select
                    onValueChange={(value) => {
                      const farmerInventory = inventoryData.filter(item => item.farmer_id === value);
                      console.log('Farmer Inventory:', farmerInventory);
                      if (farmerInventory.length > 0) {
                        // Get the first inventory item for initial values
                        const firstInventory = farmerInventory[0];
                        setFormData({
                          ...formData,
                          farmerId: value,
                          biomassTypeId: firstInventory.biomass_type_id,
                          inputQuantity: firstInventory.quantity
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a farmer" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(inventoryData.map(item => item.farmer_id))).map((farmerId) => {
                        const farmer = inventoryData.find(item => item.farmer_id === farmerId);
                        return (
                          <SelectItem key={farmerId} value={farmerId}>
                            {farmer?.farmers?.name}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
 
              
 
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
                      {getSelectedFarmerBiomassType().map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {biomassCollections.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available biomass types from your collections
                    </p>
                  )}
                </div>
 
                <div className="space-y-2">
                  <Label htmlFor="totalAvailableQuantity">Total Available Quantity</Label>
                  <Input
                    id="totalAvailableQuantity"
                    type="number"
                    value={totalAvailableQuantity}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
 
                <div className="space-y-2">
                  <Label htmlFor="inputQuantity">Input Quantity</Label>
                  <Input
                    id="inputQuantity"
                    type="number"
                    value={formData.inputQuantity > 0 ? formData.inputQuantity : ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      // Ensure input quantity doesn't exceed total available quantity
                      const validValue = value > totalAvailableQuantity ? totalAvailableQuantity : value;
                      setFormData({ ...formData, inputQuantity: validValue });
                    }}
                    placeholder="Enter input quantity"
                    max={totalAvailableQuantity}
                  />
                  {formData.inputQuantity > totalAvailableQuantity && (
                    <p className="text-xs text-red-500 mt-1">
                      Input cannot exceed available quantity
                    </p>
                  )}
                </div>
 
                <div className="flex space-x-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Starting Process...' : 'Start Process'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
 
      <Dialog open={!!selectedProcess} onOpenChange={(open) => !open && setSelectedProcess(null)}>
        <DialogContent className="sm:max-w-[425px]">
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
 
            <div className="flex space-x-2">
              <Button
                onClick={() => selectedProcess && completeProcess(selectedProcess)}
                disabled={loading}
              >
                {loading ? 'Completing Process...' : 'Complete Process'}
              </Button>
              <Button variant="outline" onClick={() => setSelectedProcess(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
 
      <Card>
        <CardHeader>
          <CardTitle>Process List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Kiln</th>
                  <th className="px-6 py-3">Biomass Type</th>
                  <th className="px-6 py-3">Input Quantity</th>
                  <th className="px-6 py-3">Output Quantity</th>
                  <th className="px-6 py-3">Start Time</th>
                  <th className="px-6 py-3">End Time</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process) => (
                  <tr key={process.id} className="bg-white border-b">
                    <td className="px-6 py-4">{process.kilns?.name}</td>
                    <td className="px-6 py-4">{process.biomass_types?.name}</td>
                    <td className="px-6 py-4">{process.input_quantity}</td>
                    <td className="px-6 py-4">{process.output_quantity || '-'}</td>
                    <td className="px-6 py-4">{new Date(process.start_time).toLocaleString()}</td>
                    <td className="px-6 py-4">{process.end_time ? new Date(process.end_time).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4">
                      {!process.end_time && (
                        <Button
                          onClick={() => setSelectedProcess(process)}
                          size="sm"
                        >
                          Complete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {processes.length === 0 && (
                  <tr className="bg-white border-b">
                    <td colSpan={7} className="px-6 py-4 text-center">
                      No processes recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
 
export default PyrolysisProcess;