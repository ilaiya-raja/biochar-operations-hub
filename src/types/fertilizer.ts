
export interface Farmer {
  id: string;
  name: string;
}

export interface FertilizerDistribution {
  id: string;
  farmer_id: string;
  coordinator_id: string;
  quantity: number;
  quantity_unit: string;
  photo_url: string | null;
  distribution_date: string;
}
