
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/Spinner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Farmer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  location_id: string;
  coordinator_id: string;
  location?: Location;
  coordinator?: Coordinator;
  created_at: string;
  updated_at: string;
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    location_id: '',
    coordinator_id: '',
  });
  const [formErrors, setFormErrors] = useState({
    name: false,
    phone: false,
    location_id: false,
    coordinator_id: false,
  });
  const { userRole } = useAuth();
  const [coordinatorProfile, setCoordinatorProfile] = useState<Coordinator | null>(null);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('farmers')
        .select('*, location:locations(id, name), coordinator:coordinators(id, name)')
        .order('name');
      
      if (error) throw error;
      setFarmers(data || []);
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
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCoordinators(data || []);
    } catch (error) {
      console.error('Error fetching coordinators:', error);
      toast.error('Failed to load coordinators');
    }
  };

  const fetchCoordinatorProfile = async () => {
    if (userRole !== 'coordinator') return;

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find the coordinator profile by matching email
      const { data, error } = await supabase
        .from('coordinators')
        .select('id, name, location_id')
        .eq('email', user.email)
        .single();
      
      if (error) {
        console.error('Error fetching coordinator profile:', error);
        return;
      }
      
      if (data) {
        setCoordinatorProfile(data);
        // Pre-set the form data with coordinator's values
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
    fetchFarmers();
    fetchLocations();
    fetchCoordinators();
    fetchCoordinatorProfile();
  }, [userRole]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const validateForm = () => {
    const errors = {
      name: !formData.name,
      phone: !formData.phone,
      location_id: !formData.location_id,
      coordinator_id: !formData.coordinator_id,
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // If user is a coordinator, override location_id and coordinator_id with their own
    const submissionData = { ...formData };
    if (userRole === 'coordinator' && coordinatorProfile) {
      submissionData.coordinator_id = coordinatorProfile.id;
      submissionData.location_id = coordinatorProfile.location_id || formData.location_id;
    }

    try {
      if (selectedFarmer) {
        const { error } = await supabase
          .from('farmers')
          .update({
            name: submissionData.name,
            phone: submissionData.phone,
            email: submissionData.email || null,
            address: submissionData.address || null,
            location_id: submissionData.location_id,
            coordinator_id: submissionData.coordinator_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedFarmer.id);

        if (error) throw error;
        toast.success('Farmer updated successfully');
      } else {
        const { error } = await supabase
          .from('farmers')
          .insert({
            name: submissionData.name,
            phone: submissionData.phone,
            email: submissionData.email || null,
            address: submissionData.address || null,
            location_id: submissionData.location_id,
            coordinator_id: submissionData.coordinator_id,
          });

        if (error) throw error;
        toast.success('Farmer added successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchFarmers();
    } catch (error) {
      console.error('Error saving farmer:', error);
      toast.error('Failed to save farmer');
    }
  };

  const handleDelete = async () => {
    if (!selectedFarmer) return;

    try {
      const { error } = await supabase
        .from('farmers')
        .delete()
        .eq('id', selectedFarmer.id);

      if (error) throw error;
      toast.success('Farmer deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchFarmers();
    } catch (error) {
      console.error('Error deleting farmer:', error);
      toast.error('Failed to delete farmer');
    }
  };

  const resetForm = () => {
    const initialFormData = {
      name: '',
      phone: '',
      email: '',
      address: '',
      location_id: '',
      coordinator_id: '',
    };

    // If user is a coordinator, pre-set their ID and location
    if (userRole === 'coordinator' && coordinatorProfile) {
      initialFormData.coordinator_id = coordinatorProfile.id;
      initialFormData.location_id = coordinatorProfile.location_id || '';
    }

    setFormData(initialFormData);
    setFormErrors({
      name: false,
      phone: false,
      location_id: false,
      coordinator_id: false,
    });
    setSelectedFarmer(null);
  };

  const openEditDialog = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    
    // Start with the farmer data
    let editFormData = {
      name: farmer.name,
      phone: farmer.phone,
      email: farmer.email || '',
      address: farmer.address || '',
      location_id: farmer.location_id,
      coordinator_id: farmer.coordinator_id,
    };
    
    // If user is a coordinator, enforce their ID and location
    if (userRole === 'coordinator' && coordinatorProfile) {
      editFormData.coordinator_id = coordinatorProfile.id;
      editFormData.location_id = coordinatorProfile.location_id || farmer.location_id;
    }
    
    setFormData(editFormData);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (farmer: Farmer) => {
    // Only allow delete if admin or if coordinator owns this farmer
    if (userRole === 'coordinator' && farmer.coordinator_id !== coordinatorProfile?.id) {
      toast.error("You can only delete farmers assigned to you");
      return;
    }
    
    setSelectedFarmer(farmer);
    setIsDeleteDialogOpen(true);
  };

  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    farmer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (farmer.phone && farmer.phone.includes(searchQuery)) ||
    (farmer.email && farmer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (farmer.location?.name && farmer.location.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (farmer.coordinator?.name && farmer.coordinator.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).filter(farmer => {
    // If coordinator, only show their farmers
    if (userRole === 'coordinator' && coordinatorProfile) {
      return farmer.coordinator_id === coordinatorProfile.id;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Farmer Master</h1>
          <p className="text-muted-foreground">
            Manage all farmers who are part of the biochar program
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Farmer
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search farmers..."
          className="max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Farmers</CardTitle>
          <CardDescription>
            A list of all farmers managed in the system
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
                  <TableHead>Farmer ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFarmers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No farmers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFarmers.map((farmer) => (
                    <TableRow key={farmer.id}>
                      <TableCell className="font-mono text-xs">{farmer.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          {farmer.name}
                        </div>
                      </TableCell>
                      <TableCell>{farmer.phone}</TableCell>
                      <TableCell>{farmer.location?.name || '-'}</TableCell>
                      <TableCell>{farmer.coordinator?.name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(farmer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(farmer)}
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
              {selectedFarmer ? 'Edit Farmer' : 'Add New Farmer'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`col-span-3 ${formErrors.name ? 'border-red-500' : ''}`}
                />
                {formErrors.name && (
                  <div className="col-span-3 col-start-2 text-xs text-red-500">
                    Name is required
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`col-span-3 ${formErrors.phone ? 'border-red-500' : ''}`}
                />
                {formErrors.phone && (
                  <div className="col-span-3 col-start-2 text-xs text-red-500">
                    Phone is required
                  </div>
                )}
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
              
              {userRole === 'admin' ? (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location_id" className="text-right">
                      Location *
                    </Label>
                    <Select
                      value={formData.location_id}
                      onValueChange={(value) => handleSelectChange('location_id', value)}
                    >
                      <SelectTrigger
                        id="location_id"
                        className={`col-span-3 ${formErrors.location_id ? 'border-red-500' : ''}`}
                      >
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.location_id && (
                      <div className="col-span-3 col-start-2 text-xs text-red-500">
                        Location is required
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="coordinator_id" className="text-right">
                      Coordinator *
                    </Label>
                    <Select
                      value={formData.coordinator_id}
                      onValueChange={(value) => handleSelectChange('coordinator_id', value)}
                    >
                      <SelectTrigger
                        id="coordinator_id"
                        className={`col-span-3 ${formErrors.coordinator_id ? 'border-red-500' : ''}`}
                      >
                        <SelectValue placeholder="Select coordinator" />
                      </SelectTrigger>
                      <SelectContent>
                        {coordinators.map((coordinator) => (
                          <SelectItem key={coordinator.id} value={coordinator.id}>
                            {coordinator.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.coordinator_id && (
                      <div className="col-span-3 col-start-2 text-xs text-red-500">
                        Coordinator is required
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* For coordinators, display read-only fields */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location_display" className="text-right">
                      Location
                    </Label>
                    <div className="col-span-3 px-3 py-2 border rounded bg-gray-50">
                      {locations.find(l => l.id === formData.location_id)?.name || 'Your assigned location'}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="coordinator_display" className="text-right">
                      Coordinator
                    </Label>
                    <div className="col-span-3 px-3 py-2 border rounded bg-gray-50">
                      {coordinatorProfile?.name || 'You'}
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedFarmer ? 'Update' : 'Add'} Farmer
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
          <p>Are you sure you want to delete this farmer? This action cannot be undone.</p>
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

export default Farmers;
