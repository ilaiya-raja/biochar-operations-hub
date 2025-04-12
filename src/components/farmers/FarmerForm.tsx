
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DialogFooter,
} from '@/components/ui/dialog';
import { FarmerFormData, FarmerFormErrors, Location, Coordinator } from '@/types/farmer';

interface FarmerFormProps {
  formData: FarmerFormData;
  formErrors: FarmerFormErrors;
  locations: Location[];
  coordinators: Coordinator[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export const FarmerForm: React.FC<FarmerFormProps> = ({
  formData,
  formErrors,
  locations,
  coordinators,
  onInputChange,
  onSelectChange,
  onSubmit,
  onCancel,
  isEditing
}) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name *
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            className={`col-span-3 ${formErrors.name ? 'border-red-500' : ''}`}
          />
          {formErrors.name && (
            <div className="col-span-3 col-start-2 text-xs text-red-500">
              Name is required
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="phone" className="text-right">
            Phone *
          </Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onInputChange}
            className={`col-span-3 ${formErrors.phone ? 'border-red-500' : ''}`}
          />
          {formErrors.phone && (
            <div className="col-span-3 col-start-2 text-xs text-red-500">
              Phone is required
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onInputChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="address" className="text-right">
            Address
          </Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={onInputChange}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="location_id" className="text-right">
            Location *
          </Label>
          <Select
            value={formData.location_id}
            onValueChange={(value) => onSelectChange('location_id', value)}
          >
            <SelectTrigger
              id="location_id"
              className={`col-span-3 ${formErrors.location_id ? 'border-red-500' : ''}`}
            >
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.location_id && (
            <div className="col-span-3 col-start-2 text-xs text-red-500">
              Location is required
            </div>
          )}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="coordinator_id" className="text-right">
            Coordinator *
          </Label>
          <Select
            value={formData.coordinator_id}
            onValueChange={(value) => onSelectChange('coordinator_id', value)}
          >
            <SelectTrigger
              id="coordinator_id"
              className={`col-span-3 ${formErrors.coordinator_id ? 'border-red-500' : ''}`}
            >
              <SelectValue placeholder="Select coordinator" />
            </SelectTrigger>
            <SelectContent>
              {coordinators.map((coordinator) => (
                <SelectItem key={coordinator.id} value={coordinator.id}>
                  {coordinator.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.coordinator_id && (
            <div className="col-span-3 col-start-2 text-xs text-red-500">
              Coordinator is required
            </div>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update' : 'Add'} Farmer
        </Button>
      </DialogFooter>
    </form>
  );
};
