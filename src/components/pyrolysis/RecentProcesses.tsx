
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PyrolysisProcess } from "@/types/pyrolysis";

interface RecentProcessesProps {
  processes: PyrolysisProcess[];
}

export const RecentProcesses: React.FC<RecentProcessesProps> = ({ processes }) => {
  if (processes.length === 0) {
    return null;
  }
  
  return (
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
  );
};
