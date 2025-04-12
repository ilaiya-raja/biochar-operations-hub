
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, SproutIcon } from 'lucide-react';
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
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface Fertilizer {
  id: string;
  name: string;
  type: string;
  batch_number: string;
  produced_date: string;
  quantity: number;
  quantity_unit: string;
  status: string;
  created_at: string;
}

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  type: z.string().min(1, { message: 'Please select a type.' }),
  batch_number: z.string().optional(),
  produced_date: z.string().optional(),
  quantity: z.coerce.number().min(0, { message: 'Quantity must be a positive number.' }),
  quantity_unit: z.string().min(1, { message: 'Please select a unit.' }),
  status: z.string().default('available'),
});

type FormValues = z.infer<typeof formSchema>;

const Fertilizers = () => {
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFertilizer, setSelectedFertilizer] = useState<Fertilizer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      batch_number: '',
      produced_date: '',
      quantity: 0,
      quantity_unit: 'kg',
      status: 'available',
    },
  });

  const fetchFertilizers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fertilizers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setFertilizers(data || []);
    } catch (error) {
      console.error('Error fetching fertilizers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch fertilizers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFertilizers();
  }, []);

  const handleCreateOrUpdate = async (values: FormValues) => {
    try {
      if (selectedFertilizer) {
        const { error } = await supabase
          .from('fertilizers')
          .update(values)
          .eq('id', selectedFertilizer.id);

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Fertilizer updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('fertilizers')
          .insert([values]);

        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Fertilizer created successfully',
        });
      }
      
      fetchFertilizers();
      setIsFormDialogOpen(false);
      form.reset();
      setSelectedFertilizer(null);
    } catch (error) {
      console.error('Error saving fertilizer:', error);
      toast({
        title: 'Error',
        description: 'Failed to save fertilizer',
        variant: 'destructive',
      });
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
      
      toast({
        title: 'Success',
        description: 'Fertilizer deleted successfully',
      });
      
      fetchFertilizers();
      setIsDeleteDialogOpen(false);
      setSelectedFertilizer(null);
    } catch (error) {
      console.error('Error deleting fertilizer:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete fertilizer',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (fertilizer: Fertilizer) => {
    setSelectedFertilizer(fertilizer);
    form.reset({
      name: fertilizer.name,
      type: fertilizer.type,
      batch_number: fertilizer.batch_number,
      produced_date: fertilizer.produced_date,
      quantity: fertilizer.quantity,
      quantity_unit: fertilizer.quantity_unit,
      status: fertilizer.status,
    });
    setIsFormDialogOpen(true);
  };

  const openDeleteDialog = (fertilizer: Fertilizer) => {
    setSelectedFertilizer(fertilizer);
    setIsDeleteDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedFertilizer(null);
    form.reset({
      name: '',
      type: '',
      batch_number: '',
      produced_date: '',
      quantity: 0,
      quantity_unit: 'kg',
      status: 'available',
    });
    setIsFormDialogOpen(true);
  };

  const filteredFertilizers = fertilizers.filter(fertilizer => 
    fertilizer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fertilizer.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fertilizer.batch_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biochar Fertilizer</h1>
          <p className="text-muted-foreground">
            Manage fertilizer inventory produced from biochar.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Fertilizer
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search fertilizers..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Biochar Fertilizers</CardTitle>
          <CardDescription>
            A list of all fertilizers produced from biochar.
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
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Production Date</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFertilizers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No fertilizers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFertilizers.map((fertilizer) => (
                    <TableRow key={fertilizer.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <SproutIcon className="mr-2 h-4 w-4 text-biochar-600" />
                          {fertilizer.name}
                        </div>
                      </TableCell>
                      <TableCell>{fertilizer.type}</TableCell>
                      <TableCell>{fertilizer.batch_number || '-'}</TableCell>
                      <TableCell>
                        {fertilizer.produced_date ? new Date(fertilizer.produced_date).toLocaleDateString() : '-'}
                      </TableCell>
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

      {/* Create/Edit Fertilizer Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedFertilizer ? 'Edit Fertilizer' : 'Add Fertilizer'}
            </DialogTitle>
            <DialogDescription>
              {selectedFertilizer 
                ? 'Update the fertilizer details below.' 
                : 'Fill in the fertilizer details below.'}
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
                      <Input placeholder="Enter fertilizer name" {...field} />
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
                    <FormLabel>Type*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fertilizer type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="biochar">Biochar</SelectItem>
                        <SelectItem value="biochar_compost">Biochar Compost</SelectItem>
                        <SelectItem value="biochar_mix">Biochar Mix</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="batch_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter batch number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="produced_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Quantity*</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity_unit"
                  render={({ field }) => (
                    <FormItem className="w-1/3">
                      <FormLabel>Unit*</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="ton">ton</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
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
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                        <SelectItem value="depleted">Depleted</SelectItem>
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
                  {selectedFertilizer ? 'Update' : 'Create'}
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
              Are you sure you want to delete the fertilizer "{selectedFertilizer?.name}"? 
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

export default Fertilizers;
