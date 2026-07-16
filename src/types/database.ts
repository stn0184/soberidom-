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
      bom_items: {
        Row: {
          applies_when: Json
          id: string
          material_id: string
          project_id: string
          qty: number
          stage_id: string
        }
        Insert: {
          applies_when?: Json
          id?: string
          material_id: string
          project_id: string
          qty: number
          stage_id: string
        }
        Update: {
          applies_when?: Json
          id?: string
          material_id?: string
          project_id?: string
          qty?: number
          stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "house_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      config_options: {
        Row: {
          group_key: string
          id: string
          is_default: boolean
          label: string
          option_key: string
          project_id: string
          sort: number
        }
        Insert: {
          group_key: string
          id?: string
          is_default?: boolean
          label: string
          option_key: string
          project_id: string
          sort?: number
        }
        Update: {
          group_key?: string
          id?: string
          is_default?: boolean
          label?: string
          option_key?: string
          project_id?: string
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "config_options_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "house_projects"
            referencedColumns: ["id"]
          },
        ]
      }
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
      foundation_rules: {
        Row: {
          foundation: string
          high_water: string
          id: string
          reason_points: Json
          relief: string
          soil: string
          weight_class: string
        }
        Insert: {
          foundation: string
          high_water: string
          id?: string
          reason_points: Json
          relief: string
          soil: string
          weight_class: string
        }
        Update: {
          foundation?: string
          high_water?: string
          id?: string
          reason_points?: Json
          relief?: string
          soil?: string
          weight_class?: string
        }
        Relationships: []
      }
      house_projects: {
        Row: {
          area_m2: number
          building_type: string
          cover_image_url: string
          created_at: string
          currency: string
          description: string
          floors: number
          footprint: string
          gallery_urls: string[]
          heating_options: string[]
          id: string
          is_free: boolean
          isometric_fallback_url: string
          layout_notes: Json
          max_snow_region: number
          model_glb_url: string
          price_minor: number
          rooms: number
          slug: string
          sp_compliant: boolean
          status: string
          style: string
          title: string
          updated_at: string
        }
        Insert: {
          area_m2: number
          building_type: string
          cover_image_url?: string
          created_at?: string
          currency?: string
          description?: string
          floors: number
          footprint: string
          gallery_urls?: string[]
          heating_options?: string[]
          id?: string
          is_free?: boolean
          isometric_fallback_url?: string
          layout_notes?: Json
          max_snow_region?: number
          model_glb_url?: string
          price_minor: number
          rooms: number
          slug: string
          sp_compliant?: boolean
          status?: string
          style?: string
          title: string
          updated_at?: string
        }
        Update: {
          area_m2?: number
          building_type?: string
          cover_image_url?: string
          created_at?: string
          currency?: string
          description?: string
          floors?: number
          footprint?: string
          gallery_urls?: string[]
          heating_options?: string[]
          id?: string
          is_free?: boolean
          isometric_fallback_url?: string
          layout_notes?: Json
          max_snow_region?: number
          model_glb_url?: string
          price_minor?: number
          rooms?: number
          slug?: string
          sp_compliant?: boolean
          status?: string
          style?: string
          title?: string
          updated_at?: string
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
      parts: {
        Row: {
          applies_when: Json
          color: string
          cut_length_mm: number
          id: string
          material_id: string
          part_code: string
          project_id: string
          qty: number
        }
        Insert: {
          applies_when?: Json
          color: string
          cut_length_mm: number
          id?: string
          material_id: string
          part_code: string
          project_id: string
          qty: number
        }
        Update: {
          applies_when?: Json
          color?: string
          cut_length_mm?: number
          id?: string
          material_id?: string
          part_code?: string
          project_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "parts_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "house_projects"
            referencedColumns: ["id"]
          },
        ]
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
      project_tools: {
        Row: {
          alternative: string
          approx_price_minor: number
          approx_rent_day_minor: number | null
          category: string
          days_needed: number
          id: string
          name: string
          project_id: string
          reason: string
          recommendation: string
          sort: number
          stage_codes: string[]
        }
        Insert: {
          alternative?: string
          approx_price_minor: number
          approx_rent_day_minor?: number | null
          category: string
          days_needed: number
          id?: string
          name: string
          project_id: string
          reason: string
          recommendation: string
          sort?: number
          stage_codes?: string[]
        }
        Update: {
          alternative?: string
          approx_price_minor?: number
          approx_rent_day_minor?: number | null
          category?: string
          days_needed?: number
          id?: string
          name?: string
          project_id?: string
          reason?: string
          recommendation?: string
          sort?: number
          stage_codes?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "project_tools_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "house_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          expires_at: string | null
          project_id: string | null
          uses_left: number
        }
        Insert: {
          code: string
          expires_at?: string | null
          project_id?: string | null
          uses_left?: number
        }
        Update: {
          code?: string
          expires_at?: string | null
          project_id?: string | null
          uses_left?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "house_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          activated_at: string | null
          amount_minor: number
          code: string
          config: Json
          created_at: string
          currency: string
          id: string
          project_id: string
          provider: string
          region_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          amount_minor: number
          code: string
          config?: Json
          created_at?: string
          currency: string
          id?: string
          project_id: string
          provider?: string
          region_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          amount_minor?: number
          code?: string
          config?: Json
          created_at?: string
          currency?: string
          id?: string
          project_id?: string
          provider?: string
          region_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "house_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      stages: {
        Row: {
          applies_when: Json
          code: string
          color: string | null
          delivery_wave: number
          display_name: string
          id: string
          intro: string
          project_id: string
          sort: number
          title: string
        }
        Insert: {
          applies_when?: Json
          code: string
          color?: string | null
          delivery_wave?: number
          display_name?: string
          id?: string
          intro?: string
          project_id: string
          sort: number
          title: string
        }
        Update: {
          applies_when?: Json
          code?: string
          color?: string | null
          delivery_wave?: number
          display_name?: string
          id?: string
          intro?: string
          project_id?: string
          sort?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "house_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      step_materials: {
        Row: {
          id: string
          material_id: string
          qty: number
          step_id: string
        }
        Insert: {
          id?: string
          material_id: string
          qty: number
          step_id: string
        }
        Update: {
          id?: string
          material_id?: string
          qty?: number
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_materials_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      step_parts: {
        Row: {
          id: string
          part_id: string
          qty: number
          step_id: string
        }
        Insert: {
          id?: string
          part_id: string
          qty: number
          step_id: string
        }
        Update: {
          id?: string
          part_id?: string
          qty?: number
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "step_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "step_parts_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "steps"
            referencedColumns: ["id"]
          },
        ]
      }
      steps: {
        Row: {
          actions: Json
          applies_when: Json
          common_mistake: string
          difficulty: number
          duration_min_pair: number | null
          duration_min_solo: number | null
          helpers_needed: number
          hint: string
          id: string
          image_url: string
          is_mandatory: boolean
          is_practice: boolean
          prep_text: string
          safety_text: string
          self_check: Json
          sort: number
          stage_id: string
          title: string
          tools: string[]
          weather_note: string
          why_text: string
        }
        Insert: {
          actions?: Json
          applies_when?: Json
          common_mistake?: string
          difficulty?: number
          duration_min_pair?: number | null
          duration_min_solo?: number | null
          helpers_needed?: number
          hint?: string
          id?: string
          image_url?: string
          is_mandatory?: boolean
          is_practice?: boolean
          prep_text?: string
          safety_text?: string
          self_check?: Json
          sort: number
          stage_id: string
          title: string
          tools?: string[]
          weather_note?: string
          why_text?: string
        }
        Update: {
          actions?: Json
          applies_when?: Json
          common_mistake?: string
          difficulty?: number
          duration_min_pair?: number | null
          duration_min_solo?: number | null
          helpers_needed?: number
          hint?: string
          id?: string
          image_url?: string
          is_mandatory?: boolean
          is_practice?: boolean
          prep_text?: string
          safety_text?: string
          self_check?: Json
          sort?: number
          stage_id?: string
          title?: string
          tools?: string[]
          weather_note?: string
          why_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "steps_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
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
