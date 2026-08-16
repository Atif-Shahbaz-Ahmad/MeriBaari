/**
 * Supabase Database types for MeriBaari.
 * Compatible with `supabase gen types` output shape.
 * Regenerate from the live project when schema evolves:
 *   npx supabase gen types typescript --project-id <id> > supabase/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'customer' | 'business' | 'staff' | 'manager' | 'admin';
export type OrganizationMemberRole = 'owner' | 'manager' | 'staff' | 'viewer';
export type OrganizationStatus = 'active' | 'inactive' | 'suspended';
export type DepartmentStatus = 'active' | 'inactive' | 'paused';
export type ServiceStatus = 'active' | 'inactive' | 'paused';
export type QueueStatus = 'active' | 'open' | 'paused' | 'closed';
export type QueueEntryStatus =
  | 'waiting'
  | 'called'
  | 'serving'
  | 'served'
  | 'completed'
  | 'cancelled'
  | 'skipped'
  | 'missed';
export type TicketStatusDb =
  | 'waiting'
  | 'called'
  | 'serving'
  | 'served'
  | 'skipped'
  | 'cancelled';
export type NotificationTypeDb =
  | 'QUEUE_JOINED'
  | 'TICKET_CALLED'
  | 'TICKET_SERVING'
  | 'TICKET_SERVED'
  | 'TICKET_SKIPPED'
  | 'QUEUE_PAUSED'
  | 'QUEUE_RESUMED'
  | 'QUEUE_CLOSED'
  | 'QUEUE_TURN_APPROACHING'
  | 'QUEUE_CANCELLED'
  | 'CUSTOMER_JOINED'
  | 'SUBSCRIPTION_PAYMENT_SUBMITTED'
  | 'SUBSCRIPTION_APPROVED'
  | 'SUBSCRIPTION_REJECTED'
  | 'SYSTEM';

export type SubscriptionStatusDb =
  | 'draft'
  | 'pending_payment'
  | 'pending_approval'
  | 'active'
  | 'rejected';

export type SubscriptionPaymentStatusDb = 'pending' | 'approved' | 'rejected';
export type SubscriptionPaymentMethodDb = 'bank_transfer' | 'easypaisa';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          avatar_url: string | null;
          role: UserRole | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          role?: UserRole | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          phone?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          role?: UserRole | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      organizations: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          logo_url: string | null;
          description: string;
          category: string;
          address: string;
          city: string;
          phone: string | null;
          email: string | null;
          working_hours: string;
          latitude: number | null;
          longitude: number | null;
          average_wait_time: number;
          is_active: boolean;
          status: OrganizationStatus;
          subscription_status: SubscriptionStatusDb;
          approved_at: string | null;
          approved_by: string | null;
          subscription_submitted_at: string | null;
          payment_rejection_reason: string | null;
          admin_hidden: boolean;
          admin_hidden_reason: string | null;
          admin_hidden_at: string | null;
          admin_hidden_by: string | null;
          rating: number;
          review_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          logo_url?: string | null;
          description?: string;
          category: string;
          address?: string;
          city?: string;
          phone?: string | null;
          email?: string | null;
          working_hours?: string;
          latitude?: number | null;
          longitude?: number | null;
          average_wait_time?: number;
          is_active?: boolean;
          status?: OrganizationStatus;
          subscription_status?: SubscriptionStatusDb;
          approved_at?: string | null;
          approved_by?: string | null;
          subscription_submitted_at?: string | null;
          payment_rejection_reason?: string | null;
          admin_hidden?: boolean;
          admin_hidden_reason?: string | null;
          admin_hidden_at?: string | null;
          admin_hidden_by?: string | null;
          rating?: number;
          review_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'organizations_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organizations_approved_by_fkey';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      branches: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          address: string | null;
          phone: string | null;
          status: OrganizationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          status?: OrganizationStatus;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['branches']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'branches_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      organization_members: {
        Row: {
          user_id: string;
          organization_id: string;
          role: OrganizationMemberRole;
          created_at: string;
        };
        Insert: {
          user_id: string;
          organization_id: string;
          role?: OrganizationMemberRole;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organization_members']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'organization_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organization_members_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      departments: {
        Row: {
          id: string;
          organization_id: string;
          branch_id: string | null;
          name: string;
          description: string;
          icon: string;
          estimated_service_time: number;
          is_active: boolean;
          display_order: number;
          status: DepartmentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id?: string | null;
          name: string;
          description?: string;
          icon?: string;
          estimated_service_time?: number;
          is_active?: boolean;
          display_order?: number;
          status?: DepartmentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'departments_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'departments_branch_id_fkey';
            columns: ['branch_id'];
            isOneToOne: false;
            referencedRelation: 'branches';
            referencedColumns: ['id'];
          },
        ];
      };
      services: {
        Row: {
          id: string;
          department_id: string;
          name: string;
          description: string;
          estimated_duration: number;
          price: number | null;
          is_active: boolean;
          display_order: number;
          status: ServiceStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          department_id: string;
          name: string;
          description?: string;
          estimated_duration?: number;
          price?: number | null;
          is_active?: boolean;
          display_order?: number;
          status?: ServiceStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'services_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
        ];
      };
      queues: {
        Row: {
          id: string;
          organization_id: string;
          department_id: string;
          service_id: string | null;
          current_serving_number: string;
          current_number: string;
          next_number: number;
          status: QueueStatus;
          average_waiting_time: number;
          average_service_time: number;
          total_waiting: number;
          prefix: string;
          ticket_seq: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          department_id: string;
          service_id?: string | null;
          current_serving_number?: string;
          current_number?: string;
          next_number?: number;
          status?: QueueStatus;
          average_waiting_time?: number;
          average_service_time?: number;
          total_waiting?: number;
          prefix?: string;
          ticket_seq?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['queues']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'queues_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'queues_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'queues_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ];
      };
      queue_entries: {
        Row: {
          id: string;
          queue_id: string;
          customer_id: string | null;
          service_id: string;
          ticket_number: string;
          position: number;
          status: QueueEntryStatus;
          joined_at: string;
          called_at: string | null;
          completed_at: string | null;
          served_at: string | null;
          cancelled_at: string | null;
          estimated_wait_minutes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          queue_id: string;
          customer_id?: string | null;
          service_id: string;
          ticket_number: string;
          position?: number;
          status?: QueueEntryStatus;
          joined_at?: string;
          called_at?: string | null;
          completed_at?: string | null;
          served_at?: string | null;
          cancelled_at?: string | null;
          estimated_wait_minutes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['queue_entries']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'queue_entries_queue_id_fkey';
            columns: ['queue_id'];
            isOneToOne: false;
            referencedRelation: 'queues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'queue_entries_customer_id_fkey';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'queue_entries_service_id_fkey';
            columns: ['service_id'];
            isOneToOne: false;
            referencedRelation: 'services';
            referencedColumns: ['id'];
          },
        ];
      };
      tickets: {
        Row: {
          id: string;
          queue_entry_id: string;
          user_id: string | null;
          queue_id: string | null;
          organization_id: string | null;
          department_id: string | null;
          service_id: string | null;
          ticket_number: string | null;
          status: TicketStatusDb;
          qr_code: string;
          generated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          queue_entry_id: string;
          user_id?: string | null;
          queue_id?: string | null;
          organization_id?: string | null;
          department_id?: string | null;
          service_id?: string | null;
          ticket_number?: string | null;
          status?: TicketStatusDb;
          qr_code: string;
          generated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'tickets_queue_entry_id_fkey';
            columns: ['queue_entry_id'];
            isOneToOne: true;
            referencedRelation: 'queue_entries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tickets_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tickets_queue_id_fkey';
            columns: ['queue_id'];
            isOneToOne: false;
            referencedRelation: 'queues';
            referencedColumns: ['id'];
          },
        ];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'favorites_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'favorites_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          ticket_id: string;
          organization_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          organization_id: string;
          user_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          organization_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_ticket_id_fkey';
            columns: ['ticket_id'];
            isOneToOne: true;
            referencedRelation: 'tickets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          type: NotificationTypeDb;
          is_read: boolean;
          created_at: string;
          ticket_id: string | null;
          queue_id: string | null;
          organization_id: string | null;
          read_at: string | null;
          event_key: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          type: NotificationTypeDb;
          is_read?: boolean;
          created_at?: string;
          ticket_id?: string | null;
          queue_id?: string | null;
          organization_id?: string | null;
          read_at?: string | null;
          event_key?: string | null;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_ticket_id_fkey';
            columns: ['ticket_id'];
            isOneToOne: false;
            referencedRelation: 'tickets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_queue_id_fkey';
            columns: ['queue_id'];
            isOneToOne: false;
            referencedRelation: 'queues';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'notifications_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          in_app: boolean;
          push: boolean;
          email: boolean;
          whatsapp: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          in_app?: boolean;
          push?: boolean;
          email?: boolean;
          whatsapp?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database['public']['Tables']['notification_preferences']['Insert']
        >;
        Relationships: [
          {
            foreignKeyName: 'notification_preferences_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: 'android' | 'ios' | 'web';
          device_name: string | null;
          is_active: boolean;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          platform: 'android' | 'ios' | 'web';
          device_name?: string | null;
          is_active?: boolean;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['push_tokens']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'push_tokens_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      business_settings: {
        Row: {
          id: string;
          organization_id: string;
          settings: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          settings?: Json;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['business_settings']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'business_settings_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: true;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_payments: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          amount: number;
          currency: string;
          payment_method: SubscriptionPaymentMethodDb;
          payment_proof_path: string;
          status: SubscriptionPaymentStatusDb;
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          amount: number;
          currency?: string;
          payment_method: SubscriptionPaymentMethodDb;
          payment_proof_path: string;
          status?: SubscriptionPaymentStatusDb;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['subscription_payments']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'subscription_payments_organization_id_fkey';
            columns: ['organization_id'];
            isOneToOne: false;
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscription_payments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscription_payments_reviewed_by_fkey';
            columns: ['reviewed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_org_owner: {
        Args: { org_id: string };
        Returns: boolean;
      };
      is_org_member: {
        Args: { org_id: string };
        Returns: boolean;
      };
      is_org_staff: {
        Args: { org_id: string };
        Returns: boolean;
      };
      is_org_owner_or_manager: {
        Args: { org_id: string };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_organization_customer_visible: {
        Args: { org_id: string };
        Returns: boolean;
      };
      get_queue_join_preview: {
        Args: { p_service_id: string };
        Returns: Json;
      };
      join_queue: {
        Args: { p_service_id: string };
        Returns: Json;
      };
      cancel_my_ticket: {
        Args: { p_ticket_id: string };
        Returns: Json;
      };
      call_next_customer: {
        Args: { p_queue_id: string };
        Returns: Json;
      };
      start_serving_customer: {
        Args: { p_entry_id: string };
        Returns: Json;
      };
      serve_customer: {
        Args: { p_entry_id: string };
        Returns: Json;
      };
      skip_customer: {
        Args: { p_entry_id: string };
        Returns: Json;
      };
      set_queue_status: {
        Args: { p_queue_id: string; p_status: string };
        Returns: Json;
      };
      build_queue_ticket_payload: {
        Args: { p_ticket_id: string };
        Returns: Json;
      };
      register_push_token: {
        Args: {
          p_token: string;
          p_platform: string;
          p_device_name?: string | null;
        };
        Returns: string;
      };
      deactivate_push_token: {
        Args: { p_token: string };
        Returns: undefined;
      };
      deactivate_push_tokens_by_values: {
        Args: { p_tokens: string[] };
        Returns: number;
      };
      ensure_notification_preferences: {
        Args: { p_user_id: string };
        Returns: Database['public']['Tables']['notification_preferences']['Row'];
      };
      set_notification_preference_push: {
        Args: { p_enabled: boolean };
        Returns: Database['public']['Tables']['notification_preferences']['Row'];
      };
      submit_subscription_payment: {
        Args: {
          p_organization_id: string;
          p_payment_method: SubscriptionPaymentMethodDb;
          p_payment_proof_path: string;
          p_amount: number;
          p_currency?: string;
        };
        Returns: string;
      };
      review_subscription_payment: {
        Args: {
          p_payment_id: string;
          p_action: string;
          p_rejection_reason?: string | null;
        };
        Returns: string;
      };
      get_admin_subscription_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      set_organization_admin_visibility: {
        Args: {
          p_organization_id: string;
          p_visible: boolean;
          p_reason?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      organization_member_role: OrganizationMemberRole;
      organization_status: OrganizationStatus;
      department_status: DepartmentStatus;
      service_status: ServiceStatus;
      queue_status: QueueStatus;
      queue_entry_status: QueueEntryStatus;
      ticket_status: TicketStatusDb;
      notification_type: NotificationTypeDb;
      subscription_status: SubscriptionStatusDb;
      subscription_payment_status: SubscriptionPaymentStatusDb;
      subscription_payment_method: SubscriptionPaymentMethodDb;
    };
    CompositeTypes: Record<string, never>;
  };
}

/** Convenience row aliases */
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
export type OrganizationMemberRow =
  Database['public']['Tables']['organization_members']['Row'];
export type DepartmentRow = Database['public']['Tables']['departments']['Row'];
export type ServiceRow = Database['public']['Tables']['services']['Row'];
export type QueueRow = Database['public']['Tables']['queues']['Row'];
export type QueueEntryRow = Database['public']['Tables']['queue_entries']['Row'];
export type TicketRow = Database['public']['Tables']['tickets']['Row'];
export type FavoriteRow = Database['public']['Tables']['favorites']['Row'];
export type ReviewRow = Database['public']['Tables']['reviews']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type PushTokenRow = Database['public']['Tables']['push_tokens']['Row'];
export type NotificationPreferencesRow =
  Database['public']['Tables']['notification_preferences']['Row'];
export type BusinessSettingsRow =
  Database['public']['Tables']['business_settings']['Row'];
export type SubscriptionPaymentRow =
  Database['public']['Tables']['subscription_payments']['Row'];
