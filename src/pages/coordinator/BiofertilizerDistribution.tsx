
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SproutIcon } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { useFarmers } from "@/hooks/useFarmers";
import { DistributionDialog } from "@/components/fertilizer/DistributionDialog";
import { EmptyState } from "@/components/fertilizer/EmptyState";

const BiofertilizerDistribution = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { userProfile } = useAuth();
  const coordinatorId = userProfile?.coordinator_id;
  
  const { farmers, isLoading, refetch } = useFarmers(coordinatorId);

  const openDistributionDialog = () => {
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
          <CardTitle>Biofertilizer Distribution</CardTitle>
          <Button onClick={openDistributionDialog}>
            <SproutIcon className="mr-2 h-4 w-4" /> Record Distribution
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
              Click the "Record Distribution" button to record a new biofertilizer distribution.
            </p>
          )}
        </CardContent>
      </Card>

      <DistributionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        farmers={farmers}
        coordinatorId={coordinatorId}
        onSuccess={refetch}
      />
    </div>
  );
};

export default BiofertilizerDistribution;
