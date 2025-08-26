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
      activity_logs: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          description: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"] | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"] | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"] | null
        }
        Relationships: []
      }
      face_matches: {
        Row: {
          confidence_score: number | null
          face_scan_data: Json | null
          id: string
          matched_at: string
          photo_id: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          face_scan_data?: Json | null
          id?: string
          matched_at?: string
          photo_id: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          face_scan_data?: Json | null
          id?: string
          matched_at?: string
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "face_matches_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "face_matches_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          event_id: string
          face_data: Json | null
          faces_detected: number | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          event_id: string
          face_data?: Json | null
          faces_detected?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          event_id?: string
          face_data?: Json | null
          faces_detected?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      photos_safe: {
        Row: {
          created_at: string | null
          event_id: string | null
          faces_detected: number | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string | null
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          faces_detected?: number | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string | null
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          faces_detected?: number | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string | null
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_photo_with_secure_face_data: {
        Args: { photo_row: Database["public"]["Tables"]["photos"]["Row"] }
        Returns: {
          created_at: string
          event_id: string
          face_data: Json
          faces_detected: number
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          uploaded_by: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_editor: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "login"
        | "logout"
        | "event_created"
        | "event_updated"
        | "photo_uploaded"
        | "face_scanned"
        | "user_role_changed"
        | "user_created"
        | "user_deleted"
      event_visibility: "public" | "private" | "hybrid"
      user_role: "admin" | "editor" | "viewer"
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
      activity_type: [
        "login",
        "logout",
        "event_created",
        "event_updated",
        "photo_uploaded",
        "face_scanned",
        "user_role_changed",
        "user_created",
        "user_deleted",
      ],
      event_visibility: ["public", "private", "hybrid"],
      user_role: ["admin", "editor", "viewer"],
    },
  },
} as const
