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
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: string[]
          rate_limit_per_hour: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: string[]
          rate_limit_per_hour?: number
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[]
          rate_limit_per_hour?: number
          user_id?: string
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          api_key_id: string | null
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          method: string
          response_code: number | null
          response_time_ms: number | null
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          method: string
          response_code?: number | null
          response_time_ms?: number | null
        }
        Update: {
          api_key_id?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          method?: string
          response_code?: number | null
          response_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_ips: {
        Row: {
          blocked_until: string | null
          created_at: string
          id: string
          ip_hash: string
          is_permanent: boolean
          reason: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_hash: string
          is_permanent?: boolean
          reason: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_hash?: string
          is_permanent?: boolean
          reason?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          message: string
          responded_at: string | null
          responded_by: string | null
          sender_email: string
          sender_name: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message: string
          responded_at?: string | null
          responded_by?: string | null
          sender_email: string
          sender_name: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message?: string
          responded_at?: string | null
          responded_by?: string | null
          sender_email?: string
          sender_name?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_roulettes: {
        Row: {
          access_code: string
          completed_at: string | null
          created_at: string | null
          geo_latitude: number | null
          geo_lock_enabled: boolean | null
          geo_longitude: number | null
          geo_radius_meters: number | null
          host_id: string
          id: string
          min_score_requirement: number | null
          status: string
          timer_seconds: number | null
          title: string
          winners_count: number | null
        }
        Insert: {
          access_code: string
          completed_at?: string | null
          created_at?: string | null
          geo_latitude?: number | null
          geo_lock_enabled?: boolean | null
          geo_longitude?: number | null
          geo_radius_meters?: number | null
          host_id: string
          id?: string
          min_score_requirement?: number | null
          status?: string
          timer_seconds?: number | null
          title: string
          winners_count?: number | null
        }
        Update: {
          access_code?: string
          completed_at?: string | null
          created_at?: string | null
          geo_latitude?: number | null
          geo_lock_enabled?: boolean | null
          geo_longitude?: number | null
          geo_radius_meters?: number | null
          host_id?: string
          id?: string
          min_score_requirement?: number | null
          status?: string
          timer_seconds?: number | null
          title?: string
          winners_count?: number | null
        }
        Relationships: []
      }
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
          {
            foreignKeyName: "direct_messages_recipient_entity_id_fkey"
            columns: ["recipient_entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_votes: {
        Row: {
          created_at: string
          dispute_id: string
          id: string
          reasoning: string | null
          user_id: string
          vote_for_disputer: boolean
        }
        Insert: {
          created_at?: string
          dispute_id: string
          id?: string
          reasoning?: string | null
          user_id: string
          vote_for_disputer: boolean
        }
        Update: {
          created_at?: string
          dispute_id?: string
          id?: string
          reasoning?: string | null
          user_id?: string
          vote_for_disputer?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dispute_votes_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          description: string
          dispute_type: string
          entity_id: string
          evidence_urls: string[] | null
          id: string
          is_resolved_by_voting: boolean | null
          points_awarded: number | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          votes_against_disputer: number | null
          votes_for_disputer: number | null
          voting_deadline: string | null
        }
        Insert: {
          created_at?: string
          description: string
          dispute_type: string
          entity_id: string
          evidence_urls?: string[] | null
          id?: string
          is_resolved_by_voting?: boolean | null
          points_awarded?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          votes_against_disputer?: number | null
          votes_for_disputer?: number | null
          voting_deadline?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          dispute_type?: string
          entity_id?: string
          evidence_urls?: string[] | null
          id?: string
          is_resolved_by_voting?: boolean | null
          points_awarded?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          votes_against_disputer?: number | null
          votes_for_disputer?: number | null
          voting_deadline?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disputes_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
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
          hidden_fields: string[] | null
          id: string
          image_url: string | null
          is_verified: boolean | null
          metadata: Json | null
          name: string
          normalized_name: string
          privacy_level: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          about?: string | null
          category: string
          claimed_by?: string | null
          contact_email?: string | null
          created_at?: string
          hidden_fields?: string[] | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          metadata?: Json | null
          name: string
          normalized_name: string
          privacy_level?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          about?: string | null
          category?: string
          claimed_by?: string | null
          contact_email?: string | null
          created_at?: string
          hidden_fields?: string[] | null
          id?: string
          image_url?: string | null
          is_verified?: boolean | null
          metadata?: Json | null
          name?: string
          normalized_name?: string
          privacy_level?: string
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
          {
            foreignKeyName: "entity_comments_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
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
          {
            foreignKeyName: "entity_follows_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
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
          {
            foreignKeyName: "entity_reactions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
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
          location_verified: boolean | null
          points_staked: number
          stake_status: string | null
          user_id: string
          vote_weight: number | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          entity_id: string
          id?: string
          is_positive: boolean
          location_verified?: boolean | null
          points_staked?: number
          stake_status?: string | null
          user_id: string
          vote_weight?: number | null
        }
        Update: {
          content?: string | null
          created_at?: string
          entity_id?: string
          id?: string
          is_positive?: boolean
          location_verified?: boolean | null
          points_staked?: number
          stake_status?: string | null
          user_id?: string
          vote_weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_reviews_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_reviews_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_score_cache: {
        Row: {
          cached_at: string
          category: string
          entity_name: string
          evidence: Json | null
          expires_at: string
          fun_fact: string | null
          hard_fact: string | null
          hit_count: number
          id: string
          metadata: Json | null
          normalized_name: string
          score: number
          summary: string | null
          vibe_check: string | null
        }
        Insert: {
          cached_at?: string
          category: string
          entity_name: string
          evidence?: Json | null
          expires_at?: string
          fun_fact?: string | null
          hard_fact?: string | null
          hit_count?: number
          id?: string
          metadata?: Json | null
          normalized_name: string
          score: number
          summary?: string | null
          vibe_check?: string | null
        }
        Update: {
          cached_at?: string
          category?: string
          entity_name?: string
          evidence?: Json | null
          expires_at?: string
          fun_fact?: string | null
          hard_fact?: string | null
          hit_count?: number
          id?: string
          metadata?: Json | null
          normalized_name?: string
          score?: number
          summary?: string | null
          vibe_check?: string | null
        }
        Relationships: []
      }
      entity_score_history: {
        Row: {
          change_amount: number | null
          change_reason: string | null
          entity_id: string
          id: string
          recorded_at: string
          score: number
        }
        Insert: {
          change_amount?: number | null
          change_reason?: string | null
          entity_id: string
          id?: string
          recorded_at?: string
          score: number
        }
        Update: {
          change_amount?: number | null
          change_reason?: string | null
          entity_id?: string
          id?: string
          recorded_at?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "entity_score_history_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_score_history_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
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
          {
            foreignKeyName: "entity_scores_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
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
          {
            foreignKeyName: "entity_social_links_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_velocity_locks: {
        Row: {
          entity_id: string
          id: string
          locked_at: string
          reason: string
          score_after: number
          score_before: number
          unlocks_at: string
          velocity_percent: number
        }
        Insert: {
          entity_id: string
          id?: string
          locked_at?: string
          reason: string
          score_after: number
          score_before: number
          unlocks_at: string
          velocity_percent: number
        }
        Update: {
          entity_id?: string
          id?: string
          locked_at?: string
          reason?: string
          score_after?: number
          score_before?: number
          unlocks_at?: string
          velocity_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "entity_velocity_locks_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_velocity_locks_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
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
          {
            foreignKeyName: "entity_visits_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
            referencedColumns: ["id"]
          },
        ]
      }
      event_pulses: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_anonymous: boolean | null
          message: string | null
          pulse_type: string
          roulette_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          pulse_type: string
          roulette_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_anonymous?: boolean | null
          message?: string | null
          pulse_type?: string
          roulette_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_pulses_roulette_id_fkey"
            columns: ["roulette_id"]
            isOneToOne: false
            referencedRelation: "custom_roulettes"
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
      honeypot_logs: {
        Row: {
          created_at: string
          id: string
          ip_hash: string
          page_url: string | null
          triggered_field: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip_hash: string
          page_url?: string | null
          triggered_field?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_hash?: string
          page_url?: string | null
          triggered_field?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      hourly_draws: {
        Row: {
          created_at: string | null
          draw_time: string | null
          id: string
          participant_count: number | null
          prize_amount: number
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          draw_time?: string | null
          id?: string
          participant_count?: number | null
          prize_amount?: number
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          draw_time?: string | null
          id?: string
          participant_count?: number | null
          prize_amount?: number
          winner_id?: string | null
        }
        Relationships: []
      }
      hourly_pool: {
        Row: {
          device_fingerprint: string | null
          hour_slot: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          device_fingerprint?: string | null
          hour_slot: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          device_fingerprint?: string | null
          hour_slot?: string
          id?: string
          joined_at?: string | null
          user_id?: string
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
          {
            foreignKeyName: "mai_conversations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
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
          {
            foreignKeyName: "notifications_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
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
          {
            foreignKeyName: "posts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
            referencedColumns: ["id"]
          },
        ]
      }
      private_share_links: {
        Row: {
          access_level: string
          access_token: string
          created_at: string
          created_by: string
          entity_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          use_count: number
        }
        Insert: {
          access_level?: string
          access_token: string
          created_at?: string
          created_by: string
          entity_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          use_count?: number
        }
        Update: {
          access_level?: string
          access_token?: string
          created_at?: string
          created_by?: string
          entity_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "private_share_links_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_share_links_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
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
          {
            foreignKeyName: "profile_claims_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
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
            foreignKeyName: "profile_verifications_requester_entity_id_fkey"
            columns: ["requester_entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verifications_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_verifications_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          correct_votes: number | null
          country: string | null
          created_at: string
          display_name: string | null
          disputes_lost: number | null
          disputes_won: number | null
          email_subscription: boolean | null
          email_verified: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          linkedin_verified: boolean | null
          location: string | null
          middle_name: string | null
          phone: string | null
          phone_verified: boolean | null
          reputation_tier: string | null
          total_reviews: number | null
          total_verifications: number | null
          total_votes: number | null
          trust_score: number | null
          twitter_verified: boolean | null
          updated_at: string
          user_id: string
          username: string | null
          verification_score: number | null
        }
        Insert: {
          avatar_url?: string | null
          correct_votes?: number | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          disputes_lost?: number | null
          disputes_won?: number | null
          email_subscription?: boolean | null
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          linkedin_verified?: boolean | null
          location?: string | null
          middle_name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          reputation_tier?: string | null
          total_reviews?: number | null
          total_verifications?: number | null
          total_votes?: number | null
          trust_score?: number | null
          twitter_verified?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
          verification_score?: number | null
        }
        Update: {
          avatar_url?: string | null
          correct_votes?: number | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          disputes_lost?: number | null
          disputes_won?: number | null
          email_subscription?: boolean | null
          email_verified?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          linkedin_verified?: boolean | null
          location?: string | null
          middle_name?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          reputation_tier?: string | null
          total_reviews?: number | null
          total_verifications?: number | null
          total_votes?: number | null
          trust_score?: number | null
          twitter_verified?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verification_score?: number | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          action_type: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          action_type?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      roulette_participants: {
        Row: {
          device_fingerprint: string | null
          display_name: string | null
          email: string | null
          id: string
          is_guest: boolean | null
          is_winner: boolean | null
          joined_at: string | null
          roulette_id: string
          user_id: string | null
        }
        Insert: {
          device_fingerprint?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_guest?: boolean | null
          is_winner?: boolean | null
          joined_at?: string | null
          roulette_id: string
          user_id?: string | null
        }
        Update: {
          device_fingerprint?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_guest?: boolean | null
          is_winner?: boolean | null
          joined_at?: string | null
          roulette_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roulette_participants_roulette_id_fkey"
            columns: ["roulette_id"]
            isOneToOne: false
            referencedRelation: "custom_roulettes"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          entity_id: string | null
          id: string
          ip_hash: string | null
          query: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          ip_hash?: string | null
          query: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          entity_id?: string | null
          id?: string
          ip_hash?: string | null
          query?: string
          user_agent?: string | null
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
          {
            foreignKeyName: "search_history_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_disclaimer_acceptances: {
        Row: {
          accepted_at: string
          disclaimer_type: string
          id: string
          ip_hash: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          disclaimer_type: string
          id?: string
          ip_hash?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          disclaimer_type?: string
          id?: string
          ip_hash?: string | null
          user_id?: string
        }
        Relationships: []
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
      widget_tokens: {
        Row: {
          created_at: string
          created_by: string
          domains: string[] | null
          entity_id: string
          id: string
          impression_count: number
          is_active: boolean
          style_config: Json | null
          token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          domains?: string[] | null
          entity_id: string
          id?: string
          impression_count?: number
          is_active?: boolean
          style_config?: Json | null
          token: string
        }
        Update: {
          created_at?: string
          created_by?: string
          domains?: string[] | null
          entity_id?: string
          id?: string
          impression_count?: number
          is_active?: boolean
          style_config?: Json | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "widget_tokens_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "widget_tokens_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities_public"
            referencedColumns: ["id"]
          },
        ]
      }
      winner_badges: {
        Row: {
          badge_type: string
          draw_id: string | null
          earned_at: string | null
          expires_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_type?: string
          draw_id?: string | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_type?: string
          draw_id?: string | null
          earned_at?: string | null
          expires_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "winner_badges_draw_id_fkey"
            columns: ["draw_id"]
            isOneToOne: false
            referencedRelation: "hourly_draws"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      entities_public: {
        Row: {
          about: string | null
          category: string | null
          contact_email: string | null
          created_at: string | null
          id: string | null
          image_url: string | null
          is_verified: boolean | null
          metadata: Json | null
          name: string | null
          normalized_name: string | null
          privacy_level: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          about?: string | null
          category?: string | null
          contact_email?: never
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          is_verified?: boolean | null
          metadata?: Json | null
          name?: string | null
          normalized_name?: string | null
          privacy_level?: string | null
          updated_at?: string | null
          website_url?: never
        }
        Update: {
          about?: string | null
          category?: string | null
          contact_email?: never
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          is_verified?: boolean | null
          metadata?: Json | null
          name?: string | null
          normalized_name?: string | null
          privacy_level?: string | null
          updated_at?: string | null
          website_url?: never
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          reputation_tier: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          reputation_tier?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          reputation_tier?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      roulette_participants_public: {
        Row: {
          display_name: string | null
          id: string | null
          is_guest: boolean | null
          is_winner: boolean | null
          joined_at: string | null
          roulette_id: string | null
        }
        Insert: {
          display_name?: string | null
          id?: string | null
          is_guest?: boolean | null
          is_winner?: boolean | null
          joined_at?: string | null
          roulette_id?: string | null
        }
        Update: {
          display_name?: string | null
          id?: string | null
          is_guest?: boolean | null
          is_winner?: boolean | null
          joined_at?: string | null
          roulette_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roulette_participants_roulette_id_fkey"
            columns: ["roulette_id"]
            isOneToOne: false
            referencedRelation: "custom_roulettes"
            referencedColumns: ["id"]
          },
        ]
      }
      search_analytics: {
        Row: {
          city: string | null
          country: string | null
          date: string | null
          search_count: number | null
          unique_visitors: number | null
        }
        Relationships: []
      }
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
      check_rate_limit: {
        Args: {
          _action_type: string
          _identifier: string
          _max_requests: number
          _window_minutes: number
        }
        Returns: boolean
      }
      check_review_velocity: {
        Args: { _entity_id: string; _new_is_positive: boolean }
        Returns: boolean
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      resolve_dispute_by_voting: {
        Args: { _dispute_id: string; _winner_is_disputer: boolean }
        Returns: undefined
      }
      resolve_vote_stakes: {
        Args: { _entity_id: string; _winning_side: boolean }
        Returns: undefined
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
