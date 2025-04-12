
import React, { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/Spinner";
import { Kiln, BiomassType } from "@/types/pyrolysis";

interface StartProcessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kilns: Kiln[];
  biomassTypes: BiomassType[];
  coordinatorId: string | undefined;
  onSuccess: () => void;
}

export const StartProcessDialog: React.FC<StartProcessDialogProps> = ({
  open,
  onOpenChange,
  kilns,
  biomassTypes,
  coordinatorId,
  onSuccess,
}) => {
  const [selectedKilnId, setSelectedKilnId] = useState("");
  const [selectedBiomassTypeId, setSelectedBiomassTypeId] = useState("");
  const [inputQuantity, setInputQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedKilnId || !selectedBiomassTypeId || !inputQuantity || !coordinatorId) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Insert new pyrolysis process
      const { error } = await supabase
        .from("pyrolysis_processes")
        .insert({
          coordinator_id: coordinatorId,
          kiln_id: selectedKilnId,
          biomass_type_id: selectedBiomassTypeId,
          start_time: new Date().toISOString(),
          input_quantity: parseFloat(inputQuantity),
          status: 'in-progress'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pyrolysis process started successfully",
      });

      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setSelectedKilnId("");
      setSelectedBiomassTypeId("");
      setInputQuantity("");
    } catch (error) {
      console.error("Error starting pyrolysis process:", error);
      toast({
        title: "Error",
        description: "Failed to start pyrolysis process",
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
          <DialogTitle>Start Pyrolysis Process</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kiln">Kiln</Label>
              <Select
                value={selectedKilnId}
                onValueChange={setSelectedKilnId}
              >
                <SelectTrigger id="kiln">
                  <SelectValue placeholder="Select kiln" />
                </SelectTrigger>
                <SelectContent>
                  {kilns.map((kiln) => (
                    <SelectItem key={kiln.id} value={kiln.id}>
                      {kiln.type} (ID: {kiln.id.substring(0, 8)})
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
              <Label htmlFor="inputQuantity">Input Quantity (kg)</Label>
              <Input
                id="inputQuantity"
                type="number"
                step="0.01"
                min="0"
                value={inputQuantity}
                onChange={(e) => setInputQuantity(e.target.value)}
                placeholder="Enter input weight in kg"
              />
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
              Start Process
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
