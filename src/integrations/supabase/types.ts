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
      calendar_events: {
        Row: {
          category: string
          created_at: string | null
          display_time: string | null
          end_time: string
          external_id: string | null
          id: string
          is_synced: boolean | null
          start_time: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          display_time?: string | null
          end_time: string
          external_id?: string | null
          id?: string
          is_synced?: boolean | null
          start_time: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          display_time?: string | null
          end_time?: string
          external_id?: string | null
          id?: string
          is_synced?: boolean | null
          start_time?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcard_reviews: {
        Row: {
          created_at: string
          ease_factor: number
          flashcard_id: string
          id: string
          interval_days: number
          last_reviewed_at: string | null
          next_review_at: string
          repetitions: number
          user_id: string
        }
        Insert: {
          created_at?: string
          ease_factor?: number
          flashcard_id: string
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          user_id: string
        }
        Update: {
          created_at?: string
          ease_factor?: number
          flashcard_id?: string
          id?: string
          interval_days?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          repetitions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          answer: string
          card_order: number
          created_at: string
          hint: string | null
          id: string
          learning_unit_id: string | null
          question: string
        }
        Insert: {
          answer: string
          card_order?: number
          created_at?: string
          hint?: string | null
          id?: string
          learning_unit_id?: string | null
          question: string
        }
        Update: {
          answer?: string
          card_order?: number
          created_at?: string
          hint?: string | null
          id?: string
          learning_unit_id?: string | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_learning_unit_id_fkey"
            columns: ["learning_unit_id"]
            isOneToOne: false
            referencedRelation: "learning_units"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_materials: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          study_material_id: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          study_material_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          study_material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_materials_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_materials_study_material_id_fkey"
            columns: ["study_material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          color: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          is_completed: boolean | null
          learning_style: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          learning_style?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_completed?: boolean | null
          learning_style?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inspiration_connections: {
        Row: {
          created_at: string
          goal_id: string
          id: string
          insight_note: string | null
          inspiration_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_id: string
          id?: string
          insight_note?: string | null
          inspiration_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal_id?: string
          id?: string
          insight_note?: string | null
          inspiration_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_connections_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspiration_connections_inspiration_id_fkey"
            columns: ["inspiration_id"]
            isOneToOne: false
            referencedRelation: "inspirations"
            referencedColumns: ["id"]
          },
        ]
      }
      inspirations: {
        Row: {
          connected_goal_id: string | null
          content_summary: string | null
          created_at: string
          description: string | null
          file_path: string | null
          file_type: string | null
          hidden_insight: string | null
          id: string
          insight_strength: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_goal_id?: string | null
          content_summary?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_type?: string | null
          hidden_insight?: string | null
          id?: string
          insight_strength?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_goal_id?: string | null
          content_summary?: string | null
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_type?: string | null
          hidden_insight?: string | null
          id?: string
          insight_strength?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspirations_connected_goal_id_fkey"
            columns: ["connected_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      interests: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_units: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          is_system_content: boolean | null
          study_material_id: string | null
          text: string
          unit_order: number
          unit_title: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_system_content?: boolean | null
          study_material_id?: string | null
          text: string
          unit_order: number
          unit_title: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_system_content?: boolean | null
          study_material_id?: string | null
          text?: string
          unit_order?: number
          unit_title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_units_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "system_learning_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_units_study_material_id_fkey"
            columns: ["study_material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      micro_lessons: {
        Row: {
          created_at: string
          id: string
          learning_style: Database["public"]["Enums"]["learning_style"]
          lessons: Json
          study_material_id: string
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          learning_style: Database["public"]["Enums"]["learning_style"]
          lessons?: Json
          study_material_id: string
          summary: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          learning_style?: Database["public"]["Enums"]["learning_style"]
          lessons?: Json
          study_material_id?: string
          summary?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "micro_lessons_study_material_id_fkey"
            columns: ["study_material_id"]
            isOneToOne: false
            referencedRelation: "study_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          flashcard_reminder_enabled: boolean
          goal_deadline_enabled: boolean
          id: string
          push_enabled: boolean
          study_reminder_enabled: boolean
          study_reminder_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flashcard_reminder_enabled?: boolean
          goal_deadline_enabled?: boolean
          id?: string
          push_enabled?: boolean
          study_reminder_enabled?: boolean
          study_reminder_time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          flashcard_reminder_enabled?: boolean
          goal_deadline_enabled?: boolean
          id?: string
          push_enabled?: boolean
          study_reminder_enabled?: boolean
          study_reminder_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sent_notifications: {
        Row: {
          id: string
          notification_type: string
          reference_id: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_type: string
          reference_id?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_type?: string
          reference_id?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_content: {
        Row: {
          content_payload: Json
          created_at: string | null
          id: string
          learning_style: Database["public"]["Enums"]["learning_style"]
          learning_unit_id: string | null
          tier: number
          user_id: string
        }
        Insert: {
          content_payload: Json
          created_at?: string | null
          id?: string
          learning_style: Database["public"]["Enums"]["learning_style"]
          learning_unit_id?: string | null
          tier: number
          user_id: string
        }
        Update: {
          content_payload?: Json
          created_at?: string | null
          id?: string
          learning_style?: Database["public"]["Enums"]["learning_style"]
          learning_unit_id?: string | null
          tier?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_content_learning_unit_id_fkey"
            columns: ["learning_unit_id"]
            isOneToOne: false
            referencedRelation: "learning_units"
            referencedColumns: ["id"]
          },
        ]
      }
      study_materials: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      system_learning_courses: {
        Row: {
          course_order: number
          created_at: string
          description: string | null
          icon: string | null
          id: string
          title: string
        }
        Insert: {
          course_order?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title: string
        }
        Update: {
          course_order?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      user_learning_preferences: {
        Row: {
          created_at: string
          id: string
          learning_style: Database["public"]["Enums"]["learning_style"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          learning_style?: Database["public"]["Enums"]["learning_style"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          learning_style?: Database["public"]["Enums"]["learning_style"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          created_at: string | null
          id: string
          learning_unit_id: string | null
          status: string
          tier1_completed_at: string | null
          tier2_completed_at: string | null
          tier3_completed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          learning_unit_id?: string | null
          status?: string
          tier1_completed_at?: string | null
          tier2_completed_at?: string | null
          tier3_completed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          learning_unit_id?: string | null
          status?: string
          tier1_completed_at?: string | null
          tier2_completed_at?: string | null
          tier3_completed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_learning_unit_id_fkey"
            columns: ["learning_unit_id"]
            isOneToOne: false
            referencedRelation: "learning_units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          daily_target: string
          goal_type: string
          id: string
          pocket_length: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_target?: string
          goal_type?: string
          id?: string
          pocket_length?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_target?: string
          goal_type?: string
          id?: string
          pocket_length?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      learning_style: "visual" | "auditory" | "reading_writing" | "kinesthetic"
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
      learning_style: ["visual", "auditory", "reading_writing", "kinesthetic"],
    },
  },
} as const
