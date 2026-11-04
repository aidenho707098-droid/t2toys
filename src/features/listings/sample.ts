import type { ListingSummary } from '@/features/listings/types';

/** Shown in development when Supabase is not configured, so UI can be reviewed. Never in production. */
const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

export const SAMPLE_LISTINGS: ListingSummary[] = [
  { id: 's1', type: 'sell', title: 'Marui Glock 17 Gen4 GBB 連 3 個彈匣', price_hkd: 1500, condition: 'like_new', status: 'active', districts: ['旺角'], bumped_at: ago(0.2), photo_url: null, seller_username: 'dustypk88' },
  { id: 's2', type: 'sell', title: 'RG 1/144 RX-78-2 Ver.2.0 未砌', price_hkd: 280, condition: 'new', status: 'active', districts: ['觀塘'], bumped_at: ago(3), photo_url: null, seller_username: 'gunpla_hk' },
  { id: 's3', type: 'sell', title: 'LEGO 75192 Millennium Falcon UCS 全新未開', price_hkd: 6200, condition: 'new', status: 'reserved', districts: ['沙田'], bumped_at: ago(26), photo_url: null, seller_username: 'brickfan' },
  { id: 's4', type: 'wanted', title: '收 WE SVD steel version', price_hkd: 8000, condition: null, status: 'active', districts: ['荃灣'], bumped_at: ago(5), photo_url: null, seller_username: 'alan855' },
  { id: 's5', type: 'sell', title: 'DJI Mini 4 Pro 套裝連 3 粒電', price_hkd: null, condition: 'good', status: 'active', districts: ['銅鑼灣'], bumped_at: ago(50), photo_url: null, seller_username: 'skyhk' },
  { id: 's6', type: 'sell', title: 'Pokémon TCG 151 BOX 日版', price_hkd: 950, condition: 'new', status: 'sold', districts: ['太子'], bumped_at: ago(80), photo_url: null, seller_username: 'cardking' },
];
