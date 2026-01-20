export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          user_id: string
          tenant_id: string
          name: string
          email: string
          phone: string | null
          status: Database["public"]["Enums"]["account_status"]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tenant_id?: string
          name: string
          email: string
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          email?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }

      business: {
        Row: {
          id: string
          tenant_id: string
          status: Database["public"]["Enums"]["business_status"]
          created_at: string
          updated_at: string

          name: string
          description: string
          phone_commercial: string
          mobile_commercial: string | null
          email_commercial: string

          address_street: string
          address_number: string
          address_neighborhood: string
          address_city: string
          address_state: string
          address_zip: string
          address_complement: string | null

          public_slug: string | null
          logo_path: string | null
          map_url: string | null
          social_links: Json | null
        }
        Insert: {
          tenant_id: string
          name: string
          description: string
          phone_commercial: string
          email_commercial: string

          address_street: string
          address_number: string
          address_neighborhood: string
          address_city: string
          address_state: string
          address_zip: string

          mobile_commercial?: string | null
          address_complement?: string | null
          logo_path?: string | null
          map_url?: string | null
          social_links?: Json | null
          public_slug?: string | null
          status?: Database["public"]["Enums"]["business_status"]
        }
        Update: {
          name?: string
          description?: string
          phone_commercial?: string
          mobile_commercial?: string | null
          email_commercial?: string

          address_street?: string
          address_number?: string
          address_neighborhood?: string
          address_city?: string
          address_state?: string
          address_zip?: string
          address_complement?: string | null

          logo_path?: string | null
          map_url?: string | null
          social_links?: Json | null
          public_slug?: string | null
          status?: Database["public"]["Enums"]["business_status"]
        }
        Relationships: []
      }
    }

    Views: {
      public_business_with_products: {
        Row: {
          id: string
          public_slug: string
          status: "published"
          created_at: string
          updated_at: string

          name: string
          description: string
          phone_commercial: string
          mobile_commercial: string | null
          email_commercial: string

          address_street: string
          address_number: string
          address_neighborhood: string
          address_city: string
          address_state: string
          address_zip: string
          address_complement: string | null

          logo_path: string | null
          map_url: string | null
          social_links: Json | null

          products: {
            id: string
            type: "service" | "product" | "package"
            title: string
            short_description: string | null
            price_cents: number | null
            currency: string | null
            cta_label: string | null
            image_url: string | null
            position: number
          }[]
        }
      }
    }

    Enums: {
      account_status: "pending_email_verification" | "active" | "disabled"
      business_status: "draft" | "published"
    }

    Functions: {}
    CompositeTypes: {}
  }
}

/* ---------- Helpers padrão Supabase ---------- */

type PublicSchema = Database["public"]

export type Tables<T extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])> =
  (PublicSchema["Tables"] & PublicSchema["Views"])[T] extends { Row: infer R }
    ? R
    : never
