import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/Spinner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Fertilizer {
  id: string;
  name: string;
  type: string;
  batch_number?: string;
  produced_date?: string;
  quantity: number;
  quantity_unit: string;
  status: string;
  created_at: string;
  location_id?: string;
  coordinator_id?: string;
}

interface Location {
  id: string;
  name: string;
}

interface Coordinator {
  id: string;
  name: string;
  location_id: string;
  locations?: Location | Location[];
}

interface Farmer {
  id: string;
  name: string;
}

// Improved BiomassType interface
interface BiomassType {
  name: string;
}

// Updated PyrolysisProcess interface to include biomass_types
interface PyrolysisProcess {
  biomass_type_id: string;
  output_quantity: number;
  end_time: string | null;
  biomass_types?: BiomassType | BiomassType[];
}

const Fertilizers = () => {
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFertilizer, setSelectedFertilizer] = useState<Fertilizer | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [coordinatorProfile, setCoordinatorProfile] = useState<Coordinator | null>(null);
  
  // New state for the dropdown data
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  
  // New state for completed pyrolysis processes
  const [completedBiomassTypes, setCompletedBiomassTypes] = useState<string[]>([]);
  const [pyrolysisProcesses, setPyrolysisProcesses] = useState<PyrolysisProcess[]>([]);
  
  // Update formData to include new fields
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    batch_number: 'first',
    produced_date: '',
    quantity: '',
    quantity_unit: 'kg',
    status: 'available',
    location_id: '',
    coordinator_id: ''
  });

  const fetchFertilizers = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
  
      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('email', user.email)
        .single();
  
      let query = supabase
        .from('fertilizers')
        .select('*')
        .order('created_at', { ascending: false });
  
      if (adminData) {
        // Admin user - fetch all fertilizers without any filters
        const { data, error } = await query;
        if (error) throw error;
        setFertilizers(data || []);
        return;
      }
  
      // If not admin, filter by coordinator's location
      const { data: coordinatorData } = await supabase
        .from('coordinators')
        .select('location_id')
        .eq('email', user.email)
        .single();
  
      if (coordinatorData?.location_id) {
        query = query.eq('location_id', coordinatorData.location_id);
      }
  
      const { data, error } = await query;
      if (error) throw error;
      setFertilizers(data || []);
    } catch (error) {
      console.error('Error fetching fertilizers:', error);
      toast.error('Failed to load fertilizers');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const fetchCoordinators = async () => {
    try {
      const { data, error } = await supabase
        .from('coordinators')
        .select('id, name, location_id')
        .order('name');
      
      if (error) throw error;
      // Transform the data to match the Coordinator interface
      const coordinatorsData: Coordinator[] = (data || []).map(coord => ({
        id: coord.id,
        name: coord.name,
        location_id: coord.location_id
      }));
      setCoordinators(coordinatorsData);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      toast.error('Failed to load coordinators');
    }
  };

  // New function to fetch farmers
  const fetchFarmers = async () => {
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setFarmers(data || []);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error('Failed to load farmers');
    }
  };

  // Fixed function to fetch completed pyrolysis processes
  const fetchCompletedPyrolysisProcesses = async () => {
    try {
      const { data, error } = await supabase
        .from('pyrolysis_processes')
        .select(`
          biomass_type_id,
          output_quantity,
          end_time,
          biomass_types:biomass_type_id (name)
        `)
        .not('end_time', 'is', null)
        .order('end_time', { ascending: false });
      
      if (error) throw error;
      
      // Extract completed biomass types
      const processes = data || [];
      setPyrolysisProcesses(processes as PyrolysisProcess[]);
      
      // Get unique biomass type names
      const uniqueBiomassTypes = [...new Set(processes.map(process => {
        if (!process.biomass_types) return '';
        
        // Fix: Handle biomass_types properly regardless of its shape
        if (Array.isArray(process.biomass_types)) {
          return process.biomass_types.length > 0 ? process.biomass_types[0].name : '';
        }
        
        // Access name property safely on the object
        return (process.biomass_types as BiomassType).name || '';
      }))].filter(name => name !== '');
      
      setCompletedBiomassTypes(uniqueBiomassTypes);
    } catch (error) {
      console.error('Error fetching completed pyrolysis processes:', error);
      toast.error('Failed to load pyrolysis data');
    }
  };

  const fetchCoordinatorProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('coordinators')
        .select(`
          id, 
          name,
          location_id,
          locations (
            id,
            name
          )
        `)
        .eq('email', user.email)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Fix: Handle locations as an object or array based on the structure
        let locationData: Location | undefined;
        if (data.locations) {
          if (Array.isArray(data.locations) && data.locations.length > 0) {
            locationData = data.locations[0];
          } else if (typeof data.locations === 'object') {
            locationData = data.locations as unknown as Location;
          }
        }
        
        const coordinatorData: Coordinator = {
          id: data.id,
          name: data.name,
          location_id: data.location_id,
          locations: locationData
        };
        
        setCoordinatorProfile(coordinatorData);
        setFormData(prev => ({
          ...prev,
          coordinator_id: data.id,
          location_id: data.location_id || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching coordinator profile:', error);
    }
  };

  useEffect(() => {
    fetchFertilizers();
    fetchLocations();
    fetchCoordinators();
    fetchCoordinatorProfile();
    fetchFarmers();
    fetchCompletedPyrolysisProcesses(); // Fetch pyrolysis processes
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      // Find the matching pyrolysis process for this biomass type
      const matchingProcess = pyrolysisProcesses.find(process => {
        if (!process.biomass_types) return false;
        
        // Fix: Handle both array and object cases for biomass_types
        if (Array.isArray(process.biomass_types)) {
          return process.biomass_types.some(bt => bt.name === value);
        } else {
          return (process.biomass_types as BiomassType).name === value;
        }
      });
      
      // Set quantity based on matched pyrolysis process output_quantity
      let quantity = '';
      
      if (matchingProcess && matchingProcess.output_quantity) {
        quantity = matchingProcess.output_quantity.toString();
      }
      
      setFormData(prev => ({ ...prev, [name]: value, quantity }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Only include fields that exist in the database
      const fertilizerData = {
        name: formData.name,
        type: formData.type,
        batch_number: formData.batch_number,
        produced_date: formData.produced_date,
        quantity: parseFloat(formData.quantity),
        quantity_unit: formData.quantity_unit,
        status: formData.status,
        location_id: formData.location_id
        // Remove coordinator_id as it's not in the database schema
      };

      if (selectedFertilizer) {
        const { error } = await supabase
          .from('fertilizers')
          .update(fertilizerData)
          .eq('id', selectedFertilizer.id);

        if (error) throw error;
        toast.success('Fertilizer updated successfully');
      } else {
        const { error } = await supabase
          .from('fertilizers')
          .insert([fertilizerData]);

        if (error) throw error;
        toast.success('Fertilizer added successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchFertilizers();
    } catch (error) {
      console.error('Error saving fertilizer:', error);
      toast.error('Failed to save fertilizer');
    }
  };

  const handleDelete = async () => {
    if (!selectedFertilizer) return;

    try {
      const { error } = await supabase
        .from('fertilizers')
        .delete()
        .eq('id', selectedFertilizer.id);

      if (error) throw error;
      toast.success('Fertilizer deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchFertilizers();
    } catch (error) {
      console.error('Error deleting fertilizer:', error);
      toast.error('Failed to delete fertilizer');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      batch_number: 'first',
      produced_date: '',
      quantity: '',
      quantity_unit: 'kg',
      status: 'available',
      location_id: coordinatorProfile?.location_id || '',
      coordinator_id: coordinatorProfile?.id || ''
    });
    setSelectedFertilizer(null);
  };

  const openEditDialog = (fertilizer: Fertilizer) => {
    setSelectedFertilizer(fertilizer);
    setFormData({
      name: fertilizer.name,
      type: fertilizer.type,
      batch_number: fertilizer.batch_number || 'first',
      produced_date: fertilizer.produced_date ? new Date(fertilizer.produced_date).toISOString().split('T')[0] : '',
      quantity: fertilizer.quantity.toString(),
      quantity_unit: fertilizer.quantity_unit,
      status: fertilizer.status,
      location_id: fertilizer.location_id || coordinatorProfile?.location_id || '',
      coordinator_id: coordinatorProfile?.id || ''
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (fertilizer: Fertilizer) => {
    setSelectedFertilizer(fertilizer);
    setIsDeleteDialogOpen(true);
  };

  const filteredFertilizers = fertilizers.filter(fertilizer =>
    fertilizer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fertilizer.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fertilizer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (fertilizer.batch_number && fertilizer.batch_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biochar Fertilizer</h1>
          <p className="text-muted-foreground">
            Manage biochar fertilizer inventory and track batch information
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Fertilizer
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search fertilizers..."
          className="max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fertilizers</CardTitle>
          <CardDescription>
            A list of all biochar fertilizer batches in inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFertilizers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No fertilizers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFertilizers.map((fertilizer) => (
                    <TableRow key={fertilizer.id}>
                      <TableCell className="font-mono text-xs">{fertilizer.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">{fertilizer.name}</TableCell>
                      <TableCell>{fertilizer.type}</TableCell>
                      <TableCell>{fertilizer.batch_number || '-'}</TableCell>
                      <TableCell>{fertilizer.quantity} {fertilizer.quantity_unit}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          fertilizer.status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {fertilizer.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {locations.find(loc => loc.id === fertilizer.location_id)?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(fertilizer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(fertilizer)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedFertilizer ? 'Edit Fertilizer' : 'Add New Fertilizer'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Farmer Name dropdown */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Farmer Name
                </Label>
                <select
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="px-3 py-2 border rounded-md col-span-3"
                  required
                >
                  <option value="">Select a farmer</option>
                  {farmers.map(farmer => (
                    <option key={farmer.id} value={farmer.name}>
                      {farmer.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Biomass Type dropdown - UPDATED to show completed biomass types */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Biomass Type
                </Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="px-3 py-2 border rounded-md col-span-3"
                  required
                >
                  <option value="">Select biomass type</option>
                  {completedBiomassTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Batch Number dropdown */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="batch_number" className="text-right">
                  Batch Number
                </Label>
                <select
                  id="batch_number"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleInputChange}
                  className="px-3 py-2 border rounded-md col-span-3"
                >
                  <option value="first">First</option>
                  <option value="second">Second</option>
                  <option value="third">Third</option>
                </select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="produced_date" className="text-right">
                  Production Date
                </Label>
                <Input
                  id="produced_date"
                  name="produced_date"
                  type="date"
                  value={formData.produced_date}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              
              {/* Auto-filled quantity based on biomass type */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Quantity
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="flex-1"
                    required
                    readOnly={formData.type !== ''}
                  />
                  <select
                    id="quantity_unit"
                    name="quantity_unit"
                    value={formData.quantity_unit}
                    onChange={handleInputChange}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="kg">kg</option>
                    <option value="ton">ton</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="px-3 py-2 border rounded-md col-span-3"
                >
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="used">Used</option>
                </select>
              </div>

              {/* Location field */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location_id" className="text-right">
                  Location
                </Label>
                {coordinatorProfile ? (
                  <Input
                    id="location_id"
                    name="location_id"
                    value={locations.find(loc => loc.id === formData.location_id)?.name || ''}
                    className="col-span-3"
                    disabled
                  />
                ) : (
                  <select
                    id="location_id"
                    name="location_id"
                    value={formData.location_id}
                    onChange={handleInputChange}
                    className="px-3 py-2 border rounded-md col-span-3"
                    required
                  >
                    <option value="">Select a location</option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Coordinator field */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="coordinator_id" className="text-right">
                  Coordinator
                </Label>
                <Input
                  id="coordinator_id"
                  name="coordinator_id"
                  value={coordinators.find(coord => coord.id === formData.coordinator_id)?.name || ''}
                  className="col-span-3"
                  disabled
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedFertilizer ? 'Update' : 'Add'} Fertilizer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this fertilizer? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Fertilizers;