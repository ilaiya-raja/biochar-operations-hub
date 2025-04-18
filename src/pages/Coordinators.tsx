
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Mail, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/Spinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import * as z from 'zod';
import { 
  Coordinator, 
  Location, 
  coordinatorService,
  locationService 
} from '@/services/supabase-service';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  phone: z.string().optional(),
  location_id: z.string().optional(),
  status: z.string().default('active'),
});

type FormValues = z.infer<typeof formSchema>;

const Coordinators = () => {
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoordinator, setSelectedCoordinator] = useState<Coordinator | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      location_id: undefined,
      status: 'active',
    },
  });

  const fetchData = async () => {
    setLoading(true);
    const [coordinatorsData, locationsData] = await Promise.all([
      coordinatorService.getCoordinators(),
      locationService.getLocations()
    ]);
    
    setCoordinators(coordinatorsData || []);
    setLocations(locationsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrUpdate = async (values: FormValues) => {
    try {
      if (selectedCoordinator) {
        await coordinatorService.updateCoordinator(selectedCoordinator.id, values);
        toast.success('Coordinator updated successfully');
      } else {
        const newCoordinator = await coordinatorService.createCoordinator(values);
        
        if (values.email) {
          setInviteLoading(true);
          try {
            console.log('Sending invitation to:', values.email);
            const session = await supabase.auth.getSession();
            const accessToken = session.data.session?.access_token;
            
            if (!accessToken) {
              throw new Error('No access token available');
            }
            
            // Use the full URL including the project ID for the Supabase edge function
            const response = await fetch('https://axwhpqvnsqpdqidameqa.functions.supabase.co/send-invite', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                email: values.email,
                name: values.name,
              }),
            });

            // First check if the response is ok before parsing JSON
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Error response:', errorText);
              throw new Error(`Request failed with status ${response.status}: ${errorText || response.statusText}`);
            }
            
            // Now safely parse the JSON
            const result = await response.json();
            
            if (!result.success) {
              throw new Error(result.error || 'Unknown error occurred');
            }
            
            console.log('Invitation response:', result);
            toast.success(result.message || 'Coordinator created successfully');
            
          } catch (error) {
            console.error('Invitation error:', error);
            
            // Check if it's a "user already exists" error which is actually a success case
            if (error.message && error.message.includes('already been registered')) {
              toast.success('Coordinator created and role assigned (user already exists)');
            } else {
              toast.error(`Created coordinator but failed to send invitation: ${error.message}`);
            }
          } finally {
            setInviteLoading(false);
          }
        } else {
          toast.success('Coordinator created successfully');
        }
      }
      
      fetchData();
      setIsFormDialogOpen(false);
      form.reset();
      setSelectedCoordinator(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to process coordinator');
    }
  };

  const handleDelete = async () => {
    if (!selectedCoordinator) return;
    
    await coordinatorService.deleteCoordinator(selectedCoordinator.id);
    fetchData();
    setIsDeleteDialogOpen(false);
    setSelectedCoordinator(null);
  };

  const openEditDialog = (coordinator: Coordinator) => {
    setSelectedCoordinator(coordinator);
    form.reset({
      name: coordinator.name,
      email: coordinator.email || '',
      phone: coordinator.phone || '',
      location_id: coordinator.location_id || undefined,
      status: coordinator.status,
    });
    setIsFormDialogOpen(true);
  };

  const openDeleteDialog = (coordinator: Coordinator) => {
    setSelectedCoordinator(coordinator);
    setIsDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedCoordinator(null);
    form.reset({
      name: '',
      email: '',
      phone: '',
      location_id: undefined,
      status: 'active',
    });
    setIsFormDialogOpen(true);
  };

  const filteredCoordinators = coordinators.filter(coordinator => 
    coordinator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coordinator.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (coordinator.email && coordinator.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (coordinator.phone && coordinator.phone.includes(searchQuery)) ||
    (coordinator.location?.name && coordinator.location.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coordinator Master</h1>
          <p className="text-muted-foreground">
            Manage coordinators for the biochar operations.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Coordinator
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search coordinators..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coordinators</CardTitle>
          <CardDescription>
            A list of all biochar operation coordinators.
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
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoordinators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No coordinators found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoordinators.map((coordinator) => (
                    <TableRow key={coordinator.id}>
                      <TableCell className="font-mono text-xs">{coordinator.id.slice(0, 8)}</TableCell>
                      <TableCell>{coordinator.name}</TableCell>
                      <TableCell>
                        {coordinator.email ? (
                          <div className="flex items-center">
                            <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                            {coordinator.email}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {coordinator.phone ? (
                          <div className="flex items-center">
                            <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                            {coordinator.phone}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {coordinator.location ? coordinator.location.name : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          coordinator.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {coordinator.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(coordinator)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(coordinator)}
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

      {/* Create/Edit Coordinator Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCoordinator ? 'Edit Coordinator' : 'Add Coordinator'}
            </DialogTitle>
            <DialogDescription>
              {selectedCoordinator 
                ? 'Update the coordinator details below.' 
                : 'Fill in the coordinator details below.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateOrUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter coordinator name" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email" type="email" {...field} />
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
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsFormDialogOpen(false)}
                  disabled={inviteLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteLoading}>
                  {inviteLoading ? (
                    <>
                      <Spinner className="mr-2" size="sm" />
                      {selectedCoordinator ? 'Updating...' : 'Creating & Sending Invitation...'}
                    </>
                  ) : (
                    selectedCoordinator ? 'Update' : 'Create'
                  )}
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
            <DialogDescription>
              Are you sure you want to delete the coordinator "{selectedCoordinator?.name}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Coordinators;
