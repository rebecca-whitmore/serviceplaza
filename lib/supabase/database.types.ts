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
      listing_enquiries: {
        Row: { id: string; listing_id: string; listing_version_id: string; sender_name: string; sender_email: string; sender_phone: string | null; preferred_contact: string; message: string; privacy_accepted_at: string; ip_hash: string; delivery_email: string; delivery_status: string; provider_message_id: string | null; delivery_error: string | null; sent_at: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; listing_id: string; listing_version_id: string; sender_name: string; sender_email: string; sender_phone?: string | null; preferred_contact: string; message: string; privacy_accepted_at: string; ip_hash: string; delivery_email: string; delivery_status?: string; provider_message_id?: string | null; delivery_error?: string | null; sent_at?: string | null; created_at?: string; updated_at?: string }
        Update: { delivery_status?: string; provider_message_id?: string | null; delivery_error?: string | null; sent_at?: string | null; updated_at?: string }
        Relationships: []
      }
      listing_internal_flags: {
        Row: { created_at: string; listing_id: string; updated_at: string; updated_by_user_id: string; website_opportunity: boolean }
        Insert: { created_at?: string; listing_id: string; updated_at?: string; updated_by_user_id: string; website_opportunity?: boolean }
        Update: { created_at?: string; listing_id?: string; updated_at?: string; updated_by_user_id?: string; website_opportunity?: boolean }
        Relationships: []
      }
      listing_outbound_clicks: {
        Row: { clicked_at: string; id: string; link_type: string; listing_id: string; listing_version_id: string }
        Insert: { clicked_at?: string; id?: string; link_type: string; listing_id: string; listing_version_id: string }
        Update: { clicked_at?: string; id?: string; link_type?: string; listing_id?: string; listing_version_id?: string }
        Relationships: []
      }
      listing_management_events: {
        Row: { action: string; created_at: string; id: string; listing_id: string; listing_version_id: string; performed_by_user_id: string; reason: string | null }
        Insert: { action: string; created_at?: string; id?: string; listing_id: string; listing_version_id: string; performed_by_user_id: string; reason?: string | null }
        Update: { action?: string; created_at?: string; id?: string; listing_id?: string; listing_version_id?: string; performed_by_user_id?: string; reason?: string | null }
        Relationships: []
      }
      application_email_notifications: {
        Row: { attempts: number; created_at: string; id: string; last_error: string | null; listing_version_id: string; notification_type: string; provider_message_id: string | null; recipient_email: string; sent_at: string | null; status: string; updated_at: string }
        Insert: { attempts?: number; created_at?: string; id?: string; last_error?: string | null; listing_version_id: string; notification_type: string; provider_message_id?: string | null; recipient_email: string; sent_at?: string | null; status?: string; updated_at?: string }
        Update: { attempts?: number; created_at?: string; id?: string; last_error?: string | null; listing_version_id?: string; notification_type?: string; provider_message_id?: string | null; recipient_email?: string; sent_at?: string | null; status?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "application_email_notifications_listing_version_id_fkey"; columns: ["listing_version_id"]; isOneToOne: false; referencedRelation: "listing_versions"; referencedColumns: ["id"] }]
      }
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
          business_postcode: string | null
          business_name: string
          category_help_requested: boolean
          category_help_text: string | null
          created_at: string
          created_by_user_id: string
          decided_at: string | null
          declaration_accepted_at: string | null
          full_description: string
          founder_story: string | null
          has_plaza_perk: boolean
          is_uk_based: boolean
          id: string
          listing_id: string
          offers_in_person: boolean
          offers_online: boolean
          in_person_mode: string | null
          in_person_nationwide: boolean
          public_visit_address: string | null
          public_visit_address_confirmed: boolean
          postcode_latitude: number | null
          postcode_longitude: number | null
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
          show_base_location: boolean
          social_links: Json
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
          supersedes_version_id: string | null
          terms_version: string | null
          travel_radius_miles: number | null
          uk_region: string | null
          updated_at: string
          version_number: number
          website_url: string | null
        }
        Insert: {
          base_town_city?: string | null
          business_postcode?: string | null
          business_name?: string
          category_help_requested?: boolean
          category_help_text?: string | null
          created_at?: string
          created_by_user_id: string
          decided_at?: string | null
          declaration_accepted_at?: string | null
          full_description?: string
          founder_story?: string | null
          has_plaza_perk?: boolean
          is_uk_based?: boolean
          id?: string
          listing_id: string
          offers_in_person?: boolean
          offers_online?: boolean
          in_person_mode?: string | null
          in_person_nationwide?: boolean
          public_visit_address?: string | null
          public_visit_address_confirmed?: boolean
          postcode_latitude?: number | null
          postcode_longitude?: number | null
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
          show_base_location?: boolean
          social_links?: Json
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          supersedes_version_id?: string | null
          terms_version?: string | null
          travel_radius_miles?: number | null
          uk_region?: string | null
          updated_at?: string
          version_number: number
          website_url?: string | null
        }
        Update: {
          base_town_city?: string | null
          business_postcode?: string | null
          business_name?: string
          category_help_requested?: boolean
          category_help_text?: string | null
          created_at?: string
          created_by_user_id?: string
          decided_at?: string | null
          declaration_accepted_at?: string | null
          full_description?: string
          founder_story?: string | null
          has_plaza_perk?: boolean
          is_uk_based?: boolean
          id?: string
          listing_id?: string
          offers_in_person?: boolean
          offers_online?: boolean
          in_person_mode?: string | null
          in_person_nationwide?: boolean
          public_visit_address?: string | null
          public_visit_address_confirmed?: boolean
          postcode_latitude?: number | null
          postcode_longitude?: number | null
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
          show_base_location?: boolean
          social_links?: Json
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
          supersedes_version_id?: string | null
          terms_version?: string | null
          travel_radius_miles?: number | null
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
          first_published_at: string | null
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
          first_published_at?: string | null
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
          first_published_at?: string | null
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
          first_published_at: string | null
          base_town_city: string | null
          business_name: string | null
          full_description: string | null
          founder_story: string | null
          has_plaza_perk: boolean | null
          is_uk_based: boolean | null
          id: string | null
          offers_in_person: boolean | null
          offers_online: boolean | null
          in_person_mode: string | null
          in_person_nationwide: boolean | null
          public_visit_address: string | null
          public_visit_address_confirmed: boolean | null
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
          travel_radius_miles: number | null
          uk_region: string | null
          version_id: string | null
          website_url: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_admin_review_events: { Args: { target_listing_version_ids: string[] }; Returns: { applicant_message: string | null; created_at: string; event_type: string; listing_version_id: string; private_admin_note: string | null }[] }
      search_published_listings_by_postcode: { Args: { search_latitude: number; search_longitude: number; visitor_radius_miles?: number }; Returns: { version_id: string; distance_miles: number; match_kind: string }[] }
      admin_release_owner_draft: { Args: { administrator_reason: string; target_listing_id: string }; Returns: string }
      admin_remove_published_listing_image: { Args: { target_listing_id: string }; Returns: Json }
      admin_update_published_listing_image: { Args: { file_byte_size: number | null; file_mime_type: string | null; filename: string | null; image_alt_text: string; new_private_storage_path: string | null; new_public_storage_path: string | null; target_listing_id: string }; Returns: Json }
      admin_remove_pending_application_image: { Args: { target_version_id: string }; Returns: string | null }
      admin_update_pending_application_image: { Args: { file_byte_size: number | null; file_mime_type: string | null; filename: string | null; image_alt_text: string; storage_path: string | null; target_version_id: string }; Returns: string | null }
      admin_edit_pending_application: { Args: { custom_service_names: string[]; edit_payload: Json; edit_reason: string; target_version_id: string }; Returns: undefined }
      admin_set_website_opportunity: { Args: { opportunity: boolean; target_listing_id: string }; Returns: undefined }
      get_public_listing_taxonomy: { Args: { target_version_id: string }; Returns: { additional_categories: Json; primary_category: Json; service_tags: Json; services: Json }[] }
      record_listing_outbound_click: { Args: { target_link_type: string; target_slug: string }; Returns: string }
      admin_publish_listing_edit_with_uk: { Args: { additional_category_ids: string[]; confirm_uk_based: boolean; custom_service_names: string[]; display_base_location: boolean; edit_payload: Json; edit_reason: string; primary_category_id: string; selected_service_tag_ids: string[]; target_listing_id: string }; Returns: string }
      get_published_listing_details: { Args: { target_slug?: string | null }; Returns: Database["public"]["Views"]["published_listing_details"]["Row"][] }
      admin_publish_listing_edit: { Args: { additional_category_ids: string[]; custom_service_names: string[]; edit_payload: Json; edit_reason: string; primary_category_id: string; selected_service_tag_ids: string[]; target_listing_id: string }; Returns: string }
      admin_set_listing_visibility: { Args: { administrator_reason: string; make_visible: boolean; target_listing_id: string }; Returns: undefined }
      complete_application_notification: { Args: { delivery_error: string; delivery_succeeded: boolean; resend_message_id: string; target_notification_id: string }; Returns: undefined }
      queue_application_notification: { Args: { notification_kind: string; target_version_id: string }; Returns: { business_name: string; delivery_status: string; notification_id: string; recipient_email: string }[] }
      admin_decide_application: {
        Args: {
          administrator_note: string
          approved_public_image_path: string | null
          decision: string
          message_to_applicant: string
          target_version_id: string
        }
        Returns: string | null
      }
      register_listing_image: {
        Args: {
          file_byte_size: number
          file_mime_type: string
          filename: string
          image_alt_text: string
          image_height: number
          image_width: number
          show_publicly: boolean
          storage_path: string
          target_version_id: string
        }
        Returns: string | null
      }
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
      start_listing_edit: {
        Args: Record<PropertyKey, never>
        Returns: { created_new: boolean; listing_version_id: string; source_version_id: string }[]
      }
      submit_application: {
        Args: { target_version_id: string }
        Returns: undefined
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
        | "admin_edited"
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
        "admin_edited",
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
