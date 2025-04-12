
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { BiomassType } from "@/types/biomass";

export const useBiomassTypes = () => {
  const [biomassTypes, setBiomassTypes] = useState<BiomassType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBiomassTypes();
  }, []);

  const fetchBiomassTypes = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return {
    biomassTypes,
    isLoading,
    refetch: fetchBiomassTypes
  };
};
