import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Camera, CalendarIcon, Clock, FlameIcon, Play, Square, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/contexts/AuthContext";

interface Kiln {
  id: string;
  type: string;
}

interface BiomassType {
  id: string;
  name: string;
}

interface PyrolysisProcess {
  id: string;
  kiln_id: string;
  kiln_type: string;
  biomass_type_id: string;
  biomass_type_name: string;
  start_time: string;
  end_time: string | null;
  input_quantity: number;
  output_quantity: number | null;
  status: 'in-progress' | 'completed';
  photo_url: string | null;
}

const PyrolysisProcess = () => {
  const [kilns, setKilns] = useState<Kiln[]>([]);
  const [biomassTypes, setBiomassTypes] = useState<BiomassType[]>([]);
  const [processes, setProcesses] = useState<PyrolysisProcess[]>([]);
  const [activeProcess, setActiveProcess] = useState<PyrolysisProcess | null>(null);
  
  const [selectedKilnId, setSelectedKilnId] = useState("");
  const [selectedBiomassTypeId, setSelectedBiomassTypeId] = useState("");
  const [inputQuantity, setInputQuantity] = useState("");
  const [outputQuantity, setOutputQuantity] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const coordinatorId = userProfile?.coordinator_id;

  useEffect(() => {
    if (coordinatorId) {
      fetchKilns();
      fetchBiomassTypes();
      fetchActiveProcess();
    }
  }, [coordinatorId]);

  const fetchKilns = async () => {
    if (!coordinatorId) return;
    
    try {
      const { data, error } = await supabase
        .from("kilns")
        .select("id, type")
        .eq("coordinator_id", coordinatorId)
        .order("id");

      if (error) throw error;
      setKilns(data || []);
    } catch (error) {
      console.error("Error fetching kilns:", error);
      toast({
        title: "Error",
        description: "Failed to load kilns",
        variant: "destructive",
      });
    }
  };

  const fetchBiomassTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("biomass_types")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setBiomassTypes(data || []);
    } catch (error) {
      console.error("Error fetching biomass types:", error);
      toast({
        title: "Error",
        description: "Failed to load biomass types",
        variant: "destructive",
      });
    }
  };

  const fetchActiveProcess = async () => {
    if (!coordinatorId) return;
    
    try {
      // Fetch all processes
      const { data, error } = await supabase
        .from("pyrolysis_processes")
        .select(`
          id, 
          kiln_id,
          kilns(type),
          biomass_type_id,
          biomass_types(name),
          start_time,
          end_time,
          input_quantity,
          output_quantity,
          status,
          photo_url
        `)
        .eq("coordinator_id", coordinatorId)
        .order("start_time", { ascending: false });

      if (error) throw error;

      if (data) {
        const processedData: PyrolysisProcess[] = data.map(item => {
          // Extract the first item from arrays or use default values
          const kilnData = Array.isArray(item.kilns) ? item.kilns[0] : item.kilns;
          const biomassTypeData = Array.isArray(item.biomass_types) ? item.biomass_types[0] : item.biomass_types;
          
          return {
            id: item.id,
            kiln_id: item.kiln_id,
            kiln_type: kilnData?.type || "Unknown",
            biomass_type_id: item.biomass_type_id,
            biomass_type_name: biomassTypeData?.name || "Unknown",
            start_time: item.start_time,
            end_time: item.end_time,
            input_quantity: item.input_quantity,
            output_quantity: item.output_quantity,
            status: item.status,
            photo_url: item.photo_url
          };
        });

        setProcesses(processedData);
        
        // Check if there's an active process
        const active = processedData.find(p => p.status === 'in-progress');
        setActiveProcess(active || null);
      }
    } catch (error) {
      console.error("Error fetching pyrolysis processes:", error);
      toast({
        title: "Error",
        description: "Failed to load pyrolysis processes",
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

  const openStartDialog = () => {
    setSelectedKilnId("");
    setSelectedBiomassTypeId("");
    setInputQuantity("");
    setIsStartDialogOpen(true);
  };

  const openEndDialog = () => {
    setOutputQuantity("");
    setPhoto(null);
    setPhotoPreview(null);
    setIsEndDialogOpen(true);
  };

  const handleStartProcess = async (e: React.FormEvent) => {
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
      const { error, data } = await supabase
        .from("pyrolysis_processes")
        .insert({
          coordinator_id: coordinatorId,
          kiln_id: selectedKilnId,
          biomass_type_id: selectedBiomassTypeId,
          start_time: new Date().toISOString(),
          input_quantity: parseFloat(inputQuantity),
          status: 'in-progress'
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pyrolysis process started successfully",
      });

      setIsStartDialogOpen(false);
      fetchActiveProcess();
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

  const handleEndProcess = async (e: React.FormEvent) => {
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

      setIsEndDialogOpen(false);
      fetchActiveProcess();
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
          <CardTitle>Pyrolysis Process</CardTitle>
          {!activeProcess ? (
            <Button onClick={openStartDialog} disabled={kilns.length === 0}>
              <Play className="mr-2 h-4 w-4" /> Start Process
            </Button>
          ) : (
            <Button onClick={openEndDialog} variant="destructive">
              <Square className="mr-2 h-4 w-4" /> End Process
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {kilns.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">No kilns assigned to you</p>
              <p className="text-sm text-muted-foreground">
                Please contact an administrator to assign kilns to your account
              </p>
            </div>
          ) : activeProcess ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Active Process</h3>
              <div className="rounded-lg border p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Kiln</p>
                    <p>{activeProcess.kiln_type} (ID: {activeProcess.kiln_id.substring(0, 8)})</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Biomass Type</p>
                    <p>{activeProcess.biomass_type_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Start Time</p>
                    <p>{format(new Date(activeProcess.start_time), "PPP p")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Input Quantity</p>
                    <p>{activeProcess.input_quantity} kg</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No active pyrolysis process. Click the "Start Process" button to begin.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent processes section */}
      {processes.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processes.slice(0, 5).map((process) => (
                <div key={process.id} className="rounded-lg border p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Kiln</p>
                      <p>{process.kiln_type} (ID: {process.kiln_id.substring(0, 8)})</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Biomass Type</p>
                      <p>{process.biomass_type_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Start Time</p>
                      <p>{format(new Date(process.start_time), "PPP p")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className={process.status === 'completed' ? 'text-green-600' : 'text-orange-500'}>
                        {process.status === 'completed' ? 'Completed' : 'In Progress'}
                      </p>
                    </div>
                    {process.status === 'completed' && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">End Time</p>
                          <p>{format(new Date(process.end_time!), "PPP p")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Output Quantity</p>
                          <p>{process.output_quantity} kg</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Start Process Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Pyrolysis Process</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStartProcess}>
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
                onClick={() => setIsStartDialogOpen(false)}
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

      {/* End Process Dialog */}
      <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Pyrolysis Process</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEndProcess}>
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
                onClick={() => setIsEndDialogOpen(false)}
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
    </div>
  );
};

export default PyrolysisProcess;
