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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      agent_invitational_codes: {
        Row: {
          agent_id: string
          agent_staff_id: string
          code: string
          created_at: string
          credit_worth_factor: number
          expires_at: string
          id: string
          is_used: boolean
          school_name: string | null
          used_at: string | null
          used_by_school_id: string | null
          used_by_user_id: string | null
        }
        Insert: {
          agent_id: string
          agent_staff_id: string
          code: string
          created_at?: string
          credit_worth_factor?: number
          expires_at?: string
          id?: string
          is_used?: boolean
          school_name?: string | null
          used_at?: string | null
          used_by_school_id?: string | null
          used_by_user_id?: string | null
        }
        Update: {
          agent_id?: string
          agent_staff_id?: string
          code?: string
          created_at?: string
          credit_worth_factor?: number
          expires_at?: string
          id?: string
          is_used?: boolean
          school_name?: string | null
          used_at?: string | null
          used_by_school_id?: string | null
          used_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_invitational_codes_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_invitational_codes_used_by_school_id_fkey"
            columns: ["used_by_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          business_name: string
          country: string | null
          created_at: string
          id: string
          region: string | null
          registered_at: string
          sessions_organised: number
          total_credits: number
          total_schools_referred: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_name: string
          country?: string | null
          created_at?: string
          id?: string
          region?: string | null
          registered_at?: string
          sessions_organised?: number
          total_credits?: number
          total_schools_referred?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_name?: string
          country?: string | null
          created_at?: string
          id?: string
          region?: string | null
          registered_at?: string
          sessions_organised?: number
          total_credits?: number
          total_schools_referred?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      audit_reports: {
        Row: {
          auditor_id: string
          auditor_user_id: string
          created_at: string
          discrepancies_found: boolean
          id: string
          report_details: Json
          school_id: string
          sent_to_school_at: string | null
          session_id: string
          status: string
          students_with_discrepancies: number
          submitted_data: Json | null
          submitted_to_admin_at: string | null
          total_students_audited: number
          updated_at: string
        }
        Insert: {
          auditor_id: string
          auditor_user_id: string
          created_at?: string
          discrepancies_found?: boolean
          id?: string
          report_details?: Json
          school_id: string
          sent_to_school_at?: string | null
          session_id: string
          status?: string
          students_with_discrepancies?: number
          submitted_data?: Json | null
          submitted_to_admin_at?: string | null
          total_students_audited?: number
          updated_at?: string
        }
        Update: {
          auditor_id?: string
          auditor_user_id?: string
          created_at?: string
          discrepancies_found?: boolean
          id?: string
          report_details?: Json
          school_id?: string
          sent_to_school_at?: string | null
          session_id?: string
          status?: string
          students_with_discrepancies?: number
          submitted_data?: Json | null
          submitted_to_admin_at?: string | null
          total_students_audited?: number
          updated_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          is_attended: boolean
          is_audited: boolean
          name: string
          order_id: string | null
          school_id: string
          session_id: string | null
          submitted_students_count: number | null
          total_students_served_in_class: number
          total_students_to_serve_in_class: number
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          is_attended?: boolean
          is_audited?: boolean
          name: string
          order_id?: string | null
          school_id: string
          session_id?: string | null
          submitted_students_count?: number | null
          total_students_served_in_class?: number
          total_students_to_serve_in_class?: number
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          is_attended?: boolean
          is_audited?: boolean
          name?: string
          order_id?: string | null
          school_id?: string
          session_id?: string | null
          submitted_students_count?: number | null
          total_students_served_in_class?: number
          total_students_to_serve_in_class?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participants: string[]
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participants: string[]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participants?: string[]
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          created_at: string
          email: string
          headmaster_name: string
          id: string
          is_read: boolean
          location: string
          message: string | null
          phone: string
          preferred_date: string
          school_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          headmaster_name: string
          id?: string
          is_read?: boolean
          location: string
          message?: string | null
          phone: string
          preferred_date: string
          school_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          headmaster_name?: string
          id?: string
          is_read?: boolean
          location?: string
          message?: string | null
          phone?: string
          preferred_date?: string
          school_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      guest_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      machine_locations: {
        Row: {
          created_at: string
          id: string
          lat: number
          lng: number
          machine_id: string
          provider: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lat: number
          lng: number
          machine_id: string
          provider?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          machine_id?: string
          provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machine_locations_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          active_session: string | null
          created_at: string
          device_id: string
          firmware_version: string | null
          id: string
          is_online: boolean
          is_printing: boolean
          last_seen_at: string | null
          model: string | null
          secret_key: string
          sessions_held: number
          up_time: string | null
          updated_at: string
        }
        Insert: {
          active_session?: string | null
          created_at?: string
          device_id: string
          firmware_version?: string | null
          id?: string
          is_online?: boolean
          is_printing?: boolean
          last_seen_at?: string | null
          model?: string | null
          secret_key: string
          sessions_held?: number
          up_time?: string | null
          updated_at?: string
        }
        Update: {
          active_session?: string | null
          created_at?: string
          device_id?: string
          firmware_version?: string | null
          id?: string
          is_online?: boolean
          is_printing?: boolean
          last_seen_at?: string | null
          model?: string | null
          secret_key?: string
          sessions_held?: number
          up_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          conversation_id: string
          created_at: string
          edited_at: string | null
          id: string
          is_read_by: Json | null
          reply_to: string | null
          sender_role: Database["public"]["Enums"]["user_role"] | null
          sender_user_id: string | null
          text: string
        }
        Insert: {
          attachments?: Json | null
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_read_by?: Json | null
          reply_to?: string | null
          sender_role?: Database["public"]["Enums"]["user_role"] | null
          sender_user_id?: string | null
          text: string
        }
        Update: {
          attachments?: Json | null
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          is_read_by?: Json | null
          reply_to?: string | null
          sender_role?: Database["public"]["Enums"]["user_role"] | null
          sender_user_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          delivered_at: string | null
          id: string
          is_read: boolean
          level: Database["public"]["Enums"]["notification_level"]
          meta: Json | null
          sender_user_id: string | null
          target_id: string | null
          target_type: string | null
          title: string
        }
        Insert: {
          body: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_read?: boolean
          level?: Database["public"]["Enums"]["notification_level"]
          meta?: Json | null
          sender_user_id?: string | null
          target_id?: string | null
          target_type?: string | null
          title: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_read?: boolean
          level?: Database["public"]["Enums"]["notification_level"]
          meta?: Json | null
          sender_user_id?: string | null
          target_id?: string | null
          target_type?: string | null
          title?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          dark_count: number
          id: string
          light_count: number
          order_id: string
          printed_dark: number
          printed_light: number
          status: string
          student_id: string | null
          student_name_cached: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dark_count?: number
          id?: string
          light_count?: number
          order_id: string
          printed_dark?: number
          printed_light?: number
          status?: string
          student_id?: string | null
          student_name_cached: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dark_count?: number
          id?: string
          light_count?: number
          order_id?: string
          printed_dark?: number
          printed_light?: number
          status?: string
          student_id?: string | null
          student_name_cached?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_facility_id: string | null
          assigned_operator_id: string | null
          audit_trail: Json | null
          auto_confirmed_at: string | null
          confirm_received_at: string | null
          country: string | null
          created_at: string
          created_by_school: string
          created_by_user: string | null
          current_class_name: string | null
          current_student_name: string | null
          delivery: Json | null
          device_used_mac: string | null
          district: string | null
          estimated_duration_hours: number | null
          external_ref: string | null
          headmaster_name: string | null
          hosted_by: string | null
          id: string
          is_served: boolean
          is_session_active: boolean
          packaging: Json | null
          payment_method: string | null
          pickup: Json | null
          printing: Json | null
          queued_at: string | null
          receipt_image_url: string | null
          receipt_number: string | null
          region: string | null
          schedule_message_copied_at: string | null
          scheduled_date: string | null
          school_name: string | null
          session_data: Json | null
          status: Database["public"]["Enums"]["order_status"]
          submission_time: string | null
          submitted_total_classes: number | null
          submitted_total_dark_garments: number | null
          submitted_total_garments: number | null
          submitted_total_light_garments: number | null
          submitted_total_students: number | null
          total_amount: number | null
          total_classes_served: number
          total_classes_to_serve: number
          total_dark_garments: number | null
          total_garments: number
          total_light_garments: number | null
          total_students: number
          total_students_served_in_school: number
          updated_at: string
        }
        Insert: {
          assigned_facility_id?: string | null
          assigned_operator_id?: string | null
          audit_trail?: Json | null
          auto_confirmed_at?: string | null
          confirm_received_at?: string | null
          country?: string | null
          created_at?: string
          created_by_school: string
          created_by_user?: string | null
          current_class_name?: string | null
          current_student_name?: string | null
          delivery?: Json | null
          device_used_mac?: string | null
          district?: string | null
          estimated_duration_hours?: number | null
          external_ref?: string | null
          headmaster_name?: string | null
          hosted_by?: string | null
          id?: string
          is_served?: boolean
          is_session_active?: boolean
          packaging?: Json | null
          payment_method?: string | null
          pickup?: Json | null
          printing?: Json | null
          queued_at?: string | null
          receipt_image_url?: string | null
          receipt_number?: string | null
          region?: string | null
          schedule_message_copied_at?: string | null
          scheduled_date?: string | null
          school_name?: string | null
          session_data?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          submission_time?: string | null
          submitted_total_classes?: number | null
          submitted_total_dark_garments?: number | null
          submitted_total_garments?: number | null
          submitted_total_light_garments?: number | null
          submitted_total_students?: number | null
          total_amount?: number | null
          total_classes_served?: number
          total_classes_to_serve?: number
          total_dark_garments?: number | null
          total_garments?: number
          total_light_garments?: number | null
          total_students?: number
          total_students_served_in_school?: number
          updated_at?: string
        }
        Update: {
          assigned_facility_id?: string | null
          assigned_operator_id?: string | null
          audit_trail?: Json | null
          auto_confirmed_at?: string | null
          confirm_received_at?: string | null
          country?: string | null
          created_at?: string
          created_by_school?: string
          created_by_user?: string | null
          current_class_name?: string | null
          current_student_name?: string | null
          delivery?: Json | null
          device_used_mac?: string | null
          district?: string | null
          estimated_duration_hours?: number | null
          external_ref?: string | null
          headmaster_name?: string | null
          hosted_by?: string | null
          id?: string
          is_served?: boolean
          is_session_active?: boolean
          packaging?: Json | null
          payment_method?: string | null
          pickup?: Json | null
          printing?: Json | null
          queued_at?: string | null
          receipt_image_url?: string | null
          receipt_number?: string | null
          region?: string | null
          schedule_message_copied_at?: string | null
          scheduled_date?: string | null
          school_name?: string | null
          session_data?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          submission_time?: string | null
          submitted_total_classes?: number | null
          submitted_total_dark_garments?: number | null
          submitted_total_garments?: number | null
          submitted_total_light_garments?: number | null
          submitted_total_students?: number | null
          total_amount?: number | null
          total_classes_served?: number
          total_classes_to_serve?: number
          total_dark_garments?: number | null
          total_garments?: number
          total_light_garments?: number | null
          total_students?: number
          total_students_served_in_school?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_school_fkey"
            columns: ["created_by_school"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_name: string | null
          account_number: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pending_orders: {
        Row: {
          country: string
          created_at: string
          district: string
          expires_at: string
          headmaster_name: string
          id: string
          last_verification_attempt: string | null
          order_id: string
          payment_method: string
          payment_verified: boolean
          receipt_image_url: string | null
          receipt_number: string | null
          region: string
          school_id: string
          school_name: string
          session_data: Json
          total_amount: number
          total_dark_garments: number
          total_light_garments: number
          total_students: number
          verification_attempts: number
        }
        Insert: {
          country: string
          created_at?: string
          district: string
          expires_at?: string
          headmaster_name: string
          id?: string
          last_verification_attempt?: string | null
          order_id: string
          payment_method: string
          payment_verified?: boolean
          receipt_image_url?: string | null
          receipt_number?: string | null
          region: string
          school_id: string
          school_name: string
          session_data: Json
          total_amount?: number
          total_dark_garments?: number
          total_light_garments?: number
          total_students?: number
          verification_attempts?: number
        }
        Update: {
          country?: string
          created_at?: string
          district?: string
          expires_at?: string
          headmaster_name?: string
          id?: string
          last_verification_attempt?: string | null
          order_id?: string
          payment_method?: string
          payment_verified?: boolean
          receipt_image_url?: string | null
          receipt_number?: string | null
          region?: string
          school_id?: string
          school_name?: string
          session_data?: Json
          total_amount?: number
          total_dark_garments?: number
          total_light_garments?: number
          total_students?: number
          verification_attempts?: number
        }
        Relationships: []
      }
      print_events: {
        Row: {
          created_at: string
          id: string
          idempotency_key: string
          payload: Json
          print_job_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          idempotency_key: string
          payload: Json
          print_job_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          idempotency_key?: string
          payload?: Json
          print_job_id?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agent_id: string | null
          country: string | null
          created_at: string
          district: string | null
          full_name: string
          id: string
          last_seen_at: string | null
          phone_number: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          full_name: string
          id: string
          last_seen_at?: string | null
          phone_number?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          last_seen_at?: string | null
          phone_number?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          category: string | null
          confirmation_expires_at: string | null
          country: string | null
          created_at: string
          district: string | null
          email: string | null
          headmaster_name: string | null
          id: string
          is_served: boolean
          is_session_active: boolean
          name: string
          notification_preferences: Json | null
          phone_number1: string | null
          phone_number2: string | null
          postal_address: string | null
          referral_code_used: string | null
          referred_at: string | null
          referred_by_agent_id: string | null
          region: string | null
          registered_on: string | null
          school_id: string | null
          service_pass_code: string
          status: string
          total_student_count: number
          total_students_served_in_school: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          confirmation_expires_at?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          headmaster_name?: string | null
          id?: string
          is_served?: boolean
          is_session_active?: boolean
          name: string
          notification_preferences?: Json | null
          phone_number1?: string | null
          phone_number2?: string | null
          postal_address?: string | null
          referral_code_used?: string | null
          referred_at?: string | null
          referred_by_agent_id?: string | null
          region?: string | null
          registered_on?: string | null
          school_id?: string | null
          service_pass_code: string
          status?: string
          total_student_count?: number
          total_students_served_in_school?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          confirmation_expires_at?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          headmaster_name?: string | null
          id?: string
          is_served?: boolean
          is_session_active?: boolean
          name?: string
          notification_preferences?: Json | null
          phone_number1?: string | null
          phone_number2?: string | null
          postal_address?: string | null
          referral_code_used?: string | null
          referred_at?: string | null
          referred_by_agent_id?: string | null
          region?: string | null
          registered_on?: string | null
          school_id?: string | null
          service_pass_code?: string
          status?: string
          total_student_count?: number
          total_students_served_in_school?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_referred_by_agent_id_fkey"
            columns: ["referred_by_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          created_by_admin: string | null
          email: string
          full_name: string
          id: string
          phone_number: string | null
          role: Database["public"]["Enums"]["user_role"]
          sessions_hosted: number
          staff_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_admin?: string | null
          email: string
          full_name: string
          id?: string
          phone_number?: string | null
          role: Database["public"]["Enums"]["user_role"]
          sessions_hosted?: number
          staff_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_admin?: string | null
          email?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          sessions_hosted?: number
          staff_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_metrics: {
        Row: {
          avg_completion_time_seconds: number | null
          created_at: string
          efficiency_score: number | null
          id: string
          period_end: string
          period_start: string
          staff_user_id: string
          tasks_assigned: number
          tasks_completed: number
        }
        Insert: {
          avg_completion_time_seconds?: number | null
          created_at?: string
          efficiency_score?: number | null
          id?: string
          period_end: string
          period_start: string
          staff_user_id: string
          tasks_assigned?: number
          tasks_completed?: number
        }
        Update: {
          avg_completion_time_seconds?: number | null
          created_at?: string
          efficiency_score?: number | null
          id?: string
          period_end?: string
          period_start?: string
          staff_user_id?: string
          tasks_assigned?: number
          tasks_completed?: number
        }
        Relationships: []
      }
      staff_tasks: {
        Row: {
          assigned_at: string
          completed_at: string | null
          created_at: string
          expected_at: string | null
          feedback: string | null
          id: string
          rating: number | null
          staff_user_id: string
          status: string
          target_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          completed_at?: string | null
          created_at?: string
          expected_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          staff_user_id: string
          status?: string
          target_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          completed_at?: string | null
          created_at?: string
          expected_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          staff_user_id?: string
          status?: string
          target_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_audits: {
        Row: {
          audit_report_id: string
          audited_at: string
          auditor_notes: string | null
          class_name: string
          collected_dark_garments: number
          collected_light_garments: number
          created_at: string
          dark_garments_discrepancy: number
          has_discrepancy: boolean
          id: string
          light_garments_discrepancy: number
          student_id: string
          student_name: string
          submitted_dark_garments: number
          submitted_light_garments: number
        }
        Insert: {
          audit_report_id: string
          audited_at?: string
          auditor_notes?: string | null
          class_name: string
          collected_dark_garments?: number
          collected_light_garments?: number
          created_at?: string
          dark_garments_discrepancy?: number
          has_discrepancy?: boolean
          id?: string
          light_garments_discrepancy?: number
          student_id: string
          student_name: string
          submitted_dark_garments?: number
          submitted_light_garments?: number
        }
        Update: {
          audit_report_id?: string
          audited_at?: string
          auditor_notes?: string | null
          class_name?: string
          collected_dark_garments?: number
          collected_light_garments?: number
          created_at?: string
          dark_garments_discrepancy?: number
          has_discrepancy?: boolean
          id?: string
          light_garments_discrepancy?: number
          student_id?: string
          student_name?: string
          submitted_dark_garments?: number
          submitted_light_garments?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_audits_audit_report_id_fkey"
            columns: ["audit_report_id"]
            isOneToOne: false
            referencedRelation: "audit_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string
          created_at: string
          dark_garments_printed: boolean
          full_name: string
          id: string
          is_audited: boolean
          is_served: boolean
          light_garments_printed: boolean
          printed_dark_garment_count: number
          printed_light_garment_count: number
          printing_done_at: string | null
          school_id: string
          session_id: string | null
          student_id: string | null
          submitted_dark_garment_count: number | null
          submitted_light_garment_count: number | null
          total_dark_garment_count: number
          total_light_garment_count: number
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          dark_garments_printed?: boolean
          full_name: string
          id?: string
          is_audited?: boolean
          is_served?: boolean
          light_garments_printed?: boolean
          printed_dark_garment_count?: number
          printed_light_garment_count?: number
          printing_done_at?: string | null
          school_id: string
          session_id?: string | null
          student_id?: string | null
          submitted_dark_garment_count?: number | null
          submitted_light_garment_count?: number | null
          total_dark_garment_count?: number
          total_light_garment_count?: number
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          dark_garments_printed?: boolean
          full_name?: string
          id?: string
          is_audited?: boolean
          is_served?: boolean
          light_garments_printed?: boolean
          printed_dark_garment_count?: number
          printed_light_garment_count?: number
          printing_done_at?: string | null
          school_id?: string
          session_id?: string | null
          student_id?: string | null
          submitted_dark_garment_count?: number | null
          submitted_light_garment_count?: number | null
          total_dark_garment_count?: number
          total_light_garment_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      notification_channel: "IN_APP" | "EMAIL" | "SMS" | "PUSH"
      notification_level: "INFO" | "WARNING" | "ERROR"
      order_status:
        | "UNSUBMITTED"
        | "SUBMITTED"
        | "QUEUED"
        | "PICKUP"
        | "ONGOING"
        | "ABORTED"
        | "DONE"
        | "PACKAGING"
        | "DELIVERY"
        | "COMPLETED"
        | "CONFIRMED"
        | "AUTO_CONFIRMED"
      user_role:
        | "ADMIN"
        | "OPERATOR"
        | "AUDITOR"
        | "SUPERVISOR"
        | "AGENT"
        | "SCHOOL_USER"
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
      notification_channel: ["IN_APP", "EMAIL", "SMS", "PUSH"],
      notification_level: ["INFO", "WARNING", "ERROR"],
      order_status: [
        "UNSUBMITTED",
        "SUBMITTED",
        "QUEUED",
        "PICKUP",
        "ONGOING",
        "ABORTED",
        "DONE",
        "PACKAGING",
        "DELIVERY",
        "COMPLETED",
        "CONFIRMED",
        "AUTO_CONFIRMED",
      ],
      user_role: [
        "ADMIN",
        "OPERATOR",
        "AUDITOR",
        "SUPERVISOR",
        "AGENT",
        "SCHOOL_USER",
      ],
    },
  },
} as const
