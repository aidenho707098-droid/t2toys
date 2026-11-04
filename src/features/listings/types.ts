export type ListingStatus = 'draft' | 'active' | 'reserved' | 'sold' | 'removed';
export type ItemCondition = 'new' | 'like_new' | 'good' | 'fair' | 'for_parts';

/** Shape used by feed cards; mirrors a select on public.listings + first photo + seller. */
export type ListingSummary = {
  id: string;
  type: 'sell' | 'wanted';
  title: string;
  price_hkd: number | null;
  condition: ItemCondition | null;
  status: ListingStatus;
  districts: string[];
  bumped_at: string;
  photo_url: string | null;
  seller_username: string | null;
};
