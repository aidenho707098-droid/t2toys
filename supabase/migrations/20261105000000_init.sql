-- t2 Toys v2 — initial schema
-- Source of truth for the data model. See docs/SPEC.md §7.

create extension if not exists pg_trgm;

-- ───────────────────────── enums ─────────────────────────
create type listing_type as enum ('sell', 'wanted');
create type listing_status as enum ('draft', 'active', 'reserved', 'sold', 'removed');
create type item_condition as enum ('new', 'like_new', 'good', 'fair', 'for_parts');
create type moderation_status as enum ('pending', 'approved', 'needs_review', 'rejected');
create type message_kind as enum ('text', 'photo', 'offer', 'system');
create type offer_state as enum ('open', 'accepted', 'declined', 'withdrawn');
create type report_target as enum ('listing', 'user', 'message');
create type report_state as enum ('open', 'actioned', 'dismissed');
create type user_role as enum ('user', 'moderator', 'admin');

-- ───────────────────────── helpers ─────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────────────────── profiles ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique check (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 40),
  avatar_path text,
  bio text check (char_length(bio) <= 300),
  locale text not null default 'zh-HK' check (locale in ('zh-HK', 'en')),
  phone_verified boolean not null default false,
  role user_role not null default 'user',
  is_suspended boolean not null default false,
  adult_confirmed_at timestamptz,          -- 18+ gate for sensitive categories
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  legacy_user_id text unique,              -- id in the old t2 system (migration)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Create a profile row whenever an auth user is created.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone_verified)
  values (new.id, new.phone_confirmed_at is not null);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

-- True for moderators and for server-side code (service role, security definer functions).
-- Plain app users run as 'authenticated' or 'anon'.
create or replace function public.is_privileged() returns boolean
language sql stable as $$
  select current_user not in ('authenticated', 'anon') or public.is_moderator();
$$;

-- Users may update their own profile but not privileged columns.
create or replace function public.protect_profile_columns() returns trigger
language plpgsql as $$
begin
  if not public.is_privileged() then
    new.role := old.role;
    new.is_suspended := old.is_suspended;
    new.rating_avg := old.rating_avg;
    new.rating_count := old.rating_count;
    new.phone_verified := old.phone_verified;
    new.legacy_user_id := old.legacy_user_id;
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- ───────────────────────── categories ─────────────────────────
create table public.categories (
  id serial primary key,
  parent_id integer references public.categories (id) on delete cascade,
  slug text not null unique,
  name_zh text not null,
  name_en text not null,
  icon text,
  sensitive boolean not null default false,            -- hidden from feeds until followed + 18+
  requires_compliance boolean not null default false,  -- attestation required on listing
  sort integer not null default 0
);

create table public.user_interests (
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id integer not null references public.categories (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

-- ───────────────────────── listings ─────────────────────────
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  type listing_type not null default 'sell',
  category_id integer not null references public.categories (id),
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 2000),
  price_hkd integer check (price_hkd >= 0),   -- null = negotiable (議價)
  condition item_condition,
  status listing_status not null default 'draft',
  moderation_status moderation_status not null default 'pending',
  moderation_reason text,
  districts text[] not null default '{}',     -- HK district / MTR station codes
  allows_delivery boolean not null default false,
  compliance_attested_at timestamptz,
  bumped_at timestamptz not null default now(),
  sold_to uuid references public.profiles (id),
  sold_at timestamptz,
  legacy_listing_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listings_feed_idx on public.listings (category_id, bumped_at desc)
  where status in ('active', 'reserved') and moderation_status = 'approved';
create index listings_seller_idx on public.listings (seller_id, created_at desc);
create index listings_title_trgm on public.listings using gin (title gin_trgm_ops);
create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();

-- Compliance: listings in a requires_compliance category cannot go active without attestation.
create or replace function public.enforce_listing_rules() returns trigger
language plpgsql as $$
declare
  needs_attest boolean;
begin
  select c.requires_compliance or coalesce(p.requires_compliance, false)
    into needs_attest
  from public.categories c
  left join public.categories p on p.id = c.parent_id
  where c.id = new.category_id;

  if new.status = 'active' and needs_attest and new.compliance_attested_at is null then
    raise exception 'compliance_attestation_required';
  end if;

  -- Only server/moderators change moderation outcome.
  if tg_op = 'INSERT' and not public.is_privileged() then
    new.moderation_status := 'pending';
    new.moderation_reason := null;
  end if;

  if tg_op = 'UPDATE' and not public.is_privileged() then
    new.moderation_status := old.moderation_status;
    new.moderation_reason := old.moderation_reason;
  end if;

  -- Any content edit by the seller sends the listing back to screening.
  if tg_op = 'UPDATE' and not public.is_privileged()
     and (new.title, new.description, new.category_id) is distinct from (old.title, old.description, old.category_id) then
    new.moderation_status := 'pending';
  end if;
  return new;
end $$;
create trigger listings_rules before insert or update on public.listings
  for each row execute function public.enforce_listing_rules();

create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_path text not null,
  position smallint not null check (position between 0 and 19),
  width integer,
  height integer,
  unique (listing_id, position)
);

