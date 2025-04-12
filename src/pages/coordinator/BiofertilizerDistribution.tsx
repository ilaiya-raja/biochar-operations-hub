
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, CalendarIcon, Clock, SproutIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/contexts/AuthContext";

interface Farmer {
  id: string;
  name: string;
}

const BiofertilizerDistribution = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const coordinatorId = userProfile?.coordinator_id;

  useEffect(() => {
    if (coordinatorId) {
      fetchFarmers();
    }
  }, [coordinatorId]);

  const fetchFarmers = async () => {
    if (!coordinatorId) return;
    
    try {
      const { data, error } = await supabase
        .from("farmers")
        .select("id, name")
        .eq("coordinator_id", coordinatorId)
        .order("name");

      if (error) throw error;
      setFarmers(data || []);
    } catch (error) {
      console.error("Error fetching farmers:", error);
      toast({
        title: "Error",
        description: "Failed to load farmers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const openDistributionDialog = () => {
    setSelectedFarmerId("");
    setQuantity("");
    setPhoto(null);
    setPhotoPreview(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFarmerId || !quantity || !photo || !coordinatorId) {
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
      const fileName = `fertilizer_distributions/${coordinatorId}/${timestamp}_${photo.name}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("biochar-photos")
        .upload(fileName, photo);

      if (uploadError) throw uploadError;

      // 2. Store the distribution data in the database
      const photoUrl = uploadData?.path;
      
      const { error: insertError } = await supabase
        .from("fertilizer_distributions")
        .insert({
          farmer_id: selectedFarmerId,
          coordinator_id: coordinatorId,
          quantity: parseFloat(quantity),
          quantity_unit: "kg",
          photo_url: photoUrl,
          distribution_date: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Biofertilizer distribution recorded successfully",
      });

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving biofertilizer distribution:", error);
      toast({
        title: "Error",
        description: "Failed to save biofertilizer distribution",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Biofertilizer Distribution</CardTitle>
          <Button onClick={openDistributionDialog}>
            <SproutIcon className="mr-2 h-4 w-4" /> Record Distribution
          </Button>
        </CardHeader>
        <CardContent>
          {farmers.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">No farmers assigned to you</p>
              <p className="text-sm text-muted-foreground">
                Please contact an administrator to assign farmers to your account
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Click the "Record Distribution" button to record a new biofertilizer distribution.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Biofertilizer Distribution</DialogTitle>
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
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner size="sm" className="mr-2" />}
                Record Distribution
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BiofertilizerDistribution;
