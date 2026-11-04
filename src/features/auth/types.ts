export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  bio: string | null;
  locale: 'zh-HK' | 'en';
  phone_verified: boolean;
  role: 'user' | 'moderator' | 'admin';
  is_suspended: boolean;
  adult_confirmed_at: string | null;
  rating_avg: number;
  rating_count: number;
  created_at: string;
};

export const PROFILE_COLUMNS =
  'id,username,display_name,avatar_path,bio,locale,phone_verified,role,is_suspended,adult_confirmed_at,rating_avg,rating_count,created_at';
