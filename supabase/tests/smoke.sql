-- Smoke test for core rules. Runs as the app roles with RLS on.
-- Usage (local Postgres with auth stub, or `supabase test db` once converted to pgTAP):
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/smoke.sql
\set ON_ERROR_STOP 1
begin;

-- Users: seller, buyer, stranger
insert into auth.users (id, phone_confirmed_at) values
  ('00000000-0000-0000-0000-00000000000a', now()),
  ('00000000-0000-0000-0000-00000000000b', now()),
  ('00000000-0000-0000-0000-00000000000c', null);

create temp table r (name text, ok boolean);
grant all on r to authenticated, anon, service_role;

-- helper to act as a user
create or replace function pg_temp.as_user(u text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', u, true);
  execute 'set local role authenticated';
end $$;

-- 1. Seller cannot escalate own role
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
update public.profiles set role = 'admin', username = 'seller_a' where id = auth.uid();
insert into r select 'role escalation blocked', role = 'user' and username = 'seller_a' from public.profiles where id = auth.uid();

-- 2. Airsoft gun listing cannot go active without attestation
do $$ begin
  insert into public.listings (seller_id, category_id, title, price_hkd, status)
  values (auth.uid(), (select id from public.categories where slug = 'airsoft-gbb-pistol'), 'Marui G17 Gen4', 1500, 'active');
  insert into r values ('attestation required', false);
exception when others then
  insert into r values ('attestation required', sqlerrm = 'compliance_attestation_required');
end $$;

-- 3. With attestation it inserts, but moderation is forced to pending even if client says approved
insert into public.listings (id, seller_id, category_id, title, price_hkd, status, moderation_status, compliance_attested_at)
values ('11111111-1111-1111-1111-111111111111', auth.uid(),
        (select id from public.categories where slug = 'airsoft-gbb-pistol'), 'Marui G17 Gen4', 1500, 'active', 'approved', now());
insert into r select 'client cannot self-approve', moderation_status = 'pending' from public.listings where id = '11111111-1111-1111-1111-111111111111';

-- 4. Stranger cannot see a pending listing
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
insert into r select 'pending hidden from others', count(*) = 0 from public.listings;

-- 5. Server approves; now visible to others
reset role; set local role service_role;
update public.listings set moderation_status = 'approved' where id = '11111111-1111-1111-1111-111111111111';
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
insert into r select 'approved visible', count(*) = 1 from public.listings;

-- 6. Buyer opens a conversation and messages; idempotent client_id
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into public.conversations (id, listing_id, buyer_id, seller_id)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
        auth.uid(), '00000000-0000-0000-0000-00000000000a');
insert into public.messages (conversation_id, sender_id, body, client_id)
values ('22222222-2222-2222-2222-222222222222', auth.uid(), '你好！仲有冇貨？', 'dev1-0001');
do $$ begin
  insert into public.messages (conversation_id, sender_id, body, client_id)
  values ('22222222-2222-2222-2222-222222222222', auth.uid(), '你好！仲有冇貨？', 'dev1-0001');
  insert into r values ('duplicate send rejected', false);
exception when unique_violation then
  insert into r values ('duplicate send rejected', true);
end $$;

-- 7. Stranger cannot read the conversation
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
insert into r select 'chat private', count(*) = 0 from public.messages;

-- 8. Review before sale is rejected
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$ begin
  insert into public.reviews (listing_id, reviewer_id, reviewee_id, stars)
  values ('11111111-1111-1111-1111-111111111111', auth.uid(), '00000000-0000-0000-0000-00000000000a', 5);
  insert into r values ('no review before sale', false);
exception when others then
  insert into r values ('no review before sale', true);
end $$;

-- 9. Seller marks sold to buyer; buyer reviews; rating updates
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
update public.listings set status = 'sold', sold_to = '00000000-0000-0000-0000-00000000000b', sold_at = now()
where id = '11111111-1111-1111-1111-111111111111';
insert into r select 'sale keeps approval', moderation_status = 'approved' from public.listings where id = '11111111-1111-1111-1111-111111111111';
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into public.reviews (listing_id, reviewer_id, reviewee_id, stars, comment)
values ('11111111-1111-1111-1111-111111111111', auth.uid(), '00000000-0000-0000-0000-00000000000a', 5, '準時交收，好人');
insert into r select 'rating updated', rating_avg = 5 and rating_count = 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a';

-- 10. Seller edits title → back to pending
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
update public.listings set title = 'Marui G17 Gen4 + 3 mags' where id = '11111111-1111-1111-1111-111111111111';
insert into r select 'edit re-screens', moderation_status = 'pending' from public.listings where id = '11111111-1111-1111-1111-111111111111';

-- 11. Blocked buyer cannot message
insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), '00000000-0000-0000-0000-00000000000b');
reset role; select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
do $$ begin
  insert into public.messages (conversation_id, sender_id, body, client_id)
  values ('22222222-2222-2222-2222-222222222222', auth.uid(), 'hello?', 'dev1-0002');
  insert into r values ('block stops messages', false);
exception when others then
  insert into r values ('block stops messages', true);
end $$;

-- 12. User cannot grant themselves credits
do $$ begin
  insert into public.credit_ledger (user_id, delta, reason) values (auth.uid(), 1000, 'free money');
  insert into r values ('no self-granted credits', false);
exception when others then
  insert into r values ('no self-granted credits', true);
end $$;

reset role;
select name, case when ok then 'PASS' else 'FAIL' end as result from r;
select case when bool_and(ok) then 'ALL PASS' else 'FAILURES' end as summary from r;
rollback;
