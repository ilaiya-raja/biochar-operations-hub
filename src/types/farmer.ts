
export interface Farmer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  location_id: string;
  coordinator_id: string;
  location?: Location;
  coordinator?: Coordinator;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
}

export interface Coordinator {
  id: string;
  name: string;
}

export interface FarmerFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  location_id: string;
  coordinator_id: string;
}

export interface FarmerFormErrors {
  name: boolean;
  phone: boolean;
  location_id: boolean;
  coordinator_id: boolean;
}
