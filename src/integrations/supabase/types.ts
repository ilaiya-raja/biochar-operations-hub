export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          coordinator_id: string
          created_at: string
          date_performed: string
          description: string | null
          id: string
          kiln_id: string | null
          location_id: string | null
          quantity: number | null
          quantity_unit: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          activity_type: string
          coordinator_id: string
          created_at?: string
          date_performed: string
          description?: string | null
          id?: string
          kiln_id?: string | null
          location_id?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          activity_type?: string
          coordinator_id?: string
          created_at?: string
          date_performed?: string
          description?: string | null
          id?: string
          kiln_id?: string | null
          location_id?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_kiln_id_fkey"
            columns: ["kiln_id"]
            isOneToOne: false
            referencedRelation: "kilns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_data: {
        Row: {
          coordinator_id: string | null
          created_at: string
          date_recorded: string
          id: string
          kiln_id: string | null
          location_id: string | null
          metric_name: string
          metric_value: number
        }
        Insert: {
          coordinator_id?: string | null
          created_at?: string
          date_recorded: string
          id?: string
          kiln_id?: string | null
          location_id?: string | null
          metric_name: string
          metric_value: number
        }
        Update: {
          coordinator_id?: string | null
          created_at?: string
          date_recorded?: string
          id?: string
          kiln_id?: string | null
          location_id?: string | null
          metric_name?: string
          metric_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "analytics_data_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_data_kiln_id_fkey"
            columns: ["kiln_id"]
            isOneToOne: false
            referencedRelation: "kilns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_data_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      biomass_collections: {
        Row: {
          biomass_type_id: string
          collection_date: string
          coordinator_id: string
          created_at: string
          farmer_id: string
          id: string
          photo_url: string | null
          quantity: number
          quantity_unit: string
          updated_at: string
        }
        Insert: {
          biomass_type_id: string
          collection_date?: string
          coordinator_id: string
          created_at?: string
          farmer_id: string
          id?: string
          photo_url?: string | null
          quantity: number
          quantity_unit: string
          updated_at?: string
        }
        Update: {
          biomass_type_id?: string
          collection_date?: string
          coordinator_id?: string
          created_at?: string
          farmer_id?: string
          id?: string
          photo_url?: string | null
          quantity?: number
          quantity_unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "biomass_collections_biomass_type_id_fkey"
            columns: ["biomass_type_id"]
            isOneToOne: false
            referencedRelation: "biomass_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomass_collections_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "biomass_collections_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      biomass_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      coordinators: {
        Row: {
          created_at: string
          email: string | null
          id: string
          location_id: string | null
          name: string
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          location_id?: string | null
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          location_id?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coordinators_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      farmers: {
        Row: {
          address: string | null
          coordinator_id: string
          created_at: string
          email: string | null
          id: string
          location_id: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          coordinator_id: string
          created_at?: string
          email?: string | null
          id?: string
          location_id: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          coordinator_id?: string
          created_at?: string
          email?: string | null
          id?: string
          location_id?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "farmers_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farmers_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      fertilizer_distributions: {
        Row: {
          coordinator_id: string
          created_at: string
          distribution_date: string
          farmer_id: string
          id: string
          photo_url: string | null
          quantity: number
          quantity_unit: string
          updated_at: string
        }
        Insert: {
          coordinator_id: string
          created_at?: string
          distribution_date?: string
          farmer_id: string
          id?: string
          photo_url?: string | null
          quantity: number
          quantity_unit: string
          updated_at?: string
        }
        Update: {
          coordinator_id?: string
          created_at?: string
          distribution_date?: string
          farmer_id?: string
          id?: string
          photo_url?: string | null
          quantity?: number
          quantity_unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fertilizer_distributions_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fertilizer_distributions_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      kilns: {
        Row: {
          capacity: number | null
          capacity_unit: string | null
          coordinator_id: string | null
          created_at: string
          id: string
          location_id: string | null
          name: string
          status: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          capacity_unit?: string | null
          coordinator_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          name: string
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          capacity_unit?: string | null
          coordinator_id?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          name?: string
          status?: string | null
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kilns_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kilns_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          coordinates: unknown | null
          country: string | null
          created_at: string
          district: string | null
          id: string
          name: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          coordinates?: unknown | null
          country?: string | null
          created_at?: string
          district?: string | null
          id?: string
          name: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          coordinates?: unknown | null
          country?: string | null
          created_at?: string
          district?: string | null
          id?: string
          name?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pyrolysis_processes: {
        Row: {
          biomass_type_id: string
          coordinator_id: string
          created_at: string
          end_time: string | null
          id: string
          input_quantity: number
          kiln_id: string
          output_quantity: number | null
          photo_url: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          biomass_type_id: string
          coordinator_id: string
          created_at?: string
          end_time?: string | null
          id?: string
          input_quantity: number
          kiln_id: string
          output_quantity?: number | null
          photo_url?: string | null
          start_time?: string
          status: string
          updated_at?: string
        }
        Update: {
          biomass_type_id?: string
          coordinator_id?: string
          created_at?: string
          end_time?: string | null
          id?: string
          input_quantity?: number
          kiln_id?: string
          output_quantity?: number | null
          photo_url?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pyrolysis_processes_biomass_type_id_fkey"
            columns: ["biomass_type_id"]
            isOneToOne: false
            referencedRelation: "biomass_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pyrolysis_processes_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "coordinators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pyrolysis_processes_kiln_id_fkey"
            columns: ["kiln_id"]
            isOneToOne: false
            referencedRelation: "kilns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
