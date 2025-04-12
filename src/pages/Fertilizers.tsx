
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
}

const Fertilizers = () => {
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFertilizer, setSelectedFertilizer] = useState<Fertilizer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    batch_number: '',
    produced_date: '',
    quantity: '',
    quantity_unit: 'kg',
    status: 'available'
  });

  const fetchFertilizers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('fertilizers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFertilizers(data || []);
    } catch (error) {
      console.error('Error fetching fertilizers:', error);
      toast.error('Failed to load fertilizers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFertilizers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fertilizerData = {
        ...formData,
        quantity: parseFloat(formData.quantity)
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
      batch_number: '',
      produced_date: '',
      quantity: '',
      quantity_unit: 'kg',
      status: 'available'
    });
    setSelectedFertilizer(null);
  };

  const openEditDialog = (fertilizer: Fertilizer) => {
    setSelectedFertilizer(fertilizer);
    setFormData({
      name: fertilizer.name,
      type: fertilizer.type,
      batch_number: fertilizer.batch_number || '',
      produced_date: fertilizer.produced_date ? new Date(fertilizer.produced_date).toISOString().split('T')[0] : '',
      quantity: fertilizer.quantity.toString(),
      quantity_unit: fertilizer.quantity_unit,
      status: fertilizer.status
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFertilizers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
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
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Input
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="batch_number" className="text-right">
                  Batch Number
                </Label>
                <Input
                  id="batch_number"
                  name="batch_number"
                  value={formData.batch_number}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
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
