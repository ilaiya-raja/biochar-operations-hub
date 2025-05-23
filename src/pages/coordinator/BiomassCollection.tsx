import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
 
const BiomassCollection = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [farmers, setFarmers] = useState([]);
  const [biomassTypes, setBiomassTypes] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    farmerId: '',
    biomassTypeId: '',
    quantity: '',
    quantityUnit: 'kg',
    collectionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });
  
  // Add debugging state
  const [fetchError, setFetchError] = useState(null);
 
  // Update the collection date whenever dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      setFormData(current => ({
        ...current,
        collectionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
      }));
    }
  }, [isDialogOpen]);
 
  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('biomass_collections')
        .select(`
          *,
          farmer:farmer_id(name),
          biomass_type:biomass_type_id(name)
        `)
        .eq('coordinator_id', userProfile?.id)
        .order('collection_date', { ascending: false });
 
      if (error) throw error;
      setCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
      toast.error('Failed to load collections');
    }
  };
 
  useEffect(() => {
    const fetchData = async () => {
      setFetchingData(true);
      setFetchError(null);
      
      try {
        console.log('Starting data fetch...');
        
        // Fetch biomass types from database
        console.log('Fetching biomass types...');
        const { data: biomassTypesData, error: biomassTypesError } = await supabase
          .from('biomass_types')
          .select('id, name')
          .order('name');
 
        if (biomassTypesError) {
          console.error('Biomass types error:', biomassTypesError);
          setFetchError(biomassTypesError.message);
          throw biomassTypesError;
        }
        
        console.log('Biomass types fetched:', biomassTypesData);
        setBiomassTypes(biomassTypesData || []);
        
        // Only fetch farmers if userProfile is available
        if (userProfile?.location_id) {
          console.log('Fetching farmers for location:', userProfile.location_id);
          // Fetch farmers based on coordinator's location
          const { data: farmersData, error: farmersError } = await supabase
            .from('farmers')
            .select('id, name')
            .eq('location_id', userProfile.location_id)
            .order('name');
 
          if (farmersError) {
            console.error('Farmers error:', farmersError);
            setFetchError(farmersError.message);
            throw farmersError;
          }
          
          console.log('Farmers fetched:', farmersData);
          setFarmers(farmersData || []);
        }
 
        // Fetch collections
        await fetchCollections();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(`Failed to load form data: ${error.message}`);
      } finally {
        setFetchingData(false);
      }
    };
 
    fetchData();
  }, [userProfile?.location_id, userProfile?.id]);
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
 
    if (!userProfile?.id) {
      toast.error('Coordinator ID not found');
      setLoading(false);
      return;
    }
 
    try {
      // Start a Supabase transaction
      const { data: collectionData, error: collectionError } = await supabase.from('biomass_collections').insert({
        farmer_id: formData.farmerId,
        biomass_type_id: formData.biomassTypeId,
        coordinator_id: userProfile.id,
        quantity: parseFloat(formData.quantity),
        quantity_unit: formData.quantityUnit,
        collection_date: formData.collectionDate
      }).select().single();
 
      if (collectionError) {
        throw collectionError;
      }
 
      // First, try to get the existing inventory record
      const { data: existingInventory, error: fetchError } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('biomass_type_id', formData.biomassTypeId)
        .single();
 
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw fetchError;
      }
 
      if (existingInventory) {
        // Update existing inventory record
        const { error: updateError } = await supabase
          .from('inventory')
          .update({
            quantity: existingInventory.quantity + parseFloat(formData.quantity),
            created_at: new Date().toISOString(),
            farmer_id: formData.farmerId,
            biomass_collection_id: collectionData.id,
            coordinator_id: userProfile.id
          })
          .eq('biomass_type_id', formData.biomassTypeId);
 
        if (updateError) {
          throw updateError;
        }
      } else {
        // Insert new inventory record if it doesn't exist
        const { error: insertError } = await supabase
          .from('inventory')
          .insert({
            biomass_type_id: formData.biomassTypeId,
            quantity: parseFloat(formData.quantity),
            quantity_unit: formData.quantityUnit,
            created_at: new Date().toISOString(),
            farmer_id: formData.farmerId,
            biomass_collection_id: collectionData.id,
            coordinator_id: userProfile.id
          });
 
        if (insertError) {
          throw insertError;
        }
      }
 
      console.log('Recorded biomass collection:', collectionData);
      toast.success('Biomass collection and inventory recorded successfully');
      
      setFormData({
        farmerId: '',
        biomassTypeId: '',
        quantity: '',
        quantityUnit: 'kg',
        collectionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
      });
      setIsDialogOpen(false);
      fetchCollections(); // Refresh the collections list
    } catch (error) {
      toast.error(`Failed to record biomass collection: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
 
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Biomass Collections</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Collection
        </Button>
      </div>
      
      {fetchError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error loading data: {fetchError}</p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchingData ? (
            <div className="text-center py-4">Loading data...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Farmer</TableHead>
                  <TableHead>Biomass Type</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell>
                      {format(new Date(collection.collection_date), 'PP p')}
                    </TableCell>
                    <TableCell>{collection.farmer?.name}</TableCell>
                    <TableCell>{collection.biomass_type?.name}</TableCell>
                    <TableCell>{collection.quantity} {collection.quantity_unit}</TableCell>
                  </TableRow>
                ))}
                {collections.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No collections recorded yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
 
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Record Biomass Collection</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="farmerId" className="text-sm font-medium">Farmer</label>
                <select
                  id="farmerId"
                  value={formData.farmerId}
                  onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Farmer</option>
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  {farmers.length === 0 && 'No farmers available for your location'}
                </p>
              </div>
 
              <div className="space-y-2">
                <label htmlFor="biomassTypeId" className="text-sm font-medium">Biomass Type</label>
                <select
                  id="biomassTypeId"
                  value={formData.biomassTypeId}
                  onChange={(e) => setFormData({ ...formData, biomassTypeId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select Biomass Type</option>
                  {biomassTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  {biomassTypes.length === 0 && 'No biomass types available'}
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  id="quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
 
              <div className="space-y-2">
                <label htmlFor="quantityUnit" className="text-sm font-medium">Quantity Unit</label>
                <select
                  id="quantityUnit"
                  value={formData.quantityUnit}
                  onChange={(e) => setFormData({ ...formData, quantityUnit: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="ton">Tons</option>
                </select>
              </div>
 
              <div className="space-y-2">
                <label htmlFor="collectionDate" className="text-sm font-medium">Collection Date</label>
                <input
                  type="datetime-local"
                  id="collectionDate"
                  value={formData.collectionDate}
                  onChange={(e) => setFormData({ ...formData, collectionDate: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
            </div>
 
            <Button type="submit" disabled={loading} className="w-full mt-6">
              {loading ? 'Recording...' : 'Record Collection'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
 
export default BiomassCollection;