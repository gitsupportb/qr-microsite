// Generated from supabase/migrations/00001_initial_schema.sql
// Replace with `npx supabase gen types typescript --local` once Supabase is running

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
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          status: 'active' | 'inactive' | 'suspended'
          plan: 'free' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          status?: 'active' | 'inactive' | 'suspended'
          plan?: 'free' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          status?: 'active' | 'inactive' | 'suspended'
          plan?: 'free' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          role: 'admin' | 'editor' | 'viewer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          email: string
          role?: 'admin' | 'editor' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          role?: 'admin' | 'editor' | 'viewer'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'users_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      business_profiles: {
        Row: {
          id: string
          tenant_id: string
          company_name: string
          tagline: string | null
          description_short: string | null
          description_long: string | null
          phone: string | null
          email: string | null
          website: string | null
          address: string | null
          event_name: string | null
          stand_number: string | null
          logo_url: string | null
          hero_image_url: string | null
          about_content: Json
          trust_content: Json
          comm_channels_enabled: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_name: string
          tagline?: string | null
          description_short?: string | null
          description_long?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          event_name?: string | null
          stand_number?: string | null
          logo_url?: string | null
          hero_image_url?: string | null
          about_content?: Json
          trust_content?: Json
          comm_channels_enabled?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_name?: string
          tagline?: string | null
          description_short?: string | null
          description_long?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          event_name?: string | null
          stand_number?: string | null
          logo_url?: string | null
          hero_image_url?: string | null
          about_content?: Json
          trust_content?: Json
          comm_channels_enabled?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_profiles_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      representatives: {
        Row: {
          id: string
          tenant_id: string
          business_profile_id: string
          name: string
          title: string | null
          email: string | null
          phone: string | null
          whatsapp: string | null
          image_url: string | null
          is_primary: boolean
          vcard_note_template: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          business_profile_id: string
          name: string
          title?: string | null
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          image_url?: string | null
          is_primary?: boolean
          vcard_note_template?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          business_profile_id?: string
          name?: string
          title?: string | null
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          image_url?: string | null
          is_primary?: boolean
          vcard_note_template?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'representatives_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'representatives_business_profile_id_fkey'
            columns: ['business_profile_id']
            isOneToOne: false
            referencedRelation: 'business_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      product_categories: {
        Row: {
          id: string
          tenant_id: string
          name: string
          slug: string
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          slug: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          slug?: string
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_categories_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          business_profile_id: string | null
          category_id: string | null
          title: string
          slug: string
          short_description: string | null
          long_description: string | null
          image_url: string | null
          featured: boolean
          visible: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          business_profile_id?: string | null
          category_id?: string | null
          title: string
          slug: string
          short_description?: string | null
          long_description?: string | null
          image_url?: string | null
          featured?: boolean
          visible?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          business_profile_id?: string | null
          category_id?: string | null
          title?: string
          slug?: string
          short_description?: string | null
          long_description?: string | null
          image_url?: string | null
          featured?: boolean
          visible?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'products_business_profile_id_fkey'
            columns: ['business_profile_id']
            isOneToOne: false
            referencedRelation: 'business_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'product_categories'
            referencedColumns: ['id']
          },
        ]
      }
      documents: {
        Row: {
          id: string
          tenant_id: string
          product_id: string | null
          business_profile_id: string | null
          title: string
          type: 'catalog' | 'brochure' | 'datasheet' | 'certification' | 'pricing_sheet' | 'other'
          file_url: string | null
          storage_path: string | null
          visibility: 'public' | 'private' | 'gated'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          product_id?: string | null
          business_profile_id?: string | null
          title: string
          type: 'catalog' | 'brochure' | 'datasheet' | 'certification' | 'pricing_sheet' | 'other'
          file_url?: string | null
          storage_path?: string | null
          visibility?: 'public' | 'private' | 'gated'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          product_id?: string | null
          business_profile_id?: string | null
          title?: string
          type?: 'catalog' | 'brochure' | 'datasheet' | 'certification' | 'pricing_sheet' | 'other'
          file_url?: string | null
          storage_path?: string | null
          visibility?: 'public' | 'private' | 'gated'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'documents_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_business_profile_id_fkey'
            columns: ['business_profile_id']
            isOneToOne: false
            referencedRelation: 'business_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      leads: {
        Row: {
          id: string
          tenant_id: string
          business_profile_id: string | null
          rep_id: string | null
          source_qr_id: string | null
          full_name: string | null
          email: string | null
          phone: string | null
          company: string | null
          message: string | null
          consent: boolean
          event_context: Json
          interest_context: Json
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          business_profile_id?: string | null
          rep_id?: string | null
          source_qr_id?: string | null
          full_name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          message?: string | null
          consent?: boolean
          event_context?: Json
          interest_context?: Json
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          business_profile_id?: string | null
          rep_id?: string | null
          source_qr_id?: string | null
          full_name?: string | null
          email?: string | null
          phone?: string | null
          company?: string | null
          message?: string | null
          consent?: boolean
          event_context?: Json
          interest_context?: Json
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'leads_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_business_profile_id_fkey'
            columns: ['business_profile_id']
            isOneToOne: false
            referencedRelation: 'business_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_rep_id_fkey'
            columns: ['rep_id']
            isOneToOne: false
            referencedRelation: 'representatives'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'leads_source_qr_id_fkey'
            columns: ['source_qr_id']
            isOneToOne: false
            referencedRelation: 'qr_codes'
            referencedColumns: ['id']
          },
        ]
      }
      qr_codes: {
        Row: {
          id: string
          tenant_id: string
          business_profile_id: string | null
          rep_id: string | null
          campaign_name: string | null
          target_url: string
          design_config: Json
          asset_url_png: string | null
          asset_url_svg: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          business_profile_id?: string | null
          rep_id?: string | null
          campaign_name?: string | null
          target_url: string
          design_config?: Json
          asset_url_png?: string | null
          asset_url_svg?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          business_profile_id?: string | null
          rep_id?: string | null
          campaign_name?: string | null
          target_url?: string
          design_config?: Json
          asset_url_png?: string | null
          asset_url_svg?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'qr_codes_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'qr_codes_business_profile_id_fkey'
            columns: ['business_profile_id']
            isOneToOne: false
            referencedRelation: 'business_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'qr_codes_rep_id_fkey'
            columns: ['rep_id']
            isOneToOne: false
            referencedRelation: 'representatives'
            referencedColumns: ['id']
          },
        ]
      }
      cta_configurations: {
        Row: {
          id: string
          tenant_id: string
          business_profile_id: string | null
          type: 'save_contact' | 'view_products' | 'get_catalog' | 'whatsapp' | 'request_quote' | 'share' | 'book_meeting' | 'call' | 'email' | 'website' | 'maps'
          label: string
          destination: string | null
          enabled: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          business_profile_id?: string | null
          type: 'save_contact' | 'view_products' | 'get_catalog' | 'whatsapp' | 'request_quote' | 'share' | 'book_meeting' | 'call' | 'email' | 'website' | 'maps'
          label: string
          destination?: string | null
          enabled?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          business_profile_id?: string | null
          type?: 'save_contact' | 'view_products' | 'get_catalog' | 'whatsapp' | 'request_quote' | 'share' | 'book_meeting' | 'call' | 'email' | 'website' | 'maps'
          label?: string
          destination?: string | null
          enabled?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cta_configurations_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cta_configurations_business_profile_id_fkey'
            columns: ['business_profile_id']
            isOneToOne: false
            referencedRelation: 'business_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      theme_configurations: {
        Row: {
          id: string
          tenant_id: string
          tokens_json: Json
          layout_variant: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          tokens_json?: Json
          layout_variant?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          tokens_json?: Json
          layout_variant?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'theme_configurations_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: true
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      analytics_events: {
        Row: {
          id: string
          tenant_id: string
          business_profile_id: string | null
          qr_id: string | null
          event_type: 'page_view' | 'save_contact' | 'brochure_click' | 'product_click' | 'form_submit' | 'share_click' | 'whatsapp_click' | 'cta_click' | 'scroll_depth' | 'send_to_self'
          session_id: string | null
          user_agent_hash: string | null
          metadata_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          business_profile_id?: string | null
          qr_id?: string | null
          event_type: 'page_view' | 'save_contact' | 'brochure_click' | 'product_click' | 'form_submit' | 'share_click' | 'whatsapp_click' | 'cta_click' | 'scroll_depth' | 'send_to_self'
          session_id?: string | null
          user_agent_hash?: string | null
          metadata_json?: Json
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          business_profile_id?: string | null
          qr_id?: string | null
          event_type?: 'page_view' | 'save_contact' | 'brochure_click' | 'product_click' | 'form_submit' | 'share_click' | 'whatsapp_click' | 'cta_click' | 'scroll_depth' | 'send_to_self'
          session_id?: string | null
          user_agent_hash?: string | null
          metadata_json?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'analytics_events_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'analytics_events_business_profile_id_fkey'
            columns: ['business_profile_id']
            isOneToOne: false
            referencedRelation: 'business_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'analytics_events_qr_id_fkey'
            columns: ['qr_id']
            isOneToOne: false
            referencedRelation: 'qr_codes'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      set_primary_representative: {
        Args: {
          p_rep_id: string
          p_business_profile_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience type helpers
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
