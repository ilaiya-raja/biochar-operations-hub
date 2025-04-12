
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FarmerForm } from './FarmerForm';
import { FarmerFormData, FarmerFormErrors, Location, Coordinator } from '@/types/farmer';

interface FarmerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FarmerFormData;
  formErrors: FarmerFormErrors;
  locations: Location[];
  coordinators: Coordinator[];
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
}

export const FarmerDialog: React.FC<FarmerDialogProps> = ({
  open,
  onOpenChange,
  formData,
  formErrors,
  locations,
  coordinators,
  onInputChange,
  onSelectChange,
  onSubmit,
  isEditing
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Farmer' : 'Add New Farmer'}
          </DialogTitle>
        </DialogHeader>
        <FarmerForm
          formData={formData}
          formErrors={formErrors}
          locations={locations}
          coordinators={coordinators}
          onInputChange={onInputChange}
          onSelectChange={onSelectChange}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  );
};
