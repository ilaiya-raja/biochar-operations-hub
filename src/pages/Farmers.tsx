
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/Spinner';
import { Label } from '@/components/ui/label';
import { 
  Edit, 
  MoreVertical, 
  Plus, 
  Search, 
  Trash2, 
  Users 
} from 'lucide-react';

interface Farmer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  location_id: string;
  coordinator_id: string;
  location_name?: string;
  coordinator_name?: string;
}

interface Location {
  id: string;
  name: string;
}

interface Coordinator {
  id: string;
  name: string;
}

const Farmers = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<Farmer, 'id' | 'location_name' | 'coordinator_name'>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    location_id: '',
    coordinator_id: '',
  });

  useEffect(() => {
    fetchFarmers();
    fetchLocations();
    fetchCoordinators();
  }, []);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const { data: farmersData, error: farmersError } = await supabase
        .from('farmers')
        .select('*');

      if (farmersError) throw farmersError;

      // Get location names
      const { data: locationsData } = await supabase
        .from('locations')
        .select('id, name');

      // Get coordinator names
      const { data: coordinatorsData } = await supabase
        .from('coordinators')
        .select('id, name');

      // Map location and coordinator names to farmers
      const formattedData = farmersData.map(farmer => {
        const location = locationsData?.find(loc => loc.id === farmer.location_id);
        const coordinator = coordinatorsData?.find(coord => coord.id === farmer.coordinator_id);
        
        return {
          ...farmer,
          location_name: location?.name,
          coordinator_name: coordinator?.name
        };
      });

      setFarmers(formattedData);
    } catch (error) {
      console.error('Error fetching farmers:', error);
      toast.error('Failed to load farmers');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name');
        
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
        .select('id, name');
        
      if (error) throw error;
      setCoordinators(data || []);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      toast.error('Failed to load coordinators');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      location_id: '',
      coordinator_id: '',
    });
    setEditingFarmer(null);
  };

  const handleOpenDialog = (farmer?: Farmer) => {
    if (farmer) {
      setEditingFarmer(farmer);
      setFormData({
        name: farmer.name,
        phone: farmer.phone,
        email: farmer.email || '',
        address: farmer.address || '',
        location_id: farmer.location_id,
        coordinator_id: farmer.coordinator_id,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    resetForm();
    setIsDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.location_id || !formData.coordinator_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      if (editingFarmer) {
        // Update existing farmer
        const { error } = await supabase
          .from('farmers')
          .update(formData)
          .eq('id', editingFarmer.id);
          
        if (error) throw error;
        toast.success('Farmer updated successfully');
      } else {
        // Create new farmer
        const { error } = await supabase
          .from('farmers')
          .insert([formData]);
          
        if (error) throw error;
        toast.success('Farmer added successfully');
      }
      
      handleCloseDialog();
      fetchFarmers();
    } catch (error) {
      console.error('Error saving farmer:', error);
      toast.error('Failed to save farmer');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this farmer?')) {
      try {
        const { error } = await supabase
          .from('farmers')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        toast.success('Farmer deleted successfully');
        fetchFarmers();
      } catch (error) {
        console.error('Error deleting farmer:', error);
        toast.error('Failed to delete farmer');
      }
    }
  };

  const filteredFarmers = farmers.filter(farmer => 
    farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    farmer.phone.includes(searchQuery) ||
    farmer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (farmer.email && farmer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (farmer.location_name && farmer.location_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (farmer.coordinator_name && farmer.coordinator_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Farmer Master</h1>
          <p className="text-muted-foreground">
            Manage all registered farmers in the system
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Farmer
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Farmers</CardTitle>
          <CardDescription>
            Total {farmers.length} farmers registered in the system
          </CardDescription>
          <div className="flex items-center mt-2">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search farmers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Coordinator</TableHead>
                    <TableHead className="w-[60px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFarmers.length > 0 ? (
                    filteredFarmers.map((farmer) => (
                      <TableRow key={farmer.id}>
                        <TableCell className="font-mono text-xs">{farmer.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-medium">{farmer.name}</TableCell>
                        <TableCell>{farmer.phone}</TableCell>
                        <TableCell>{farmer.email || '-'}</TableCell>
                        <TableCell>{farmer.location_name || '-'}</TableCell>
                        <TableCell>{farmer.coordinator_name || '-'}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleOpenDialog(farmer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(farmer.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No farmers found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>
              {editingFarmer ? 'Edit Farmer' : 'Add New Farmer'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location_id" className="text-right">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.location_id} 
                  onValueChange={(value) => handleSelectChange('location_id', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="coordinator_id" className="text-right">
                  Coordinator <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.coordinator_id} 
                  onValueChange={(value) => handleSelectChange('coordinator_id', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    {coordinators.map((coordinator) => (
                      <SelectItem key={coordinator.id} value={coordinator.id}>
                        {coordinator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
                {editingFarmer ? 'Update' : 'Add'} Farmer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Farmers;
