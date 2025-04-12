
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Farmer } from "@/types/fertilizer";

export const useFarmers = (coordinatorId: string | undefined) => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (coordinatorId) {
      fetchFarmers();
    }
  }, [coordinatorId]);

  const fetchFarmers = async () => {
    if (!coordinatorId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("farmers")
        .select("id, name")
        .eq("coordinator_id", coordinatorId)
        .order("name");

      if (error) throw error;
      setFarmers(data || []);
    } catch (error) {
      console.error("Error fetching farmers:", error);
      toast({
        title: "Error",
        description: "Failed to load farmers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    farmers,
    isLoading,
    refetch: fetchFarmers
  };
};
