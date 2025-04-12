
export interface Kiln {
  id: string;
  type: string;
}

export interface BiomassType {
  id: string;
  name: string;
}

export interface PyrolysisProcess {
  id: string;
  kiln_id: string;
  kiln_type: string;
  biomass_type_id: string;
  biomass_type_name: string;
  start_time: string;
  end_time: string | null;
  input_quantity: number;
  output_quantity: number | null;
  status: 'in-progress' | 'completed';
  photo_url: string | null;
}
