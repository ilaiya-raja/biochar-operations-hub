import { useState, useEffect } from 'react';
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

 

import { Spinner } from '@/components/Spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';

interface BiomassType {
  id: string;
  uuid: string;
  name: string;
  description: string;
  code: string;
  created_at: string;  // Changed from 'at' to 'created_at'
  updated_at: string;
}

// Add these imports at the top
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Update the component to include new state variables
const BiomassTypes = () => {
  const [loading, setLoading] = useState(true);
  const [biomassTypes, setBiomassTypes] = useState<BiomassType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBiomassType, setSelectedBiomassType] = useState<BiomassType | null>(null);
  
  // Update the formData state to include all fields
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: ''
  });
  
  // Update the handleSubmit function
  // Add these new functions
  const handleDelete = async () => {
    if (!selectedBiomassType) return;

    try {
      // First, check if there are any related biomass collections
      const { data: collections, error: checkError } = await supabase
        .from('biomass_collections')
        .select('id')
        .eq('biomass_type_id', selectedBiomassType.id);

      if (checkError) throw checkError;

      if (collections && collections.length > 0) {
        toast.error('Cannot delete: This biomass type is being used in biomass collections');
        setIsDeleteDialogOpen(false);
        return;
      }

      // If no collections found, proceed with deletion
      const { error } = await supabase
        .from('biomass_types')
        .delete()
        .eq('id', selectedBiomassType.id);

      if (error) throw error;
      toast.success('Biomass type deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchBiomassTypes();
    } catch (error: any) {
      toast.error(`Failed to delete biomass type: ${error.message}`);
      console.error('Error:', error);
    }
  };

  const openEditDialog = (biomassType: BiomassType) => {
    setSelectedBiomassType(biomassType);
    setFormData({
      name: biomassType.name,
      description: biomassType.description,
      code: biomassType.code
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (biomassType: BiomassType) => {
    setSelectedBiomassType(biomassType);
    setIsDeleteDialogOpen(true);
  };

  // Update handleSubmit to handle both create and update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedBiomassType) {
        // Update existing biomass type
        const { error } = await supabase
          .from('biomass_types')
          .update({
            name: formData.name,
            description: formData.description,
            code: formData.code
          })
          .eq('id', selectedBiomassType.id);

        if (error) throw error;
        toast.success('Biomass type updated successfully');
      } else {
        // Create new biomass type
        const { error } = await supabase
          .from('biomass_types')
          .insert({
            name: formData.name,
            description: formData.description,
            code: formData.code
          });

        if (error) throw error;
        toast.success('Biomass type added successfully');
      }

      setFormData({ name: '', description: '', code: '' });
      setIsDialogOpen(false);
      setSelectedBiomassType(null);
      fetchBiomassTypes();
    } catch (error: any) {
      toast.error(`Failed to ${selectedBiomassType ? 'update' : 'add'} biomass type: ${error.message}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBiomassTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('biomass_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setBiomassTypes(data || []);
    } catch (error) {
      console.error('Error fetching biomass types:', error);
      toast.error('Failed to load biomass types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBiomassTypes();
  }, []);

  const filteredBiomassTypes = biomassTypes.filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biomass Types</h1>
          <p className="text-muted-foreground">
            Manage all biomass types used in biochar production
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Biomass Type
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search biomass types..."
          className="max-w-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Biomass Types</CardTitle>
          <CardDescription>
            A list of all biomass types registered in the system
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
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBiomassTypes.map((type) => (
                  // Update the table row display
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.code}</TableCell>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>{type.description}</TableCell>
                    <TableCell>{new Date(type.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(type.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEditDialog(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openDeleteDialog(type)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredBiomassTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      No biomass types found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Biomass Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">Code</label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Add Biomass Type
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this biomass type? This action cannot be undone.</p>
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

export default BiomassTypes;