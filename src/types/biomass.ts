
export interface Farmer {
  id: string;
  name: string;
}

export interface BiomassType {
  id: string;
  name: string;
}

export interface BiomassCollection {
  id: string;
  farmer_id: string;
  biomass_type_id: string;
  coordinator_id: string;
  quantity: number;
  quantity_unit: string;
  photo_url: string | null;
  collection_date: string;
}
