export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          onboarding_completed: boolean
          alert_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          onboarding_completed?: boolean
          alert_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          onboarding_completed?: boolean
          alert_preferences?: Json
          updated_at?: string
        }
      }
      billing_status: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string | null
          status: string
          trial_ends_at: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id?: string | null
          status?: string
          trial_ends_at?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          stripe_customer_id?: string
          stripe_subscription_id?: string | null
          status?: string
          trial_ends_at?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          updated_at?: string
        }
      }
      plaid_items: {
        Row: {
          id: string
          user_id: string
          plaid_item_id: string
          plaid_access_token_encrypted: string
          institution_id: string | null
          institution_name: string | null
          cursor: string | null
          status: string
          error_code: string | null
          last_synced_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plaid_item_id: string
          plaid_access_token_encrypted: string
          institution_id?: string | null
          institution_name?: string | null
          cursor?: string | null
          status?: string
          error_code?: string | null
          last_synced_at?: string | null
          created_at?: string
        }
        Update: {
          cursor?: string | null
          status?: string
          error_code?: string | null
          last_synced_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          plaid_item_id: string | null
          plaid_transaction_id: string | null
          merchant_name: string | null
          merchant_id: string | null
          amount: number
          currency: string
          date: string
          category: string[] | null
          is_recurring: boolean
          recurring_group_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plaid_item_id?: string | null
          plaid_transaction_id?: string | null
          merchant_name?: string | null
          merchant_id?: string | null
          amount: number
          currency?: string
          date: string
          category?: string[] | null
          is_recurring?: boolean
          recurring_group_id?: string | null
          created_at?: string
        }
        Update: {
          is_recurring?: boolean
          recurring_group_id?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          merchant_name: string
          merchant_logo_url: string | null
          normalized_merchant: string | null
          category: string | null
          amount_avg: number
          amount_last: number | null
          currency: string
          billing_cycle: string
          next_billing_date: string | null
          last_billing_date: string | null
          first_seen_date: string | null
          is_active: boolean
          source: string
          detection_confidence: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          merchant_name: string
          merchant_logo_url?: string | null
          normalized_merchant?: string | null
          category?: string | null
          amount_avg: number
          amount_last?: number | null
          currency?: string
          billing_cycle?: string
          next_billing_date?: string | null
          last_billing_date?: string | null
          first_seen_date?: string | null
          is_active?: boolean
          source?: string
          detection_confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          merchant_name?: string
          merchant_logo_url?: string | null
          normalized_merchant?: string | null
          category?: string | null
          amount_avg?: number
          amount_last?: number | null
          billing_cycle?: string
          next_billing_date?: string | null
          last_billing_date?: string | null
          is_active?: boolean
          detection_confidence?: number | null
          updated_at?: string
        }
      }
      ai_analyses: {
        Row: {
          id: string
          user_id: string
          subscription_id: string
          value_score: number | null
          waste_risk: number | null
          recommendation: string | null
          reasoning: string | null
          potential_annual_savings: number | null
          cancellation_email: string | null
          negotiation_email: string | null
          phone_script: string | null
          chat_script: string | null
          model_version: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id: string
          value_score?: number | null
          waste_risk?: number | null
          recommendation?: string | null
          reasoning?: string | null
          potential_annual_savings?: number | null
          cancellation_email?: string | null
          negotiation_email?: string | null
          phone_script?: string | null
          chat_script?: string | null
          model_version?: string | null
          created_at?: string
        }
        Update: {
          value_score?: number | null
          waste_risk?: number | null
          recommendation?: string | null
          reasoning?: string | null
          potential_annual_savings?: number | null
          cancellation_email?: string | null
          negotiation_email?: string | null
          phone_script?: string | null
          chat_script?: string | null
          model_version?: string | null
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          trial_event_id: string | null
          alert_type: string
          title: string
          message: string | null
          trigger_date: string
          is_sent: boolean
          sent_at: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          trial_event_id?: string | null
          alert_type: string
          title: string
          message?: string | null
          trigger_date: string
          is_sent?: boolean
          sent_at?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          is_sent?: boolean
          sent_at?: string | null
          is_read?: boolean
          read_at?: string | null
        }
      }
      savings_events: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          event_type: string
          monthly_savings: number
          annual_savings: number | null
          notes: string | null
          confirmed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          event_type: string
          monthly_savings: number
          annual_savings?: number | null
          notes?: string | null
          confirmed_at?: string
          created_at?: string
        }
        Update: {
          notes?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          metadata: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: Record<string, never>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
