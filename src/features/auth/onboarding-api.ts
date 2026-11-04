import { supabase } from '@/lib/supabase';

export type SaveResult = { ok: true } | { ok: false; reason: 'taken' | 'adult_required' | 'error'; message?: string };

export async function saveUsername(userId: string, username: string): Promise<SaveResult> {
  if (!supabase) return { ok: false, reason: 'error', message: 'not_configured' };
  const { error } = await supabase.from('profiles').update({ username }).eq('id', userId);
  if (!error) return { ok: true };
  if (error.code === '23505') return { ok: false, reason: 'taken' };
  return { ok: false, reason: 'error', message: error.message };
}

export async function loadMyInterests(userId: string): Promise<number[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('user_interests').select('category_id').eq('user_id', userId);
  return (data ?? []).map((r: { category_id: number }) => r.category_id);
}

/** Records the 18+ confirmation (if given) and then replaces interests atomically. */
export async function saveInterests(userId: string, categoryIds: number[], confirmAdult: boolean): Promise<SaveResult> {
  if (!supabase) return { ok: false, reason: 'error', message: 'not_configured' };
  if (confirmAdult) {
    const { error } = await supabase
      .from('profiles')
      .update({ adult_confirmed_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) return { ok: false, reason: 'error', message: error.message };
  }
  const { error } = await supabase.rpc('set_my_interests', { category_ids: categoryIds });
  if (!error) return { ok: true };
  if (error.message.includes('adult_confirmation_required')) return { ok: false, reason: 'adult_required' };
  return { ok: false, reason: 'error', message: error.message };
}
