
import { format } from "date-fns";
import { PyrolysisProcess } from "@/types/pyrolysis";

interface ActiveProcessProps {
  process: PyrolysisProcess;
}

export const ActiveProcess: React.FC<ActiveProcessProps> = ({ process }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Active Process</h3>
      <div className="rounded-lg border p-4">
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
            <p className="text-sm text-muted-foreground">Input Quantity</p>
            <p>{process.input_quantity} kg</p>
          </div>
        </div>
      </div>
    </div>
  );
};
