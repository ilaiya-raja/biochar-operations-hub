
// Update the access to coordinator.location_id in Farmers.tsx to fix the build errors
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, User } from 'lucide-react';
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
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Spinner } from '@/components/Spinner';
import {
  farmerService,
  locationService,
  coordinatorService,
  Farmer,
  Location,
  Coordinator
} from '@/services/supabase-service';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(2, { message: 'Phone is required.' }),
  email: z.string().email({ message: 'Invalid email address.' }).optional().or(z.literal('')),
  address: z.string().optional(),
  location_id: z.string().min(1, { message: 'Location is required.' }),
  coordinator_id: z.string().min(1, { message: 'Coordinator is required.' }),
});

type FormValues = z.infer<typeof formSchema>;

const Farmers = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const { userRole, userProfile } = useAuth();
  
  // State to store the coordinator's location and name for display
  const [coordinatorLocationName, setCoordinatorLocationName] = useState<string>('');
  const [coordinatorName, setCoordinatorName] = useState<string>('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      location_id: '',
      coordinator_id: '',
    },
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [farmersData, locationsData, coordinatorsData] = await Promise.all([
        farmerService.getFarmers(),
        locationService.getLocations(),
        coordinatorService.getCoordinators()
      ]);
      
      let filteredFarmers = farmersData || [];
      let filteredLocations = locationsData || [];
      let filteredCoordinators = coordinatorsData || [];
      
      // If user is a coordinator, filter data to only show their farmers
      if (userRole === 'coordinator' && userProfile?.coordinator) {
        filteredFarmers = filteredFarmers.filter(
          farmer => farmer.coordinator_id === userProfile.coordinator.id
        );
        
        // For coordinator, only show their location
        if (userProfile.coordinator.location_id) {
          filteredLocations = filteredLocations.filter(
            location => location.id === userProfile.coordinator.location_id
          );
          
          // Find and store the coordinator's location name
          const coordinatorLocation = locationsData?.find(
            location => location.id === userProfile.coordinator.location_id
          );
          if (coordinatorLocation) {
            setCoordinatorLocationName(coordinatorLocation.name);
          }
        }
        
        // For coordinator, only show themselves in the coordinators list
        filteredCoordinators = filteredCoordinators.filter(
          coordinator => coordinator.id === userProfile.coordinator.id
        );
        
        // Find and store the coordinator's name
        const coordinator = coordinatorsData?.find(
          coordinator => coordinator.id === userProfile.coordinator.id
        );
        if (coordinator) {
          setCoordinatorName(coordinator.name);
        }
      }
      
      setFarmers(filteredFarmers);
      setLocations(filteredLocations);
      setCoordinators(filteredCoordinators);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole, userProfile]);

  const onSubmit = async (data: FormValues) => {
    try {
      // If user is coordinator, force their coordinator ID and location
      let submissionData = {...data};
      if (userRole === 'coordinator' && userProfile?.coordinator) {
        submissionData.coordinator_id = userProfile.coordinator.id;
        if (userProfile.coordinator.location_id) {
          submissionData.location_id = userProfile.coordinator.location_id;
        }
      }
      
      if (selectedFarmer) {
        // Check if coordinator has permission to edit this farmer
        if (userRole === 'coordinator' && selectedFarmer.coordinator_id !== userProfile?.coordinator?.id) {
          toast.error("You don't have permission to edit this farmer");
          return;
        }
        
        await farmerService.updateFarmer(selectedFarmer.id, submissionData);
        toast.success('Farmer updated successfully');
      } else {
        await farmerService.createFarmer(submissionData);
        toast.success('Farmer added successfully');
      }
      
      setIsFormDialogOpen(false);
      form.reset();
      fetchData();
    } catch (error) {
      console.error('Error saving farmer:', error);
      toast.error('Failed to save farmer');
    }
  };

  const handleDelete = async () => {
    if (!selectedFarmer) return;
    
    // Check if coordinator has permission to delete this farmer
    if (userRole === 'coordinator' && selectedFarmer.coordinator_id !== userProfile?.coordinator?.id) {
      toast.error("You don't have permission to delete this farmer");
      return;
    }
    
    try {
      await farmerService.deleteFarmer(selectedFarmer.id);
      toast.success('Farmer deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting farmer:', error);
      toast.error('Failed to delete farmer');
    }
  };

  const openCreateDialog = () => {
    setSelectedFarmer(null);
    
    // If user is coordinator, pre-fill their coordinator ID and location
    if (userRole === 'coordinator' && userProfile?.coordinator) {
      form.reset({
        name: '',
        phone: '',
        email: '',
        address: '',
        location_id: userProfile.coordinator.location_id || '',
        coordinator_id: userProfile.coordinator.id,
      });
    } else {
      form.reset();
    }
    
    setIsFormDialogOpen(true);
  };

  const openEditDialog = (farmer: Farmer) => {
    // Check if coordinator has permission to edit this farmer
    if (userRole === 'coordinator' && farmer.coordinator_id !== userProfile?.coordinator?.id) {
      toast.error("You don't have permission to edit this farmer");
      return;
    }
    
    setSelectedFarmer(farmer);
    form.reset({
      name: farmer.name,
      phone: farmer.phone,
      email: farmer.email || '',
      address: farmer.address || '',
      location_id: farmer.location_id,
      coordinator_id: farmer.coordinator_id,
    });
    setIsFormDialogOpen(true);
  };

  const openDeleteDialog = (farmer: Farmer) => {
    // Check if coordinator has permission to delete this farmer
    if (userRole === 'coordinator' && farmer.coordinator_id !== userProfile?.coordinator?.id) {
      toast.error("You don't have permission to delete this farmer");
      return;
    }
    
    setSelectedFarmer(farmer);
    setIsDeleteDialogOpen(true);
  };

  const filteredFarmers = farmers.filter(farmer =>
    farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (farmer.email && farmer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    farmer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (farmer.location?.name && farmer.location.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (farmer.coordinator?.name && farmer.coordinator.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Farmer Master</h1>
          <p className="text-muted-foreground">
            Manage farmers participating in the biochar project
          </p>
        </div>
        <Button onClick={openCreateDialog}>
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
            A list of all farmers registered in the system
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
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
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
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-blue-500" />
                          {farmer.name}
                        </div>
                      </TableCell>
                      <TableCell>{farmer.phone}</TableCell>
                      <TableCell>{farmer.email || '-'}</TableCell>
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
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedFarmer ? 'Edit Farmer' : 'Add New Farmer'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter farmer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    {userRole === 'coordinator' ? (
                      <FormControl>
                        <Input 
                          value={coordinatorLocationName || "Not assigned"} 
                          disabled 
                          className="bg-muted"
                        />
                      </FormControl>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coordinator_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordinator</FormLabel>
                    {userRole === 'coordinator' ? (
                      <FormControl>
                        <Input 
                          value={coordinatorName || "Not assigned"} 
                          disabled 
                          className="bg-muted"
                        />
                      </FormControl>
                    ) : (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a coordinator" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {coordinators.map((coordinator) => (
                            <SelectItem key={coordinator.id} value={coordinator.id}>
                              {coordinator.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedFarmer ? 'Update' : 'Add'} Farmer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this farmer? This action cannot be
            undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
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
