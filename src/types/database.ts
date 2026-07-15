export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      countries: {
        Row: {
          code: string
          currency: string
          name: string
        }
        Insert: {
          code: string
          currency: string
          name: string
        }
        Update: {
          code?: string
          currency?: string
          name?: string
        }
        Relationships: []
      }
      material_prices: {
        Row: {
          country_code: string
          currency: string
          id: string
          material_id: string
          price_minor: number
          region_id: string | null
          updated_at: string
        }
        Insert: {
          country_code: string
          currency: string
          id?: string
          material_id: string
          price_minor: number
          region_id?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          currency?: string
          id?: string
          material_id?: string
          price_minor?: number
          region_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_prices_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "material_prices_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "material_prices_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string
          created_at: string
          id: string
          lumber_moisture: string | null
          name: string
          sku_internal: string
          unit: string
          updated_at: string
          volume_m3: number
          weight_kg: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          lumber_moisture?: string | null
          name: string
          sku_internal: string
          unit: string
          updated_at?: string
          volume_m3?: number
          weight_kg?: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          lumber_moisture?: string | null
          name?: string
          sku_internal?: string
          unit?: string
          updated_at?: string
          volume_m3?: number
          weight_kg?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country_code: string
          created_at: string
          id: string
          name: string
          region_id: string | null
          role: string
          updated_at: string
        }
        Insert: {
          country_code?: string
          created_at?: string
          id: string
          name?: string
          region_id?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          name?: string
          region_id?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_region"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          country_code: string
          created_at: string
          id: string
          mt: number
          name: string
          snow_region: number
          updated_at: string
          wind_region: number
        }
        Insert: {
          country_code: string
          created_at?: string
          id?: string
          mt: number
          name: string
          snow_region: number
          updated_at?: string
          wind_region: number
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          mt?: number
          name?: string
          snow_region?: number
          updated_at?: string
          wind_region?: number
        }
        Relationships: [
          {
            foreignKeyName: "regions_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      retailer_skus: {
        Row: {
          id: string
          material_id: string
          product_url: string
          retailer_id: string
          sku: string
        }
        Insert: {
          id?: string
          material_id: string
          product_url?: string
          retailer_id: string
          sku: string
        }
        Update: {
          id?: string
          material_id?: string
          product_url?: string
          retailer_id?: string
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "retailer_skus_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retailer_skus_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      retailers: {
        Row: {
          country_code: string
          created_at: string
          id: string
          name: string
          updated_at: string
          website: string
        }
        Insert: {
          country_code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          website: string
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "retailers_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
