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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      tikpay_community_comments: {
        Row: {
          author_avatar_url: string | null
          author_name: string
          body: string
          created_at: string
          id: string
          is_preloaded: boolean
          post_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_name: string
          body: string
          created_at?: string
          id?: string
          is_preloaded?: boolean
          post_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          is_preloaded?: boolean
          post_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tikpay_community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "tikpay_community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tikpay_community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tikpay_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tikpay_community_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tikpay_community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "tikpay_community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tikpay_community_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "tikpay_members"
            referencedColumns: ["id"]
          },
        ]
      }
      tikpay_community_posts: {
        Row: {
          author_avatar_url: string | null
          author_handle: string | null
          author_name: string
          body: string
          comments_count: number
          created_at: string
          id: string
          is_active: boolean
          is_seed_demo: boolean
          likes_count: number
          posted_at: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_handle?: string | null
          author_name: string
          body: string
          comments_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_seed_demo?: boolean
          likes_count?: number
          posted_at?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_handle?: string | null
          author_name?: string
          body?: string
          comments_count?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_seed_demo?: boolean
          likes_count?: number
          posted_at?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tikpay_daily_videos: {
        Row: {
          category: string | null
          channel_avatar_url: string | null
          channel_name: string | null
          channel_url: string | null
          comments_count: number | null
          context: string | null
          created_at: string
          embed_url: string
          external_id: string
          id: string
          is_active: boolean
          likes_count: number | null
          metadata_refreshed_at: string | null
          plan_day: number
          source_url: string
          title: string
          updated_at: string
          video_index: number
        }
        Insert: {
          category?: string | null
          channel_avatar_url?: string | null
          channel_name?: string | null
          channel_url?: string | null
          comments_count?: number | null
          context?: string | null
          created_at?: string
          embed_url: string
          external_id: string
          id?: string
          is_active?: boolean
          likes_count?: number | null
          metadata_refreshed_at?: string | null
          plan_day: number
          source_url: string
          title: string
          updated_at?: string
          video_index: number
        }
        Update: {
          category?: string | null
          channel_avatar_url?: string | null
          channel_name?: string | null
          channel_url?: string | null
          comments_count?: number | null
          context?: string | null
          created_at?: string
          embed_url?: string
          external_id?: string
          id?: string
          is_active?: boolean
          likes_count?: number | null
          metadata_refreshed_at?: string | null
          plan_day?: number
          source_url?: string
          title?: string
          updated_at?: string
          video_index?: number
        }
        Relationships: []
      }
      tikpay_members: {
        Row: {
          active_day: number
          avatar_url: string | null
          balance: number
          completed_days: number
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_admin: boolean
          last_seen_at: string
          next_unlock_at: string | null
          plan_started_on: string
          updated_at: string
        }
        Insert: {
          active_day?: number
          avatar_url?: string | null
          balance?: number
          completed_days?: number
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_admin?: boolean
          last_seen_at?: string
          next_unlock_at?: string | null
          plan_started_on?: string
          updated_at?: string
        }
        Update: {
          active_day?: number
          avatar_url?: string | null
          balance?: number
          completed_days?: number
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_admin?: boolean
          last_seen_at?: string
          next_unlock_at?: string | null
          plan_started_on?: string
          updated_at?: string
        }
        Relationships: []
      }
      tikpay_video_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          member_id: string
          plan_day: number
          progress: number
          reward_amount: number
          reward_claimed: boolean
          updated_at: string
          video_index: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          member_id: string
          plan_day: number
          progress?: number
          reward_amount?: number
          reward_claimed?: boolean
          updated_at?: string
          video_index: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          member_id?: string
          plan_day?: number
          progress?: number
          reward_amount?: number
          reward_claimed?: boolean
          updated_at?: string
          video_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "tikpay_video_progress_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "tikpay_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_tikpay_video_reward_auth: {
        Args: { p_plan_day: number; p_video_index: number }
        Returns: {
          active_day: number
          completed_days: number
          new_balance: number
          next_unlock_at: string
          reward_added: boolean
          reward_amount: number
        }[]
      }
      create_tikpay_community_comment: {
        Args: { p_body: string; p_post_id: string }
        Returns: Json
      }
      delete_tikpay_community_comment: {
        Args: { p_comment_id: string }
        Returns: number
      }
      save_tikpay_video_progress_auth: {
        Args: { p_plan_day: number; p_progress: number; p_video_index: number }
        Returns: {
          saved_progress: number
        }[]
      }
      tikpay_daily_total: { Args: { p_day: number }; Returns: number }
      tikpay_video_reward: {
        Args: { p_day: number; p_video_index: number }
        Returns: number
      }
      toggle_tikpay_community_like: {
        Args: { p_post_id: string }
        Returns: Json
      }
      update_tikpay_profile_avatar: {
        Args: { p_avatar_url: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
