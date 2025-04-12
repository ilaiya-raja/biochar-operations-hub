
import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFarmersData } from '@/hooks/useFarmersData';
import { FarmersList } from '@/components/farmers/FarmersList';
import { FarmerDialog } from '@/components/farmers/FarmerDialog';
import { DeleteConfirmationDialog } from '@/components/farmers/DeleteConfirmationDialog';
import { Farmer, FarmerFormData, FarmerFormErrors } from '@/types/farmer';

const initialFormData: FarmerFormData = {
  name: '',
  phone: '',
  email: '',
  address: '',
  location_id: '',
  coordinator_id: '',
};

const initialFormErrors: FarmerFormErrors = {
  name: false,
  phone: false,
  location_id: false,
  coordinator_id: false,
};

const Farmers = () => {
  const { 
    farmers, 
    locations, 
    coordinators, 
    loading, 
    refreshFarmers,
    addFarmer,
    updateFarmer,
    deleteFarmer
  } = useFarmersData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [formData, setFormData] = useState<FarmerFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FarmerFormErrors>(initialFormErrors);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name as keyof FarmerFormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name as keyof FarmerFormErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const validateForm = () => {
    const errors = {
      name: !formData.name,
      phone: !formData.phone,
      location_id: !formData.location_id,
      coordinator_id: !formData.coordinator_id,
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    let success;
    if (selectedFarmer) {
      success = await updateFarmer(selectedFarmer.id, formData);
    } else {
      success = await addFarmer(formData);
    }

    if (success) {
      resetForm();
      setIsDialogOpen(false);
      refreshFarmers();
    }
  };

  const handleDelete = async () => {
    if (!selectedFarmer) return;

    const success = await deleteFarmer(selectedFarmer.id);
    if (success) {
      setIsDeleteDialogOpen(false);
      refreshFarmers();
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setFormErrors(initialFormErrors);
    setSelectedFarmer(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setFormData({
      name: farmer.name,
      phone: farmer.phone,
      email: farmer.email || '',
      address: farmer.address || '',
      location_id: farmer.location_id,
      coordinator_id: farmer.coordinator_id,
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Farmer Master</h1>
          <p className="text-muted-foreground">
            Manage all farmers who are part of the biochar program
          </p>
        </div>
        <Button onClick={openAddDialog}>
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
            A list of all farmers managed in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FarmersList
            farmers={farmers}
            loading={loading}
            searchQuery={searchQuery}
            onEdit={openEditDialog}
            onDelete={openDeleteDialog}
          />
        </CardContent>
      </Card>

      <FarmerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={formData}
        formErrors={formErrors}
        locations={locations}
        coordinators={coordinators}
        onInputChange={handleInputChange}
        onSelectChange={handleSelectChange}
        onSubmit={handleSubmit}
        isEditing={!!selectedFarmer}
      />

      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Farmers;
