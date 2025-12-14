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
