import { useCallback, useEffect, useState } from 'react';

import { SAMPLE_LISTINGS } from '@/features/listings/sample';
import type { ListingSummary } from '@/features/listings/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export const LISTING_PHOTOS_BUCKET = 'listing-photos';
const PAGE_SIZE = 30;

type FeedType = 'sell' | 'wanted';

type Row = {
  id: string;
  type: FeedType;
  title: string;
  price_hkd: number | null;
  condition: ListingSummary['condition'];
  status: ListingSummary['status'];
  districts: string[];
  bumped_at: string;
  listing_photos: { storage_path: string; position: number }[] | null;
  seller: { username: string | null } | null;
};

type FeedResult = { items: ListingSummary[]; error: string | null };

/** Fetches one page of a feed. RLS already hides drafts and unapproved listings. */
export async function fetchFeed(type: FeedType): Promise<FeedResult> {
  if (!supabase) {
    return { items: __DEV__ ? SAMPLE_LISTINGS.filter((l) => l.type === type) : [], error: null };
  }
  const { data, error } = await supabase
    .from('listings')
    .select(
      'id,type,title,price_hkd,condition,status,districts,bumped_at,listing_photos(storage_path,position),seller:profiles!listings_seller_id_fkey(username)'
    )
    .eq('type', type)
    .in('status', ['active', 'reserved'])
    .order('bumped_at', { ascending: false })
    .limit(PAGE_SIZE)
    .returns<Row[]>();

  if (error) return { items: [], error: error.message };

  const client = supabase;
  return {
    error: null,
    items: (data ?? []).map((r) => {
      const first = [...(r.listing_photos ?? [])].sort((a, b) => a.position - b.position)[0];
      return {
        id: r.id,
        type: r.type,
        title: r.title,
        price_hkd: r.price_hkd,
        condition: r.condition,
        status: r.status,
        districts: r.districts,
        bumped_at: r.bumped_at,
        photo_url: first ? client.storage.from(LISTING_PHOTOS_BUCKET).getPublicUrl(first.storage_path).data.publicUrl : null,
        seller_username: r.seller?.username ?? null,
      };
    }),
  };
}

/** Feed state keyed by type, so switching tabs shows a loader without setState-in-effect. */
export function useFeed(type: FeedType) {
  const [state, setState] = useState<(FeedResult & { type: FeedType; version: number }) | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchFeed(type).then((result) => {
      if (!cancelled) setState({ ...result, type, version });
    });
    return () => {
      cancelled = true;
    };
  }, [type, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const current = state && state.type === type && state.version === version ? state : null;

  return {
    items: current?.items ?? [],
    error: current?.error ?? null,
    loading: current === null,
    reload,
    isSample: !isSupabaseConfigured,
  };
}