create table public.saved_listings (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  query text not null default '',
  filters jsonb not null default '{}',
  notify boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

-- ───────────────────────── chat ─────────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  buyer_last_read_at timestamptz,
  seller_last_read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);
create index conversations_buyer_idx on public.conversations (buyer_id, last_message_at desc);
create index conversations_seller_idx on public.conversations (seller_id, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  kind message_kind not null default 'text',
  body text check (char_length(body) <= 2000),
  photo_path text,
  offer_hkd integer check (offer_hkd >= 0),
  offer_state offer_state,
  client_id text,                -- idempotency key from the device; prevents duplicate sends
  created_at timestamptz not null default now(),
  unique (conversation_id, client_id),
  check (
    (kind = 'text'  and body is not null) or
    (kind = 'photo' and photo_path is not null) or
    (kind = 'offer' and offer_hkd is not null and offer_state is not null) or
    (kind = 'system')
  )
);
create index messages_conv_idx on public.messages (conversation_id, created_at);

create or replace function public.bump_conversation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.conversations set last_message_at = new.created_at
  where id = new.conversation_id;
  return new;
end $$;
create trigger messages_bump after insert on public.messages
  for each row execute function public.bump_conversation();

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create or replace function public.is_blocked_between(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- ───────────────────────── reviews ─────────────────────────
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewee_id uuid not null references public.profiles (id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  tags text[] not null default '{}',
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (listing_id, reviewer_id),
  check (reviewer_id <> reviewee_id)
);

-- A review is allowed only between seller and the buyer the item was sold to, within 14 days.
create or replace function public.can_review(p_listing uuid, p_reviewer uuid, p_reviewee uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.listings l
    where l.id = p_listing
      and l.status = 'sold'
      and l.sold_to is not null
      and l.sold_at > now() - interval '14 days'
      and (
        (p_reviewer = l.seller_id and p_reviewee = l.sold_to) or
        (p_reviewer = l.sold_to and p_reviewee = l.seller_id)
      )
  );
$$;

create or replace function public.refresh_rating() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles p set
    rating_avg = coalesce((select round(avg(stars)::numeric, 2) from public.reviews where reviewee_id = new.reviewee_id), 0),
    rating_count = (select count(*) from public.reviews where reviewee_id = new.reviewee_id)
  where p.id = new.reviewee_id;
  return new;
end $$;
create trigger reviews_rating after insert on public.reviews
  for each row execute function public.refresh_rating();

-- ───────────────────────── trust & safety ─────────────────────────
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type report_target not null,
  target_id uuid not null,
  reason text not null check (reason in ('prohibited_item', 'real_firearm', 'scam', 'harassment', 'spam', 'wrong_category', 'other')),
  details text check (char_length(details) <= 1000),
  state report_state not null default 'open',
  created_at timestamptz not null default now()
);

create table public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete cascade,
  actor text not null,            -- 'ai' or moderator uuid
  outcome moderation_status not null,
  reason text,
  model text,
  raw jsonb,
  created_at timestamptz not null default now()
);

-- ───────────────────────── money ─────────────────────────
-- Written only by Edge Functions (RevenueCat webhook, migration). Read-only for owners.
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  store text not null check (store in ('app_store', 'play_store', 'legacy')),
  product_id text not null,
  transaction_id text not null unique,
  amount_minor integer,
  currency text,
  status text not null check (status in ('pending', 'granted', 'refunded', 'failed')),
  raw jsonb,
  created_at timestamptz not null default now()
);

