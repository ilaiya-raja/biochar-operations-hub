
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, FlameIcon } from 'lucide-react';
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
import * as z from 'zod';
import { 
  Kiln, 
  Location, 
  Coordinator,
  kilnService,
  locationService,
  coordinatorService
} from '@/services/supabase-service';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  type: z.string().optional(),
  capacity: z.coerce.number().min(0).optional(),
  capacity_unit: z.string().optional(),
  location_id: z.string().optional(),
  coordinator_id: z.string().optional(),
  status: z.string().default('active'),
});

type FormValues = z.infer<typeof formSchema>;

const Kilns = () => {
  const [kilns, setKilns] = useState<Kiln[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKiln, setSelectedKiln] = useState<Kiln | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      capacity: undefined,
      capacity_unit: '',
      location_id: undefined,
      coordinator_id: undefined,
      status: 'active',
    },
  });

  const fetchData = async () => {
    setLoading(true);
    const [kilnsData, locationsData, coordinatorsData] = await Promise.all([
      kilnService.getKilns(),
      locationService.getLocations(),
      coordinatorService.getCoordinators()
    ]);
    
    setKilns(kilnsData || []);
    setLocations(locationsData || []);
    setCoordinators(coordinatorsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrUpdate = async (values: FormValues) => {
    if (selectedKiln) {
      await kilnService.updateKiln(selectedKiln.id, values);
    } else {
      await kilnService.createKiln(values);
    }
    
    fetchData();
    setIsFormDialogOpen(false);
    form.reset();
    setSelectedKiln(null);
  };

  const handleDelete = async () => {
    if (!selectedKiln) return;
    
    await kilnService.deleteKiln(selectedKiln.id);
    fetchData();
    setIsDeleteDialogOpen(false);
    setSelectedKiln(null);
  };

  const openEditDialog = (kiln: Kiln) => {
    setSelectedKiln(kiln);
    form.reset({
      name: kiln.name,
      type: kiln.type || '',
      capacity: kiln.capacity,
      capacity_unit: kiln.capacity_unit || '',
      location_id: kiln.location_id || undefined,
      coordinator_id: kiln.coordinator_id || undefined,
      status: kiln.status,
    });
    setIsFormDialogOpen(true);
  };

  const openDeleteDialog = (kiln: Kiln) => {
    setSelectedKiln(kiln);
    setIsDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedKiln(null);
    form.reset({
      name: '',
      type: '',
      capacity: undefined,
      capacity_unit: '',
      location_id: undefined,
      coordinator_id: undefined,
      status: 'active',
    });
    setIsFormDialogOpen(true);
  };

  const filteredKilns = kilns.filter(kiln => 
    kiln.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (kiln.type && kiln.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (kiln.location?.name && kiln.location.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (kiln.coordinator?.name && kiln.coordinator.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kiln Master</h1>
          <p className="text-muted-foreground">
            Manage biochar pyrolysis kilns.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Kiln
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search kilns..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kilns</CardTitle>
          <CardDescription>
            A list of all pyrolysis kilns.
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
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKilns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No kilns found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKilns.map((kiln) => (
                    <TableRow key={kiln.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <FlameIcon className="mr-2 h-4 w-4 text-amber-500" />
                          {kiln.name}
                        </div>
                      </TableCell>
                      <TableCell>{kiln.type || '-'}</TableCell>
                      <TableCell>
                        {kiln.capacity 
                          ? `${kiln.capacity} ${kiln.capacity_unit || ''}` 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {kiln.location ? kiln.location.name : '-'}
                      </TableCell>
                      <TableCell>
                        {kiln.coordinator ? kiln.coordinator.name : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          kiln.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {kiln.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(kiln)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(kiln)}
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

      {/* Create/Edit Kiln Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedKiln ? 'Edit Kiln' : 'Add Kiln'}
            </DialogTitle>
            <DialogDescription>
              {selectedKiln 
                ? 'Update the kiln details below.' 
                : 'Fill in the kiln details below.'}
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
                      <Input placeholder="Enter kiln name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter kiln type" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter capacity" 
                          {...field} 
                          value={field.value === undefined ? '' : field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="tonnes">tonnes</SelectItem>
                          <SelectItem value="cubic meters">cubic meters</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ''}
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
                name="coordinator_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordinator</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ''}
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
                        <SelectItem value="maintenance">Maintenance</SelectItem>
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
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedKiln ? 'Update' : 'Create'}
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
              Are you sure you want to delete the kiln "{selectedKiln?.name}"? 
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

export default Kilns;
