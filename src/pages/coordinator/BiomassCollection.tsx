
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmers } from "@/hooks/useFarmers";
import { useBiomassTypes } from "@/hooks/useBiomassTypes";
import { EmptyState } from "@/components/fertilizer/EmptyState";
import { CollectionDialog } from "@/components/biomass/CollectionDialog";

const BiomassCollection = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { userProfile } = useAuth();
  const coordinatorId = userProfile?.coordinator_id;
  
  const { farmers, isLoading: farmersLoading } = useFarmers(coordinatorId);
  const { biomassTypes, isLoading: typesLoading } = useBiomassTypes();

  const isLoading = farmersLoading || typesLoading;

  const openCollectionDialog = () => {
    setIsDialogOpen(true);
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
          <CardTitle>Biomass Collection</CardTitle>
          <Button onClick={openCollectionDialog}>
            <Leaf className="mr-2 h-4 w-4" /> Record Collection
          </Button>
        </CardHeader>
        <CardContent>
          {farmers.length === 0 ? (
            <EmptyState 
              message="No farmers assigned to you" 
              submessage="Please contact an administrator to assign farmers to your account"
            />
          ) : (
            <p className="text-muted-foreground">
              Click the "Record Collection" button to record a new biomass collection.
            </p>
          )}
        </CardContent>
      </Card>

      <CollectionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        farmers={farmers}
        biomassTypes={biomassTypes}
        coordinatorId={coordinatorId}
      />
    </div>
  );
};

export default BiomassCollection;
