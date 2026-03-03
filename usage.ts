import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

export async function incrementUsage(userId: string) {
  await supabase.rpc('increment_usage', { user_id: userId });
}

export async function getUserPlan(userId: string): Promise<'free' | 'pro'> {
  const profile = await getUserProfile(userId);
  return profile?.plan ?? 'free';
}
