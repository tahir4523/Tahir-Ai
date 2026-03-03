import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createClient = () => createClientComponentClient();

export const createServerClient = () =>
  createServerComponentClient({ cookies });

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          plan: 'free' | 'pro';
          usage_count: number;
          usage_reset_at: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          mode: 'nano' | 'pro';
          created_at: string;
          updated_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          model_used: string | null;
          created_at: string;
        };
      };
    };
  };
};
