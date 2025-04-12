
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Spinner } from "@/components/Spinner";

interface BiomassType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const Biomass = () => {
  const [biomassTypes, setBiomassTypes] = useState<BiomassType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBiomass, setCurrentBiomass] = useState<BiomassType | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBiomassTypes();
  }, []);

  const fetchBiomassTypes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("biomass_types")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw error;
      }

      setBiomassTypes(data || []);
    } catch (error) {
      console.error("Error fetching biomass types:", error);
      toast({
        title: "Error",
        description: "Failed to fetch biomass types",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBiomassTypes = biomassTypes.filter((biomass) =>
    biomass.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openAddDialog = () => {
    setName("");
    setDescription("");
    setIsEditMode(false);
    setCurrentBiomass(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (biomass: BiomassType) => {
    setName(biomass.name);
    setDescription(biomass.description || "");
    setIsEditMode(true);
    setCurrentBiomass(biomass);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Biomass type name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (isEditMode && currentBiomass) {
        // Update existing biomass type
        const { error } = await supabase
          .from("biomass_types")
          .update({
            name: name.trim(),
            description: description.trim() || null,
          })
          .eq("id", currentBiomass.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Biomass type updated successfully",
        });
      } else {
        // Create new biomass type
        const { error } = await supabase
          .from("biomass_types")
          .insert({
            name: name.trim(),
            description: description.trim() || null,
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Biomass type added successfully",
        });
      }
      
      setIsDialogOpen(false);
      fetchBiomassTypes();
    } catch (error) {
      console.error("Error saving biomass type:", error);
      toast({
        title: "Error",
        description: isEditMode ? "Failed to update biomass type" : "Failed to add biomass type",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this biomass type?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("biomass_types")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Biomass type deleted successfully",
      });
      
      fetchBiomassTypes();
    } catch (error) {
      console.error("Error deleting biomass type:", error);
      toast({
        title: "Error",
        description: "Failed to delete biomass type",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Biomass Types</CardTitle>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Add Biomass Type
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search biomass types..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : filteredBiomassTypes.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <p className="text-muted-foreground">No biomass types found</p>
              <Button variant="link" onClick={openAddDialog}>
                Add your first biomass type
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Biomass ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBiomassTypes.map((biomass) => (
                  <TableRow key={biomass.id}>
                    <TableCell className="font-medium">{biomass.id.substring(0, 8)}</TableCell>
                    <TableCell>{biomass.name}</TableCell>
                    <TableCell>{biomass.description || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(biomass)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(biomass.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Biomass Type" : "Add Biomass Type"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter biomass type name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />
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
                {isEditMode ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Biomass;
