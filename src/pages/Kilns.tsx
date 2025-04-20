import { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/Spinner';
import {
  kilnService,
  locationService, 
  coordinatorService,
  Kiln,
  Location,
  Coordinator
} from '@/services/supabase-service';
import { useAuth } from '@/contexts/AuthContext';
import KilnForm from '@/components/kilns/KilnForm';
import KilnTable from '@/components/kilns/KilnTable';

const Kilns = () => {
  const { userRole, userProfile } = useAuth();
  const [kilns, setKilns] = useState<Kiln[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [coordinatorProfile, setCoordinatorProfile] = useState<Coordinator | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedKiln, setSelectedKiln] = useState<Kiln | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    capacity: string;
    capacity_unit: string;
    location_id: string;
    coordinator_id: string;
    status: string;
  }>({
    name: '',
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

      if (userRole === 'coordinator' && userProfile?.email) {
        const currentCoordinator = coordinatorsData?.find((c: Coordinator) => 
          c.email === userProfile.email
        );
        
        if (currentCoordinator) {
          setCoordinatorProfile(currentCoordinator);
          setFormData(prev => ({
            ...prev,
            coordinator_id: currentCoordinator.id,
            location_id: currentCoordinator.location_id || '',
          }));
        }
      }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (userRole === 'coordinator' && coordinatorProfile) {
      setFormData({
        name: '',
        type: '',
        capacity: '',
        capacity_unit: 'kg',
        location_id: coordinatorProfile.location_id || '',
        coordinator_id: coordinatorProfile.id,
        status: 'active',
      });
    } else {
      setFormData({
        name: '',
        type: '',
        capacity: '',
        capacity_unit: 'kg',
        location_id: '',
        coordinator_id: '',
        status: 'active',
      });
    }
    setSelectedKiln(null);
  };

  const openEditDialog = (kiln: Kiln) => {
    setSelectedKiln(kiln);
    setFormData({
      name: kiln.name,
      type: kiln.type || '',
      capacity: kiln.capacity ? kiln.capacity.toString() : '',
      capacity_unit: kiln.capacity_unit || 'kg',
      location_id: kiln.location_id || '',
      coordinator_id: kiln.coordinator_id || '',
      status: kiln.status,
    });
    setIsDialogOpen(true);
  };

  const filteredKilns = kilns.filter(kiln =>
    (kiln.type && kiln.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    kiln.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kiln.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            <KilnTable 
              kilns={filteredKilns}
              onEdit={openEditDialog}
              onDelete={(kiln) => {
                setSelectedKiln(kiln);
                setIsDeleteDialogOpen(true);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedKiln ? 'Edit Kiln' : 'Add New Kiln'}
            </DialogTitle>
          </DialogHeader>
          <KilnForm
            formData={formData}
            locations={locations}
            coordinators={coordinators}
            userRole={userRole}
            coordinatorProfile={coordinatorProfile}
            onSubmit={handleSubmit}
            onCancel={() => setIsDialogOpen(false)}
            onInputChange={handleInputChange}
            onSelectChange={handleSelectChange}
            isEditing={!!selectedKiln}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this kiln? This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Kilns;
