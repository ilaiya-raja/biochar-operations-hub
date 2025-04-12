
import { useState } from "react";
import { Camera, CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/Spinner";
import { Farmer, BiomassType } from "@/types/biomass";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmers: Farmer[];
  biomassTypes: BiomassType[];
  coordinatorId: string | undefined;
}

export const CollectionDialog = ({
  open,
  onOpenChange,
  farmers,
  biomassTypes,
  coordinatorId,
}: CollectionDialogProps) => {
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [selectedBiomassTypeId, setSelectedBiomassTypeId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhoto(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setSelectedFarmerId("");
    setSelectedBiomassTypeId("");
    setQuantity("");
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFarmerId || !selectedBiomassTypeId || !quantity || !photo || !coordinatorId) {
      toast({
        title: "Error",
        description: "Please fill in all fields and upload a photo",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 1. Upload photo to storage
      const timestamp = Date.now();
      const fileName = `biomass_collections/${coordinatorId}/${timestamp}_${photo.name}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("biochar-photos")
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      // 2. Store the collection data in the database
      const photoUrl = uploadData?.path;
      
      const { error: insertError } = await supabase
        .from("biomass_collections")
        .insert({
          farmer_id: selectedFarmerId,
          biomass_type_id: selectedBiomassTypeId,
          coordinator_id: coordinatorId,
          quantity: parseFloat(quantity),
          quantity_unit: "kg",
          photo_url: photoUrl,
          collection_date: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Biomass collection recorded successfully",
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error saving biomass collection:", error);
      toast({
        title: "Error",
        description: "Failed to save biomass collection",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Biomass Collection</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="farmer">Farmer</Label>
              <Select
                value={selectedFarmerId}
                onValueChange={setSelectedFarmerId}
              >
                <SelectTrigger id="farmer">
                  <SelectValue placeholder="Select farmer" />
                </SelectTrigger>
                <SelectContent>
                  {farmers.map((farmer) => (
                    <SelectItem key={farmer.id} value={farmer.id}>
                      {farmer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="biomassType">Biomass Type</Label>
              <Select
                value={selectedBiomassTypeId}
                onValueChange={setSelectedBiomassTypeId}
              >
                <SelectTrigger id="biomassType">
                  <SelectValue placeholder="Select biomass type" />
                </SelectTrigger>
                <SelectContent>
                  {biomassTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date & Time</Label>
              <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(new Date(), "PPP")}
                <Clock className="ml-4 mr-2 h-4 w-4" />
                {format(new Date(), "p")}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (kg)</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter weight in kg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Photo</Label>
              <div className="flex flex-col items-center gap-4">
                <Label
                  htmlFor="photo-upload"
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-input hover:bg-muted/50"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-full w-full rounded-md object-cover"
                    />
                  ) : (
                    <>
                      <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload photo
                      </span>
                    </>
                  )}
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner size="sm" className="mr-2" />}
              Record Collection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
