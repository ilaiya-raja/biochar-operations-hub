
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Calendar, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
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
  Activity,
  Coordinator,
  Location,
  Kiln,
  activityService,
  coordinatorService,
  locationService,
  kilnService
} from '@/services/supabase-service';

const activityTypes = [
  'biomass_collection',
  'pyrolysis',
  'biochar_production',
  'fertilizer_application',
  'training',
  'maintenance',
  'other'
];

const formSchema = z.object({
  coordinator_id: z.string({ required_error: 'Coordinator is required' }),
  activity_type: z.string({ required_error: 'Activity type is required' }),
  description: z.string().optional(),
  kiln_id: z.string().optional(),
  location_id: z.string().optional(),
  date_performed: z.string({ required_error: 'Date is required' }),
  quantity: z.coerce.number().min(0).optional(),
  quantity_unit: z.string().optional(),
  status: z.string().default('completed'),
});

type FormValues = z.infer<typeof formSchema>;

const Activities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [kilns, setKilns] = useState<Kiln[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coordinator_id: '',
      activity_type: '',
      description: '',
      kiln_id: undefined,
      location_id: undefined,
      date_performed: new Date().toISOString().split('T')[0],
      quantity: undefined,
      quantity_unit: '',
      status: 'completed',
    },
  });

  const fetchData = async () => {
    setLoading(true);
    const [activitiesData, coordinatorsData, locationsData, kilnsData] = await Promise.all([
      activityService.getActivities(),
      coordinatorService.getCoordinators(),
      locationService.getLocations(),
      kilnService.getKilns()
    ]);
    
    setActivities(activitiesData || []);
    setCoordinators(coordinatorsData || []);
    setLocations(locationsData || []);
    setKilns(kilnsData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrUpdate = async (values: FormValues) => {
    if (selectedActivity) {
      await activityService.updateActivity(selectedActivity.id, values);
    } else {
      await activityService.createActivity(values);
    }
    
    fetchData();
    setIsFormDialogOpen(false);
    form.reset();
    setSelectedActivity(null);
  };

  const handleDelete = async () => {
    if (!selectedActivity) return;
    
    await activityService.deleteActivity(selectedActivity.id);
    fetchData();
    setIsDeleteDialogOpen(false);
    setSelectedActivity(null);
  };

  const openEditDialog = (activity: Activity) => {
    setSelectedActivity(activity);
    form.reset({
      coordinator_id: activity.coordinator_id,
      activity_type: activity.activity_type,
      description: activity.description || '',
      kiln_id: activity.kiln_id || undefined,
      location_id: activity.location_id || undefined,
      date_performed: new Date(activity.date_performed).toISOString().split('T')[0],
      quantity: activity.quantity,
      quantity_unit: activity.quantity_unit || '',
      status: activity.status,
    });
    setIsFormDialogOpen(true);
  };

  const openDeleteDialog = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedActivity(null);
    form.reset({
      coordinator_id: '',
      activity_type: '',
      description: '',
      kiln_id: undefined,
      location_id: undefined,
      date_performed: new Date().toISOString().split('T')[0],
      quantity: undefined,
      quantity_unit: '',
      status: 'completed',
    });
    setIsFormDialogOpen(true);
  };

  const getActivityTypeDisplay = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const filteredActivities = activities.filter(activity => 
    activity.activity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (activity.description && activity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (activity.coordinator?.name && activity.coordinator.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (activity.location?.name && activity.location.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (activity.kiln?.name && activity.kiln.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coordinator Activities</h1>
          <p className="text-muted-foreground">
            Track and manage all biochar operation activities.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Activity
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search activities..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
          <CardDescription>
            A list of all activities related to biochar operations.
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
                  <TableHead>Date</TableHead>
                  <TableHead>Activity Type</TableHead>
                  <TableHead>Coordinator</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Kiln</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No activities found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {format(new Date(activity.date_performed), 'dd MMM yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <ClipboardList className="mr-2 h-4 w-4 text-biochar-500" />
                          {getActivityTypeDisplay(activity.activity_type)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.coordinator ? activity.coordinator.name : '-'}
                      </TableCell>
                      <TableCell>
                        {activity.location ? activity.location.name : '-'}
                      </TableCell>
                      <TableCell>
                        {activity.kiln ? activity.kiln.name : '-'}
                      </TableCell>
                      <TableCell>
                        {activity.quantity 
                          ? `${activity.quantity} ${activity.quantity_unit || ''}` 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : activity.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {activity.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(activity)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(activity)}
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

      {/* Create/Edit Activity Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedActivity ? 'Edit Activity' : 'Add Activity'}
            </DialogTitle>
            <DialogDescription>
              {selectedActivity 
                ? 'Update the activity details below.' 
                : 'Fill in the activity details below.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateOrUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="coordinator_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordinator*</FormLabel>
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
                name="activity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activityTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {getActivityTypeDisplay(type)}
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter description" {...field} />
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
                name="kiln_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kiln</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a kiln" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {kilns.map((kiln) => (
                          <SelectItem key={kiln.id} value={kiln.id}>
                            {kiln.name}
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
                name="date_performed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date*</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter quantity" 
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
                  name="quantity_unit"
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
                          <SelectItem value="bags">bags</SelectItem>
                          <SelectItem value="hours">hours</SelectItem>
                          <SelectItem value="days">days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
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
                  {selectedActivity ? 'Update' : 'Create'}
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
              Are you sure you want to delete this activity? 
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

export default Activities;