create table public.credit_ledger (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason text not null,           -- 'legacy_migration', 'boost', 'refund', 'pro_monthly'
  ref_id text,
  created_at timestamptz not null default now()
);
create index credit_ledger_user_idx on public.credit_ledger (user_id);

create or replace view public.credit_balances with (security_invoker = true) as
  select user_id, sum(delta)::integer as balance from public.credit_ledger group by user_id;

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.user_interests enable row level security;
alter table public.listings enable row level security;
alter table public.listing_photos enable row level security;
alter table public.saved_listings enable row level security;
alter table public.saved_searches enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.blocks enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_events enable row level security;
alter table public.purchases enable row level security;
alter table public.credit_ledger enable row level security;

-- profiles: public read, self update
create policy profiles_read on public.profiles for select using (true);
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid() or public.is_moderator()) with check (id = auth.uid() or public.is_moderator());

-- categories: public read, moderators write
create policy categories_read on public.categories for select using (true);
create policy categories_write on public.categories for all
  using (public.is_moderator()) with check (public.is_moderator());

-- interests: own rows
create policy interests_own on public.user_interests for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- listings: public sees approved, non-draft; seller sees own; moderators see all
create policy listings_read on public.listings for select using (
  (status in ('active', 'reserved', 'sold') and moderation_status = 'approved')
  or seller_id = auth.uid()
  or public.is_moderator()
);
create policy listings_insert on public.listings for insert with check (
  seller_id = auth.uid()
  and not exists (select 1 from public.profiles where id = auth.uid() and is_suspended)
);
create policy listings_update on public.listings for update
  using (seller_id = auth.uid() or public.is_moderator())
  with check (seller_id = auth.uid() or public.is_moderator());
create policy listings_delete on public.listings for delete using (seller_id = auth.uid());

-- photos follow their listing
create policy photos_read on public.listing_photos for select using (
  exists (select 1 from public.listings l where l.id = listing_id)
);
create policy photos_write on public.listing_photos for all
  using (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.seller_id = auth.uid()));

create policy saved_listings_own on public.saved_listings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_searches_own on public.saved_searches for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- conversations: participants only; buyer starts one, never with a blocked user
create policy conversations_read on public.conversations for select
  using (auth.uid() in (buyer_id, seller_id) or public.is_moderator());
create policy conversations_insert on public.conversations for insert with check (
  buyer_id = auth.uid()
  and seller_id = (select l.seller_id from public.listings l where l.id = listing_id)
  and not public.is_blocked_between(buyer_id, seller_id)
);
create policy conversations_update_read on public.conversations for update
  using (auth.uid() in (buyer_id, seller_id)) with check (auth.uid() in (buyer_id, seller_id));

-- messages: participants read; sender inserts as self, not when blocked
create policy messages_read on public.messages for select using (
  exists (select 1 from public.conversations c
          where c.id = conversation_id and (auth.uid() in (c.buyer_id, c.seller_id) or public.is_moderator()))
);
create policy messages_insert on public.messages for insert with check (
  sender_id = auth.uid()
  and kind <> 'system'
  and exists (select 1 from public.conversations c
              where c.id = conversation_id
                and auth.uid() in (c.buyer_id, c.seller_id)
                and not public.is_blocked_between(c.buyer_id, c.seller_id))
);

create policy blocks_own on public.blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy reviews_read on public.reviews for select using (true);
create policy reviews_insert on public.reviews for insert with check (
  reviewer_id = auth.uid() and public.can_review(listing_id, reviewer_id, reviewee_id)
);

create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid());
create policy reports_read on public.reports for select
  using (reporter_id = auth.uid() or public.is_moderator());
create policy reports_moderate on public.reports for update
  using (public.is_moderator()) with check (public.is_moderator());

create policy moderation_read on public.moderation_events for select using (public.is_moderator());

create policy purchases_read_own on public.purchases for select using (user_id = auth.uid());
create policy ledger_read_own on public.credit_ledger for select using (user_id = auth.uid());

-- ───────────────────────── realtime ─────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;
