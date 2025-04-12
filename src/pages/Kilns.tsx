
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Flame } from 'lucide-react';
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
import {
  kilnService,
  locationService, 
  coordinatorService,
  Kiln,
  Location,
  Coordinator
} from '@/services/supabase-service';

const Kilns = () => {
  const [kilns, setKilns] = useState<Kiln[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedKiln, setSelectedKiln] = useState<Kiln | null>(null);
  const [formData, setFormData] = useState<{
    type: string;
    capacity: string;
    capacity_unit: string;
    location_id: string;
    coordinator_id: string;
    status: string;
  }>({
    type: '',
    capacity: '',
    capacity_unit: 'kg',
    location_id: '',
    coordinator_id: '',
    status: 'active',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [kilnsData, locationsData, coordinatorsData] = await Promise.all([
        kilnService.getKilns(),
        locationService.getLocations(),
        coordinatorService.getCoordinators()
      ]);
      
      setKilns(kilnsData || []);
      setLocations(locationsData || []);
      setCoordinators(coordinatorsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const kilnData = {
        ...formData,
        capacity: formData.capacity ? parseFloat(formData.capacity) : null,
      };

      if (selectedKiln) {
        await kilnService.updateKiln(selectedKiln.id, kilnData);
        toast.success('Kiln updated successfully');
      } else {
        await kilnService.createKiln(kilnData);
        toast.success('Kiln added successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving kiln:', error);
      toast.error('Failed to save kiln');
    }
  };

  const handleDelete = async () => {
    if (!selectedKiln) return;
    
    try {
      await kilnService.deleteKiln(selectedKiln.id);
      toast.success('Kiln deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting kiln:', error);
      toast.error('Failed to delete kiln');
    }
  };

  const resetForm = () => {
    setFormData({
      type: '',
      capacity: '',
      capacity_unit: 'kg',
      location_id: '',
      coordinator_id: '',
      status: 'active',
    });
    setSelectedKiln(null);
  };

  const openEditDialog = (kiln: Kiln) => {
    setSelectedKiln(kiln);
    setFormData({
      type: kiln.type || '',
      capacity: kiln.capacity ? kiln.capacity.toString() : '',
      capacity_unit: kiln.capacity_unit || 'kg',
      location_id: kiln.location_id || '',
      coordinator_id: kiln.coordinator_id || '',
      status: kiln.status,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (kiln: Kiln) => {
    setSelectedKiln(kiln);
    setIsDeleteDialogOpen(true);
  };

  const filteredKilns = kilns.filter(kiln =>
    (kiln.type && kiln.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    kiln.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (kiln.location?.name && kiln.location.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (kiln.coordinator?.name && kiln.coordinator.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kiln Master</h1>
          <p className="text-muted-foreground">
            Manage all kilns used in biochar production
          </p>
        </div>
        <Button onClick={() => {
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add Kiln
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search kilns..."
          className="max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kilns</CardTitle>
          <CardDescription>
            A list of all kilns registered in the system
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
                      No kilns found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKilns.map((kiln) => (
                    <TableRow key={kiln.id}>
                      <TableCell className="font-mono text-xs">{kiln.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Flame className="mr-2 h-4 w-4 text-orange-500" />
                          {kiln.type || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {kiln.capacity ? `${kiln.capacity} ${kiln.capacity_unit || 'units'}` : '-'}
                      </TableCell>
                      <TableCell>{kiln.location?.name || '-'}</TableCell>
                      <TableCell>{kiln.coordinator?.name || '-'}</TableCell>
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedKiln ? 'Edit Kiln' : 'Add New Kiln'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
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
                <Label htmlFor="capacity" className="text-right">
                  Capacity
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    step="0.01"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="flex-1"
                  />
                  <Select 
                    value={formData.capacity_unit} 
                    onValueChange={(value) => handleSelectChange('capacity_unit', value)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="ton">ton</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location_id" className="text-right">
                  Location
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
                  Coordinator
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedKiln ? 'Update' : 'Add'} Kiln
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
          <p>Are you sure you want to delete this kiln? This action cannot be undone.</p>
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

export default Kilns;
