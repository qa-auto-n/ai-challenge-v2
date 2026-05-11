export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      check_in_logs: {
        Row: {
          action: Database["public"]["Enums"]["checkin_action"];
          checker_user_id: string;
          created_at: string;
          event_id: string;
          id: string;
          rsvp_id: string;
        };
        Insert: {
          action: Database["public"]["Enums"]["checkin_action"];
          checker_user_id: string;
          created_at?: string;
          event_id: string;
          id?: string;
          rsvp_id: string;
        };
        Update: {
          action?: Database["public"]["Enums"]["checkin_action"];
          checker_user_id?: string;
          created_at?: string;
          event_id?: string;
          id?: string;
          rsvp_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "check_in_logs_checker_user_id_fkey";
            columns: ["checker_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "check_in_logs_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "check_in_logs_rsvp_id_fkey";
            columns: ["rsvp_id"];
            isOneToOne: false;
            referencedRelation: "rsvps";
            referencedColumns: ["id"];
          },
        ];
      };
      demo_attendees: {
        Row: {
          email: string;
          name: string;
          user_id: string;
        };
        Insert: {
          email: string;
          name: string;
          user_id: string;
        };
        Update: {
          email?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          capacity: number;
          cover_image_url: string | null;
          created_at: string;
          description: string | null;
          end_at: string;
          hidden: boolean;
          host_id: string;
          id: string;
          online_link: string | null;
          pricing_type: Database["public"]["Enums"]["event_pricing"];
          start_at: string;
          status: Database["public"]["Enums"]["event_status"];
          timezone: string;
          title: string;
          updated_at: string;
          venue_address: string | null;
          visibility: Database["public"]["Enums"]["event_visibility"];
        };
        Insert: {
          capacity?: number;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          end_at: string;
          hidden?: boolean;
          host_id: string;
          id?: string;
          online_link?: string | null;
          pricing_type?: Database["public"]["Enums"]["event_pricing"];
          start_at: string;
          status?: Database["public"]["Enums"]["event_status"];
          timezone?: string;
          title: string;
          updated_at?: string;
          venue_address?: string | null;
          visibility?: Database["public"]["Enums"]["event_visibility"];
        };
        Update: {
          capacity?: number;
          cover_image_url?: string | null;
          created_at?: string;
          description?: string | null;
          end_at?: string;
          hidden?: boolean;
          host_id?: string;
          id?: string;
          online_link?: string | null;
          pricing_type?: Database["public"]["Enums"]["event_pricing"];
          start_at?: string;
          status?: Database["public"]["Enums"]["event_status"];
          timezone?: string;
          title?: string;
          updated_at?: string;
          venue_address?: string | null;
          visibility?: Database["public"]["Enums"]["event_visibility"];
        };
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "hosts";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback: {
        Row: {
          comment: string | null;
          created_at: string;
          event_id: string;
          id: string;
          rating: number;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          rating: number;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          rating?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery_photos: {
        Row: {
          created_at: string;
          event_id: string;
          id: string;
          image_url: string;
          status: Database["public"]["Enums"]["photo_status"];
          uploaded_by_user_id: string;
        };
        Insert: {
          created_at?: string;
          event_id: string;
          id?: string;
          image_url: string;
          status?: Database["public"]["Enums"]["photo_status"];
          uploaded_by_user_id: string;
        };
        Update: {
          created_at?: string;
          event_id?: string;
          id?: string;
          image_url?: string;
          status?: Database["public"]["Enums"]["photo_status"];
          uploaded_by_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gallery_photos_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gallery_photos_uploaded_by_user_id_fkey";
            columns: ["uploaded_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      host_invites: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          expires_at: string | null;
          host_id: string;
          id: string;
          role: Database["public"]["Enums"]["host_role"];
          token: string;
          used_by_user_id: string | null;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          expires_at?: string | null;
          host_id: string;
          id?: string;
          role: Database["public"]["Enums"]["host_role"];
          token: string;
          used_by_user_id?: string | null;
        };
        Update: {
          created_at?: string;
          created_by_user_id?: string;
          expires_at?: string | null;
          host_id?: string;
          id?: string;
          role?: Database["public"]["Enums"]["host_role"];
          token?: string;
          used_by_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "host_invites_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "host_invites_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "hosts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "host_invites_used_by_user_id_fkey";
            columns: ["used_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      host_members: {
        Row: {
          created_at: string;
          host_id: string;
          id: string;
          invite_token: string | null;
          role: Database["public"]["Enums"]["host_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          host_id: string;
          id?: string;
          invite_token?: string | null;
          role: Database["public"]["Enums"]["host_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          host_id?: string;
          id?: string;
          invite_token?: string | null;
          role?: Database["public"]["Enums"]["host_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "host_members_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "hosts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "host_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      hosts: {
        Row: {
          bio: string | null;
          contact_email: string;
          created_at: string;
          id: string;
          logo_url: string | null;
          name: string;
          owner_user_id: string | null;
        };
        Insert: {
          bio?: string | null;
          contact_email: string;
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name: string;
          owner_user_id?: string | null;
        };
        Update: {
          bio?: string | null;
          contact_email?: string;
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          owner_user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "hosts_owner_user_id_fkey";
            columns: ["owner_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          name?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string | null;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          created_at: string;
          id: string;
          reason: string | null;
          reporter_user_id: string;
          status: Database["public"]["Enums"]["report_status"];
          target_id: string;
          target_type: Database["public"]["Enums"]["report_target"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          reason?: string | null;
          reporter_user_id: string;
          status?: Database["public"]["Enums"]["report_status"];
          target_id: string;
          target_type: Database["public"]["Enums"]["report_target"];
        };
        Update: {
          created_at?: string;
          id?: string;
          reason?: string | null;
          reporter_user_id?: string;
          status?: Database["public"]["Enums"]["report_status"];
          target_id?: string;
          target_type?: Database["public"]["Enums"]["report_target"];
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_user_id_fkey";
            columns: ["reporter_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rsvps: {
        Row: {
          checked_in_at: string | null;
          created_at: string;
          event_id: string;
          id: string;
          status: Database["public"]["Enums"]["rsvp_status"];
          ticket_code: string;
          updated_at: string;
          user_id: string;
          waitlist_position: number | null;
        };
        Insert: {
          checked_in_at?: string | null;
          created_at?: string;
          event_id: string;
          id?: string;
          status: Database["public"]["Enums"]["rsvp_status"];
          ticket_code: string;
          updated_at?: string;
          user_id: string;
          waitlist_position?: number | null;
        };
        Update: {
          checked_in_at?: string | null;
          created_at?: string;
          event_id?: string;
          id?: string;
          status?: Database["public"]["Enums"]["rsvp_status"];
          ticket_code?: string;
          updated_at?: string;
          user_id?: string;
          waitlist_position?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "rsvps_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_event_checker_or_host: {
        Args: { _event_id: string; _user_id: string };
        Returns: boolean;
      };
      is_event_host: {
        Args: { _event_id: string; _user_id: string };
        Returns: boolean;
      };
      is_host_member: {
        Args: {
          _host_id: string;
          _role?: Database["public"]["Enums"]["host_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_photo_host: {
        Args: { _photo_id: string; _user_id: string };
        Returns: boolean;
      };
      promote_waitlist: { Args: { _event_id: string }; Returns: undefined };
    };
    Enums: {
      checkin_action: "check_in" | "undo";
      event_pricing: "free" | "paid";
      event_status: "draft" | "published";
      event_visibility: "public" | "unlisted";
      host_role: "host" | "checker";
      photo_status: "pending" | "approved" | "rejected" | "hidden";
      report_status: "open" | "dismissed" | "hidden";
      report_target: "event" | "photo";
      rsvp_status: "going" | "waitlist" | "cancelled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      checkin_action: ["check_in", "undo"],
      event_pricing: ["free", "paid"],
      event_status: ["draft", "published"],
      event_visibility: ["public", "unlisted"],
      host_role: ["host", "checker"],
      photo_status: ["pending", "approved", "rejected", "hidden"],
      report_status: ["open", "dismissed", "hidden"],
      report_target: ["event", "photo"],
      rsvp_status: ["going", "waitlist", "cancelled"],
    },
  },
} as const;
