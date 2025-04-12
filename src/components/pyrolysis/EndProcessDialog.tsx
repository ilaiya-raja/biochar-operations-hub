
import React, { useState } from "react";
import { format } from "date-fns";
import { Camera, CalendarIcon, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/Spinner";
import { PyrolysisProcess } from "@/types/pyrolysis";

interface EndProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeProcess: PyrolysisProcess | null;
  coordinatorId: string | undefined;
  onSuccess: () => void;
}

export const EndProcessDialog: React.FC<EndProcessDialogProps> = ({
  open,
  onOpenChange,
  activeProcess,
  coordinatorId,
  onSuccess,
}) => {
  const [outputQuantity, setOutputQuantity] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeProcess || !outputQuantity || !photo) {
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
      const fileName = `pyrolysis/${coordinatorId}/${timestamp}_${photo.name}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("biochar-photos")
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      // 2. Update the pyrolysis process
      const photoUrl = uploadData?.path;
      
      const { error: updateError } = await supabase
        .from("pyrolysis_processes")
        .update({
          end_time: new Date().toISOString(),
          output_quantity: parseFloat(outputQuantity),
          photo_url: photoUrl,
          status: 'completed'
        })
        .eq("id", activeProcess.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Pyrolysis process completed successfully",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setOutputQuantity("");
      setPhoto(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error("Error completing pyrolysis process:", error);
      toast({
        title: "Error",
        description: "Failed to complete pyrolysis process",
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
          <DialogTitle>Complete Pyrolysis Process</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
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
              <Label htmlFor="outputQuantity">Output Quantity (kg)</Label>
              <Input
                id="outputQuantity"
                type="number"
                step="0.01"
                min="0"
                value={outputQuantity}
                onChange={(e) => setOutputQuantity(e.target.value)}
                placeholder="Enter output weight in kg"
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
              Complete Process
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
