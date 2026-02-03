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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      direct_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          recipient_entity_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          recipient_entity_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          recipient_entity_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_recipient_entity_id_fkey"
            columns: ["recipient_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          about: string | null
          category: string
          claimed_by: string | null
          contact_email: string | null
          created_at: string
          id: string
          image_url: string | null
          is_verified: boolean | null
          metadata: Json | null
          name: string
          normalized_name: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          about?: string | null
          category: string
          claimed_by?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          metadata?: Json | null
          name: string
          normalized_name: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          about?: string | null
          category?: string
          claimed_by?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          metadata?: Json | null
          name?: string
          normalized_name?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      entity_comments: {
        Row: {
          content: string
          created_at: string
          entity_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entity_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_comments_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_follows: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_follows_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_reactions: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_reactions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_reviews: {
        Row: {
          content: string | null
          created_at: string
          entity_id: string
          id: string
          is_positive: boolean
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          entity_id: string
          id?: string
          is_positive: boolean
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          entity_id?: string
          id?: string
          is_positive?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_reviews_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_scores: {
        Row: {
          created_at: string
          decay_applied: boolean | null
          entity_id: string
          evidence: Json | null
          id: string
          last_review_at: string | null
          negative_reactions: number | null
          positive_reactions: number | null
          reviews_analyzed: number | null
          score: number
          search_count: number | null
          summary: string | null
          vibe_check: string | null
        }
        Insert: {
          created_at?: string
          decay_applied?: boolean | null
          entity_id: string
          evidence?: Json | null
          id?: string
          last_review_at?: string | null
          negative_reactions?: number | null
          positive_reactions?: number | null
          reviews_analyzed?: number | null
          score: number
          search_count?: number | null
          summary?: string | null
          vibe_check?: string | null
        }
        Update: {
          created_at?: string
          decay_applied?: boolean | null
          entity_id?: string
          evidence?: Json | null
          id?: string
          last_review_at?: string | null
          negative_reactions?: number | null
          positive_reactions?: number | null
          reviews_analyzed?: number | null
          score?: number
          search_count?: number | null
          summary?: string | null
          vibe_check?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_scores_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_social_links: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          is_verified: boolean | null
          platform: string
          url: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          is_verified?: boolean | null
          platform: string
          url: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          is_verified?: boolean | null
          platform?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_social_links_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_visits: {
        Row: {
          entity_id: string
          id: string
          ip_hash: string | null
          visited_at: string
          visitor_id: string | null
        }
        Insert: {
          entity_id: string
          id?: string
          ip_hash?: string | null
          visited_at?: string
          visitor_id?: string | null
        }
        Update: {
          entity_id?: string
          id?: string
          ip_hash?: string | null
          visited_at?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_visits_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtags: {
        Row: {
          created_at: string
          id: string
          post_count: number | null
          tag: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_count?: number | null
          tag: string
        }
        Update: {
          created_at?: string
          id?: string
          post_count?: number | null
          tag?: string
        }
        Relationships: []
      }
      mai_conversations: {
        Row: {
          answer: string
          created_at: string
          entity_id: string
          id: string
          question: string
          user_id: string | null
        }
        Insert: {
          answer: string
          created_at?: string
          entity_id: string
          id?: string
          question: string
          user_id?: string | null
        }
        Update: {
          answer?: string
          created_at?: string
          entity_id?: string
          id?: string
          question?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mai_conversations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      points_transactions: {
        Row: {
          action_type: string
          amount: number
          created_at: string
          id: string
          reference_id: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          amount: number
          created_at?: string
          id?: string
          reference_id?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          amount?: number
          created_at?: string
          id?: string
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_hashtags: {
        Row: {
          hashtag_id: string
          id: string
          post_id: string
        }
        Insert: {
          hashtag_id: string
          id?: string
          post_id: string
        }
        Update: {
          hashtag_id?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_hashtags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          entity_id: string | null
          id: string
          is_vetted: boolean | null
          updated_at: string
          user_id: string
          vetted_by_ai: boolean | null
          vetted_by_user: string | null
        }
        Insert: {
          content: string
          created_at?: string
          entity_id?: string | null
          id?: string
          is_vetted?: boolean | null
          updated_at?: string
          user_id: string
          vetted_by_ai?: boolean | null
          vetted_by_user?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string | null
          id?: string
          is_vetted?: boolean | null
          updated_at?: string
          user_id?: string
          vetted_by_ai?: boolean | null
          vetted_by_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_claims: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
          verification_data: Json | null
          verification_method: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
          verification_data?: Json | null
          verification_method?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
          verification_data?: Json | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_claims_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_verifications: {
        Row: {
          created_at: string
          id: string
          requester_entity_id: string
          status: string
          target_entity_id: string
          verification_code: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          requester_entity_id: string
          status?: string
          target_entity_id: string
          verification_code: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          requester_entity_id?: string
          status?: string
          target_entity_id?: string
          verification_code?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_verifications_requester_entity_id_fkey"
            columns: ["requester_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verifications_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email_verified: boolean | null
          id: string
          linkedin_verified: boolean | null
          total_reviews: number | null
          total_verifications: number | null
          trust_score: number | null
          twitter_verified: boolean | null
          updated_at: string
          user_id: string
          username: string | null
          verification_score: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean | null
          id?: string
          linkedin_verified?: boolean | null
          total_reviews?: number | null
          total_verifications?: number | null
          trust_score?: number | null
          twitter_verified?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
          verification_score?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email_verified?: boolean | null
          id?: string
          linkedin_verified?: boolean | null
          total_reviews?: number | null
          total_verifications?: number | null
          trust_score?: number | null
          twitter_verified?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verification_score?: number | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string
          entity_id: string | null
          id: string
          query: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          id?: string
          query: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          id?: string
          query?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string
          id: string
          points: number
          total_earned: number
          total_redeemed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points: {
        Args: {
          _action_type: string
          _amount: number
          _reference_id?: string
          _user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
