export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type BillingInterval = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'unknown'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled' | 'inactive'
export type AiRecommendation = 'keep' | 'downgrade' | 'cancel' | 'review'
export type AlertType = 'renewal' | 'trial_ending' | 'price_change' | 'new_detected' | 'cancelled'
export type AlertChannel = 'email' | 'push' | 'in_app'
export type UserRole = 'user' | 'admin'

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
          role: UserRole
          stripe_customer_id: string | null
          subscription_status: SubscriptionStatus
          subscription_id: string | null
          trial_ends_at: string | null
          current_period_end: string | null
          currency: string
          timezone: string
          dark_mode: boolean
          alert_email: boolean
          alert_push: boolean
          alert_renewal_days: number[]
          alert_trial_hours: number[]
          total_subscriptions: number
          total_monthly_spend: number
          total_savings: number
          leak_score: number
          onboarding_completed: boolean
          bank_connected: boolean
          gmail_connected: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          stripe_customer_id?: string | null
          subscription_status?: SubscriptionStatus
          subscription_id?: string | null
          trial_ends_at?: string | null
          current_period_end?: string | null
          currency?: string
          timezone?: string
          dark_mode?: boolean
          alert_email?: boolean
          alert_push?: boolean
          alert_renewal_days?: number[]
          alert_trial_hours?: number[]
          total_subscriptions?: number
          total_monthly_spend?: number
          total_savings?: number
          leak_score?: number
          onboarding_completed?: boolean
          bank_connected?: boolean
          gmail_connected?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: UserRole
          stripe_customer_id?: string | null
          subscription_status?: SubscriptionStatus
          subscription_id?: string | null
          trial_ends_at?: string | null
          current_period_end?: string | null
          currency?: string
          timezone?: string
          dark_mode?: boolean
          alert_email?: boolean
          alert_push?: boolean
          alert_renewal_days?: number[]
          alert_trial_hours?: number[]
          total_subscriptions?: number
          total_monthly_spend?: number
          total_savings?: number
          leak_score?: number
          onboarding_completed?: boolean
          bank_connected?: boolean
          gmail_connected?: boolean
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          name: string
          merchant_name: string | null
          logo_url: string | null
          category: string | null
          website_url: string | null
          amount: number
          currency: string
          billing_interval: BillingInterval
          next_billing_date: string | null
          last_billing_date: string | null
          status: SubscriptionStatus
          is_manual: boolean
          is_free_trial: boolean
          trial_ends_at: string | null
          detected_at: string
          cancelled_at: string | null
          value_score: number | null
          waste_risk: number | null
          recommendation: AiRecommendation | null
          annual_savings_potential: number | null
          ai_reasoning: string | null
          last_analyzed_at: string | null
          confidence: number
          transaction_count: number
          amount_variance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          merchant_name?: string | null
          logo_url?: string | null
          category?: string | null
          website_url?: string | null
          amount: number
          currency?: string
          billing_interval?: BillingInterval
          next_billing_date?: string | null
          last_billing_date?: string | null
          status?: SubscriptionStatus
          is_manual?: boolean
          is_free_trial?: boolean
          trial_ends_at?: string | null
          detected_at?: string
          cancelled_at?: string | null
          value_score?: number | null
          waste_risk?: number | null
          recommendation?: AiRecommendation | null
          annual_savings_potential?: number | null
          ai_reasoning?: string | null
          last_analyzed_at?: string | null
          confidence?: number
          transaction_count?: number
          amount_variance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          merchant_name?: string | null
          logo_url?: string | null
          category?: string | null
          amount?: number
          billing_interval?: BillingInterval
          next_billing_date?: string | null
          last_billing_date?: string | null
          status?: SubscriptionStatus
          value_score?: number | null
          waste_risk?: number | null
          recommendation?: AiRecommendation | null
          annual_savings_potential?: number | null
          ai_reasoning?: string | null
          last_analyzed_at?: string | null
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          plaid_item_id: string | null
          plaid_transaction_id: string | null
          account_id: string | null
          merchant_name: string | null
          name: string
          amount: number
          currency: string
          category: string[] | null
          date: string
          pending: boolean
          is_recurring: boolean
          recurring_group_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plaid_item_id?: string | null
          plaid_transaction_id?: string | null
          account_id?: string | null
          merchant_name?: string | null
          name: string
          amount: number
          currency?: string
          category?: string[] | null
          date: string
          pending?: boolean
          is_recurring?: boolean
          recurring_group_id?: string | null
          created_at?: string
        }
        Update: {
          is_recurring?: boolean
          recurring_group_id?: string | null
        }
      }
      plaid_items: {
        Row: {
          id: string
          user_id: string
          plaid_item_id: string
          access_token_encrypted: string
          institution_id: string | null
          institution_name: string | null
          cursor: string | null
          status: string
          error_code: string | null
          last_synced_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plaid_item_id: string
          access_token_encrypted: string
          institution_id?: string | null
          institution_name?: string | null
          cursor?: string | null
          status?: string
          error_code?: string | null
          last_synced_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          cursor?: string | null
          status?: string
          error_code?: string | null
          last_synced_at?: string | null
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          trial_event_id: string | null
          type: AlertType
          channel: AlertChannel
          title: string
          message: string
          scheduled_for: string
          sent_at: string | null
          read_at: string | null
          dismissed: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          trial_event_id?: string | null
          type: AlertType
          channel?: AlertChannel
          title: string
          message: string
          scheduled_for: string
          sent_at?: string | null
          read_at?: string | null
          dismissed?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          sent_at?: string | null
          read_at?: string | null
          dismissed?: boolean
        }
      }
      ai_analyses: {
        Row: {
          id: string
          user_id: string
          subscription_id: string
          value_score: number
          waste_risk: number
          recommendation: AiRecommendation
          annual_savings_potential: number | null
          reasoning: string
          cancellation_email: string | null
          negotiation_email: string | null
          phone_script: string | null
          chat_script: string | null
          model_used: string | null
          prompt_tokens: number | null
          completion_tokens: number | null
          context_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id: string
          value_score: number
          waste_risk: number
          recommendation: AiRecommendation
          annual_savings_potential?: number | null
          reasoning: string
          cancellation_email?: string | null
          negotiation_email?: string | null
          phone_script?: string | null
          chat_script?: string | null
          model_used?: string | null
          prompt_tokens?: number | null
          completion_tokens?: number | null
          context_data?: Json | null
          created_at?: string
        }
        Update: {
          value_score?: number
          waste_risk?: number
          recommendation?: AiRecommendation
          annual_savings_potential?: number | null
          reasoning?: string
          cancellation_email?: string | null
          negotiation_email?: string | null
          phone_script?: string | null
          chat_script?: string | null
          model_used?: string | null
        }
      }
      savings_events: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          action: string
          previous_amount: number | null
          new_amount: number
          monthly_savings: number
          annual_savings: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          action: string
          previous_amount?: number | null
          new_amount?: number
          monthly_savings: number
          annual_savings: number
          description?: string | null
          created_at?: string
        }
        Update: Record<string, never>
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
          user_agent: string | null
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
          user_agent?: string | null
          created_at?: string
        }
        Update: Record<string, never>
      }
      gmail_connections: {
        Row: {
          id: string
          user_id: string
          email_address: string
          access_token_encrypted: string
          refresh_token_encrypted: string
          token_expiry: string | null
          scopes: string[] | null
          last_scanned_at: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_address: string
          access_token_encrypted: string
          refresh_token_encrypted: string
          token_expiry?: string | null
          scopes?: string[] | null
          last_scanned_at?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: string
          last_scanned_at?: string | null
          updated_at?: string
        }
      }
      trial_events: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          service_name: string
          source_email_subject: string | null
          source_email_from: string | null
          source_email_date: string | null
          detected_end_date: string | null
          user_confirmed_end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          service_name: string
          source_email_subject?: string | null
          source_email_from?: string | null
          source_email_date?: string | null
          detected_end_date?: string | null
          user_confirmed_end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          is_active?: boolean
          user_confirmed_end_date?: string | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      billing_interval: BillingInterval
      subscription_status: SubscriptionStatus
      ai_recommendation: AiRecommendation
      alert_type: AlertType
      alert_channel: AlertChannel
      user_role: UserRole
    }
  }
}
