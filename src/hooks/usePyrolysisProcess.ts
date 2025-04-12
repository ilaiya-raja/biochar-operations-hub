
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Kiln, BiomassType, PyrolysisProcess } from "@/types/pyrolysis";

export const usePyrolysisProcess = (coordinatorId: string | undefined) => {
  const [kilns, setKilns] = useState<Kiln[]>([]);
  const [biomassTypes, setBiomassTypes] = useState<BiomassType[]>([]);
  const [processes, setProcesses] = useState<PyrolysisProcess[]>([]);
  const [activeProcess, setActiveProcess] = useState<PyrolysisProcess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();

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

  const fetchProcesses = async () => {
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

  const fetchData = async () => {
    if (coordinatorId) {
      setIsLoading(true);
      await Promise.all([
        fetchKilns(),
        fetchBiomassTypes(),
        fetchProcesses()
      ]);
    }
  };

  useEffect(() => {
    if (coordinatorId) {
      fetchData();
    }
  }, [coordinatorId]);

  return {
    kilns,
    biomassTypes,
    processes,
    activeProcess,
    isLoading,
    refetch: fetchData
  };
};
