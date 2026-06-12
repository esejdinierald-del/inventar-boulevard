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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alcohol_deductions: {
        Row: {
          applied_quantity: number
          drink_name: string
          entry_date: string
          source: string
          turn_number: number
          updated_at: string
        }
        Insert: {
          applied_quantity?: number
          drink_name: string
          entry_date: string
          source?: string
          turn_number: number
          updated_at?: string
        }
        Update: {
          applied_quantity?: number
          drink_name?: string
          entry_date?: string
          source?: string
          turn_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      alcoholic_drinks_inventory: {
        Row: {
          created_at: string | null
          drink_name: string
          furnizime: number
          gjendje: number
          id: string
          purchase_price: number | null
          shitje: number
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          drink_name: string
          furnizime?: number
          gjendje?: number
          id?: string
          purchase_price?: number | null
          shitje?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          drink_name?: string
          furnizime?: number
          gjendje?: number
          id?: string
          purchase_price?: number | null
          shitje?: number
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coffee_types: {
        Row: {
          created_at: string | null
          id: string
          name: string
          purchase_price: number | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          purchase_price?: number | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          purchase_price?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      daily_entries: {
        Row: {
          created_at: string | null
          entry_date: string
          id: string
          turn1_data: Json
          turn1_locked: boolean
          turn1_locked_at: string | null
          turn1_locked_by: string | null
          turn2_data: Json
          turn2_locked: boolean
          turn2_locked_at: string | null
          turn2_locked_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entry_date: string
          id?: string
          turn1_data?: Json
          turn1_locked?: boolean
          turn1_locked_at?: string | null
          turn1_locked_by?: string | null
          turn2_data?: Json
          turn2_locked?: boolean
          turn2_locked_at?: string | null
          turn2_locked_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entry_date?: string
          id?: string
          turn1_data?: Json
          turn1_locked?: boolean
          turn1_locked_at?: string | null
          turn1_locked_by?: string | null
          turn2_data?: Json
          turn2_locked?: boolean
          turn2_locked_at?: string | null
          turn2_locked_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_entry_history: {
        Row: {
          action_type: string | null
          created_at: string
          data: Json
          entry_date: string
          id: string
          turn_number: number
        }
        Insert: {
          action_type?: string | null
          created_at?: string
          data: Json
          entry_date: string
          id?: string
          turn_number: number
        }
        Update: {
          action_type?: string | null
          created_at?: string
          data?: Json
          entry_date?: string
          id?: string
          turn_number?: number
        }
        Relationships: []
      }
      expense_templates: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          category: string | null
          cost: number
          created_at: string
          expense_date: string
          id: string
          notes: string | null
          product_name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost: number
          created_at?: string
          expense_date: string
          id?: string
          notes?: string | null
          product_name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string
          expense_date?: string
          id?: string
          notes?: string | null
          product_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      gjendje_locks: {
        Row: {
          confirmed_at: string
          confirmed_by: string | null
          entry_date: string
          turn_number: number
        }
        Insert: {
          confirmed_at?: string
          confirmed_by?: string | null
          entry_date: string
          turn_number: number
        }
        Update: {
          confirmed_at?: string
          confirmed_by?: string | null
          entry_date?: string
          turn_number?: number
        }
        Relationships: []
      }
      invoice_mappings: {
        Row: {
          created_at: string | null
          id: string
          invoice_name: string
          product_name: string
          product_type: string
          quantity: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_name: string
          product_name: string
          product_type: string
          quantity?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_name?: string
          product_name?: string
          product_type?: string
          quantity?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kitchen_products: {
        Row: {
          created_at: string | null
          id: string
          name: string
          purchase_price: number | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          purchase_price?: number | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          purchase_price?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      next_day_stock: {
        Row: {
          created_at: string | null
          id: string
          mulliri_fillim: number | null
          stock_data: Json
          stock_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mulliri_fillim?: number | null
          stock_data?: Json
          stock_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mulliri_fillim?: number | null
          stock_data?: Json
          stock_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_mappings: {
        Row: {
          created_at: string | null
          id: string
          product_name: string
          product_type: string
          quantity: number | null
          receipt_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_name: string
          product_type: string
          quantity?: number | null
          receipt_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_name?: string
          product_type?: string
          quantity?: number | null
          receipt_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string | null
          id: string
          name: string
          purchase_price: number | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          purchase_price?: number | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          purchase_price?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      staff_turn_pins: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          is_manager: boolean
          permissions: Json
          pin: string
          staff_name: string
          turn_number: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          is_manager?: boolean
          permissions?: Json
          pin: string
          staff_name: string
          turn_number?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          is_manager?: boolean
          permissions?: Json
          pin?: string
          staff_name?: string
          turn_number?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waiter_calls: {
        Row: {
          acknowledged_at: string | null
          call_type: string
          completed_at: string | null
          created_at: string
          id: string
          priority: number | null
          special_request: string | null
          status: string
          table_number: number
        }
        Insert: {
          acknowledged_at?: string | null
          call_type: string
          completed_at?: string | null
          created_at?: string
          id?: string
          priority?: number | null
          special_request?: string | null
          status?: string
          table_number: number
        }
        Update: {
          acknowledged_at?: string | null
          call_type?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          priority?: number | null
          special_request?: string | null
          status?: string
          table_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff"
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
    Enums: {
      app_role: ["admin", "staff"],
    },
  },
} as const
