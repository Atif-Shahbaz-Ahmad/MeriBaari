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
export type QueueStatus = 'active' | 'paused' | 'closed';
export type QueueEntryStatus =
  | 'waiting'
  | 'called'
  | 'serving'
  | 'completed'
  | 'cancelled'
  | 'skipped'
  | 'missed';
export type NotificationTypeDb =
  | 'turn_soon'
  | 'turn_next'
  | 'queue_delayed'
  | 'queue_completed'
  | 'counter_changed'
  | 'queue_cancelled'
  | 'org_nearby'
  | 'joined'
  | 'reminder'
  | 'promo';

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
          name: string;
          logo: string | null;
          description: string;
          category: string;
          address: string;
          phone: string | null;
          email: string | null;
          working_hours: string;
          status: OrganizationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo?: string | null;
          description?: string;
          category: string;
          address?: string;
          phone?: string | null;
          email?: string | null;
          working_hours?: string;
          status?: OrganizationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
        Relationships: [];
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
          estimated_service_time: number;
          status: DepartmentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          branch_id?: string | null;
          name: string;
          estimated_service_time?: number;
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
          department_id: string;
          current_serving_number: string;
          status: QueueStatus;
          average_waiting_time: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          department_id: string;
          current_serving_number?: string;
          status?: QueueStatus;
          average_waiting_time?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['queues']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'queues_department_id_fkey';
            columns: ['department_id'];
            isOneToOne: false;
            referencedRelation: 'departments';
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
          cancelled_at: string | null;
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
          cancelled_at?: string | null;
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
          qr_code: string;
          generated_at: string;
        };
        Insert: {
          id?: string;
          queue_entry_id: string;
          qr_code: string;
          generated_at?: string;
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
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string;
          type: NotificationTypeDb;
          is_read?: boolean;
          created_at?: string;
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
    };
    Views: Record<string, never>;
    Functions: {
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
    };
    Enums: {
      user_role: UserRole;
      organization_member_role: OrganizationMemberRole;
      organization_status: OrganizationStatus;
      department_status: DepartmentStatus;
      service_status: ServiceStatus;
      queue_status: QueueStatus;
      queue_entry_status: QueueEntryStatus;
      notification_type: NotificationTypeDb;
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
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type BusinessSettingsRow =
  Database['public']['Tables']['business_settings']['Row'];
