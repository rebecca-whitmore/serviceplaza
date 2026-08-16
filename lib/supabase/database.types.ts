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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      listing_category_assignments: {
        Row: {
          category_id: string
          created_at: string
          is_primary: boolean
          listing_version_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          is_primary?: boolean
          listing_version_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          is_primary?: boolean
          listing_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_category_assignments_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: false
            referencedRelation: "listing_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_category_assignments_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: false
            referencedRelation: "published_listing_details"
            referencedColumns: ["version_id"]
          },
        ]
      }
      listing_images: {
        Row: {
          alt_text: string | null
          byte_size: number
          created_at: string
          display_publicly: boolean
          height: number | null
          id: string
          listing_version_id: string
          mime_type: string
          original_filename: string
          private_storage_path: string
          published_storage_path: string | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          byte_size: number
          created_at?: string
          display_publicly?: boolean
          height?: number | null
          id?: string
          listing_version_id: string
          mime_type: string
          original_filename: string
          private_storage_path: string
          published_storage_path?: string | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          byte_size?: number
          created_at?: string
          display_publicly?: boolean
          height?: number | null
          id?: string
          listing_version_id?: string
          mime_type?: string
          original_filename?: string
          private_storage_path?: string
          published_storage_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: true
            referencedRelation: "listing_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_images_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: true
            referencedRelation: "published_listing_details"
            referencedColumns: ["version_id"]
          },
        ]
      }
      listing_service_tags: {
        Row: {
          created_at: string
          listing_version_id: string
          service_tag_id: string
        }
        Insert: {
          created_at?: string
          listing_version_id: string
          service_tag_id: string
        }
        Update: {
          created_at?: string
          listing_version_id?: string
          service_tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_service_tags_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: false
            referencedRelation: "listing_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_service_tags_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: false
            referencedRelation: "published_listing_details"
            referencedColumns: ["version_id"]
          },
          {
            foreignKeyName: "listing_service_tags_service_tag_id_fkey"
            columns: ["service_tag_id"]
            isOneToOne: false
            referencedRelation: "service_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_services: {
        Row: {
          created_at: string
          id: string
          listing_version_id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          listing_version_id: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          listing_version_id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_services_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: false
            referencedRelation: "listing_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_services_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: false
            referencedRelation: "published_listing_details"
            referencedColumns: ["version_id"]
          },
        ]
      }
      listing_versions: {
        Row: {
          base_town_city: string | null
          business_name: string
          category_help_requested: boolean
          category_help_text: string | null
          created_at: string
          created_by_user_id: string
          decided_at: string | null
          declaration_accepted_at: string | null
          full_description: string
          has_plaza_perk: boolean
          id: string
          listing_id: string
          offers_in_person: boolean
          offers_online: boolean
          perk_conditions: string | null
          perk_description: string | null
          perk_expires_on: string | null
          perk_redemption: string | null
          perk_title: string | null
          privacy_version: string | null
          public_contact_name: string | null
          public_email: string | null
          public_phone: string | null
          published_image_path: string | null
          serves_local: boolean
          serves_uk_wide: boolean
          short_summary: string
          show_public_email: boolean
          show_public_phone: boolean
          social_links: Json
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
          supersedes_version_id: string | null
          terms_version: string | null
          uk_region: string | null
          updated_at: string
          version_number: number
          website_url: string | null
        }
        Insert: {
          base_town_city?: string | null
          business_name?: string
          category_help_requested?: boolean
          category_help_text?: string | null
          created_at?: string
          created_by_user_id: string
          decided_at?: string | null
          declaration_accepted_at?: string | null
          full_description?: string
          has_plaza_perk?: boolean
          id?: string
          listing_id: string
          offers_in_person?: boolean
          offers_online?: boolean
          perk_conditions?: string | null
          perk_description?: string | null
          perk_expires_on?: string | null
          perk_redemption?: string | null
          perk_title?: string | null
          privacy_version?: string | null
          public_contact_name?: string | null
          public_email?: string | null
          public_phone?: string | null
          published_image_path?: string | null
          serves_local?: boolean
          serves_uk_wide?: boolean
          short_summary?: string
          show_public_email?: boolean
          show_public_phone?: boolean
          social_links?: Json
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          supersedes_version_id?: string | null
          terms_version?: string | null
          uk_region?: string | null
          updated_at?: string
          version_number: number
          website_url?: string | null
        }
        Update: {
          base_town_city?: string | null
          business_name?: string
          category_help_requested?: boolean
          category_help_text?: string | null
          created_at?: string
          created_by_user_id?: string
          decided_at?: string | null
          declaration_accepted_at?: string | null
          full_description?: string
          has_plaza_perk?: boolean
          id?: string
          listing_id?: string
          offers_in_person?: boolean
          offers_online?: boolean
          perk_conditions?: string | null
          perk_description?: string | null
          perk_expires_on?: string | null
          perk_redemption?: string | null
          perk_title?: string | null
          privacy_version?: string | null
          public_contact_name?: string | null
          public_email?: string | null
          public_phone?: string | null
          published_image_path?: string | null
          serves_local?: boolean
          serves_uk_wide?: boolean
          short_summary?: string
          show_public_email?: boolean
          show_public_phone?: boolean
          social_links?: Json
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          supersedes_version_id?: string | null
          terms_version?: string | null
          uk_region?: string | null
          updated_at?: string
          version_number?: number
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_versions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_versions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "published_listing_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_versions_supersedes_version_id_fkey"
            columns: ["supersedes_version_id"]
            isOneToOne: false
            referencedRelation: "listing_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_versions_supersedes_version_id_fkey"
            columns: ["supersedes_version_id"]
            isOneToOne: false
            referencedRelation: "published_listing_details"
            referencedColumns: ["version_id"]
          },
        ]
      }
      listings: {
        Row: {
          business_id: string
          created_at: string
          current_published_version_id: string | null
          id: string
          publication_status: Database["public"]["Enums"]["publication_status"]
          published_at: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          current_published_version_id?: string | null
          id?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          current_published_version_id?: string | null
          id?: string
          publication_status?: Database["public"]["Enums"]["publication_status"]
          published_at?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_current_version_fkey"
            columns: ["current_published_version_id"]
            isOneToOne: false
            referencedRelation: "listing_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_current_version_fkey"
            columns: ["current_published_version_id"]
            isOneToOne: false
            referencedRelation: "published_listing_details"
            referencedColumns: ["version_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      review_events: {
        Row: {
          applicant_message: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["review_event_type"]
          id: string
          listing_version_id: string
          performed_by_user_id: string
          private_admin_note: string | null
        }
        Insert: {
          applicant_message?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["review_event_type"]
          id?: string
          listing_version_id: string
          performed_by_user_id: string
          private_admin_note?: string | null
        }
        Update: {
          applicant_message?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["review_event_type"]
          id?: string
          listing_version_id?: string
          performed_by_user_id?: string
          private_admin_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_events_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: false
            referencedRelation: "listing_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_events_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: false
            referencedRelation: "published_listing_details"
            referencedColumns: ["version_id"]
          },
        ]
      }
      service_tags: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_tags_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      business_review_events: {
        Row: {
          applicant_message: string | null
          created_at: string | null
          event_type: Database["public"]["Enums"]["review_event_type"] | null
          id: string | null
          listing_version_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_events_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: false
            referencedRelation: "listing_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_events_listing_version_id_fkey"
            columns: ["listing_version_id"]
            isOneToOne: false
            referencedRelation: "published_listing_details"
            referencedColumns: ["version_id"]
          },
        ]
      }
      published_listing_details: {
        Row: {
          base_town_city: string | null
          business_name: string | null
          full_description: string | null
          has_plaza_perk: boolean | null
          id: string | null
          offers_in_person: boolean | null
          offers_online: boolean | null
          perk_conditions: string | null
          perk_description: string | null
          perk_expires_on: string | null
          perk_redemption: string | null
          perk_title: string | null
          public_contact_name: string | null
          public_email: string | null
          public_phone: string | null
          published_at: string | null
          published_image_path: string | null
          serves_local: boolean | null
          serves_uk_wide: boolean | null
          short_summary: string | null
          slug: string | null
          social_links: Json | null
          uk_region: string | null
          version_id: string | null
          website_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      save_basic_information: {
        Args: {
          additional_category_ids: string[]
          applicant_name: string
          custom_service_names: string[]
          help_requested: boolean
          help_text: string
          listing_business_name: string
          primary_category_id: string | null
          selected_service_tag_ids: string[]
          target_version_id: string
        }
        Returns: undefined
      }
      save_listing_taxonomy: {
        Args: {
          additional_category_ids: string[]
          custom_service_names: string[]
          help_requested: boolean
          help_text: string
          primary_category_id: string | null
          selected_service_tag_ids: string[]
          target_version_id: string
        }
        Returns: undefined
      }
      start_application: {
        Args: { contact_name: string }
        Returns: {
          business_id: string
          created_new: boolean
          listing_id: string
          listing_version_id: string
        }[]
      }
    }
    Enums: {
      publication_status: "unpublished" | "published" | "hidden" | "archived"
      review_event_type:
        | "submitted"
        | "changes_requested"
        | "resubmitted"
        | "approved"
        | "declined"
        | "withdrawn"
      submission_status:
        | "draft"
        | "pending"
        | "changes_requested"
        | "approved"
        | "declined"
        | "withdrawn"
      user_role: "business_user" | "admin"
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
      publication_status: ["unpublished", "published", "hidden", "archived"],
      review_event_type: [
        "submitted",
        "changes_requested",
        "resubmitted",
        "approved",
        "declined",
        "withdrawn",
      ],
      submission_status: [
        "draft",
        "pending",
        "changes_requested",
        "approved",
        "declined",
        "withdrawn",
      ],
      user_role: ["business_user", "admin"],
    },
  },
} as const
