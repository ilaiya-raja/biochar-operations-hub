
import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Location, Coordinator } from '@/services/supabase-service';

interface KilnFormData {
  name: string;
  type: string;
  capacity: string;
  capacity_unit: string;
  location_id: string;
  coordinator_id: string;
  status: string;
}

interface KilnFormProps {
  formData: KilnFormData;
  locations: Location[];
  coordinators: Coordinator[];
  userRole: string | null;
  coordinatorProfile: Coordinator | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  isEditing: boolean;
}

const KilnForm = ({
  formData,
  locations,
  coordinators,
  userRole,
  coordinatorProfile,
  onSubmit,
  onCancel,
  onInputChange,
  onSelectChange,
  isEditing
}: KilnFormProps) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="type" className="text-right">Type</Label>
          <Input
            id="type"
            name="type"
            value={formData.type}
            onChange={onInputChange}
            className="col-span-3"
            required
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="capacity" className="text-right">Capacity</Label>
          <div className="col-span-3 flex gap-2">
            <Input
              id="capacity"
              name="capacity"
              type="number"
              step="0.01"
              value={formData.capacity}
              onChange={onInputChange}
              className="flex-1"
            />
            <Select 
              value={formData.capacity_unit} 
              onValueChange={(value) => onSelectChange('capacity_unit', value)}
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
          <Label htmlFor="location_id" className="text-right">Location</Label>
          {userRole === 'coordinator' && coordinatorProfile ? (
            <div className="col-span-3">
              <Input
                value={locations.find(l => l.id === coordinatorProfile.location_id)?.name || 'Not assigned'}
                disabled
                className="bg-gray-100"
              />
            </div>
          ) : (
            <Select 
              value={formData.location_id} 
              onValueChange={(value) => onSelectChange('location_id', value)}
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
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="coordinator_id" className="text-right">Coordinator</Label>
          {userRole === 'coordinator' && coordinatorProfile ? (
            <div className="col-span-3">
              <Input
                value={coordinatorProfile.name || 'Not assigned'}
                disabled
                className="bg-gray-100"
              />
            </div>
          ) : (
            <Select 
              value={formData.coordinator_id} 
              onValueChange={(value) => onSelectChange('coordinator_id', value)}
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
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status" className="text-right">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => onSelectChange('status', value)}
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
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update' : 'Add'} Kiln
        </Button>
      </div>
    </form>
  );
};

export default KilnForm;
