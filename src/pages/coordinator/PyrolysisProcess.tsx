
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Play, Square } from "lucide-react";
import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/contexts/AuthContext";
import { StartProcessDialog } from "@/components/pyrolysis/StartProcessDialog";
import { EndProcessDialog } from "@/components/pyrolysis/EndProcessDialog";
import { ActiveProcess } from "@/components/pyrolysis/ActiveProcess";
import { RecentProcesses } from "@/components/pyrolysis/RecentProcesses";
import { usePyrolysisProcess } from "@/hooks/usePyrolysisProcess";

const PyrolysisProcess = () => {
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const coordinatorId = userProfile?.coordinator_id;
  
  const {
    kilns,
    biomassTypes,
    processes,
    activeProcess,
    isLoading,
    refetch
  } = usePyrolysisProcess(coordinatorId);

  const openStartDialog = () => {
    setIsStartDialogOpen(true);
  };

  const openEndDialog = () => {
    setIsEndDialogOpen(true);
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
            <ActiveProcess process={activeProcess} />
          ) : (
            <p className="text-muted-foreground">
              No active pyrolysis process. Click the "Start Process" button to begin.
            </p>
          )}
        </CardContent>
      </Card>

      <RecentProcesses processes={processes} />

      <StartProcessDialog
        open={isStartDialogOpen}
        onOpenChange={setIsStartDialogOpen}
        kilns={kilns}
        biomassTypes={biomassTypes}
        coordinatorId={coordinatorId}
        onSuccess={refetch}
      />

      <EndProcessDialog
        open={isEndDialogOpen}
        onOpenChange={setIsEndDialogOpen}
        activeProcess={activeProcess}
        coordinatorId={coordinatorId}
        onSuccess={refetch}
      />
    </div>
  );
};

export default PyrolysisProcess;
