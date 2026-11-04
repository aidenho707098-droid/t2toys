-- M1 onboarding: usernames, interests, 18+ gate.

-- "Kuen" and "kuen" must not both exist.
create unique index profiles_username_lower_idx on public.profiles (lower(username));

-- Following a sensitive category (airsoft) requires the 18+ confirmation on the profile.
create or replace function public.enforce_interest_rules() returns trigger
language plpgsql as $$
begin
  if exists (select 1 from public.categories where id = new.category_id and sensitive)
     and not exists (select 1 from public.profiles where id = new.user_id and adult_confirmed_at is not null) then
    raise exception 'adult_confirmation_required';
  end if;
  return new;
end $$;
create trigger user_interests_rules before insert on public.user_interests
  for each row execute function public.enforce_interest_rules();

-- Replace the caller's interests in one transaction.
create or replace function public.set_my_interests(category_ids integer[]) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  delete from public.user_interests where user_id = auth.uid();
  insert into public.user_interests (user_id, category_id)
  select auth.uid(), unnest(category_ids)
  on conflict do nothing;
end $$;
grant execute on function public.set_my_interests(integer[]) to authenticated;
