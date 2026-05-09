
-- Enums
create type public.host_role as enum ('host', 'checker');
create type public.event_visibility as enum ('public', 'unlisted');
create type public.event_status as enum ('draft', 'published');
create type public.event_pricing as enum ('free', 'paid');
create type public.rsvp_status as enum ('going', 'waitlist', 'cancelled');
create type public.photo_status as enum ('pending', 'approved', 'rejected', 'hidden');
create type public.report_target as enum ('event', 'photo');
create type public.report_status as enum ('open', 'dismissed', 'hidden');
create type public.checkin_action as enum ('check_in', 'undo');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- hosts
create table public.hosts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  bio text,
  contact_email text not null,
  owner_user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.hosts enable row level security;

-- host_members
create table public.host_members (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.host_role not null,
  invite_token text,
  created_at timestamptz not null default now(),
  unique (host_id, user_id, role)
);
alter table public.host_members enable row level security;
create index on public.host_members (user_id);
create index on public.host_members (host_id);

-- events
create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts(id) on delete cascade,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null default 'UTC',
  venue_address text,
  online_link text,
  capacity integer not null default 50,
  cover_image_url text,
  visibility public.event_visibility not null default 'public',
  status public.event_status not null default 'draft',
  pricing_type public.event_pricing not null default 'free',
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.events enable row level security;
create index on public.events (host_id);
create index on public.events (status, visibility, hidden);

-- rsvps
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.rsvp_status not null,
  ticket_code text not null unique,
  checked_in_at timestamptz,
  waitlist_position integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.rsvps enable row level security;
create unique index rsvps_active_unique on public.rsvps (event_id, user_id) where status <> 'cancelled';
create index on public.rsvps (event_id, status);

-- gallery_photos
create table public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  uploaded_by_user_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  status public.photo_status not null default 'pending',
  created_at timestamptz not null default now()
);
alter table public.gallery_photos enable row level security;

-- feedback
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);
alter table public.feedback enable row level security;

-- reports
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.profiles(id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);
alter table public.reports enable row level security;

-- check_in_logs
create table public.check_in_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  rsvp_id uuid not null references public.rsvps(id) on delete cascade,
  checker_user_id uuid not null references public.profiles(id) on delete cascade,
  action public.checkin_action not null,
  created_at timestamptz not null default now()
);
alter table public.check_in_logs enable row level security;

-- host_invites
create table public.host_invites (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.hosts(id) on delete cascade,
  role public.host_role not null,
  token text not null unique,
  created_by_user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  used_by_user_id uuid references public.profiles(id) on delete set null
);
alter table public.host_invites enable row level security;

-- Helper functions (security definer to avoid recursion)
create or replace function public.is_host_member(_user_id uuid, _host_id uuid, _role public.host_role default null)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.host_members
    where user_id = _user_id and host_id = _host_id
      and (_role is null or role = _role)
  );
$$;

create or replace function public.is_event_host(_user_id uuid, _event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.events e
    join public.host_members m on m.host_id = e.host_id
    where e.id = _event_id and m.user_id = _user_id and m.role = 'host'
  );
$$;

create or replace function public.is_event_checker_or_host(_user_id uuid, _event_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.events e
    join public.host_members m on m.host_id = e.host_id
    where e.id = _event_id and m.user_id = _user_id
  );
$$;

-- Profile auto-create trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at triggers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger events_updated_at before update on public.events
  for each row execute function public.touch_updated_at();
create trigger rsvps_updated_at before update on public.rsvps
  for each row execute function public.touch_updated_at();

-- RSVP placement: assign status + ticket_code on insert
create or replace function public.place_rsvp()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  cap int;
  going_count int;
  next_pos int;
begin
  if new.ticket_code is null or new.ticket_code = '' then
    new.ticket_code := 'CP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  end if;

  select capacity into cap from public.events where id = new.event_id;
  select count(*) into going_count from public.rsvps where event_id = new.event_id and status = 'going';

  if new.status is null or new.status = 'going' then
    if going_count < cap then
      new.status := 'going';
      new.waitlist_position := null;
    else
      new.status := 'waitlist';
      select coalesce(max(waitlist_position), 0) + 1 into next_pos from public.rsvps where event_id = new.event_id and status = 'waitlist';
      new.waitlist_position := next_pos;
    end if;
  end if;
  return new;
end;
$$;

create trigger rsvps_place before insert on public.rsvps
  for each row execute function public.place_rsvp();

-- Promote waitlist when a going RSVP is cancelled or capacity increases
create or replace function public.promote_waitlist(_event_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
declare
  cap int;
  going_count int;
  next_id uuid;
begin
  select capacity into cap from public.events where id = _event_id;
  loop
    select count(*) into going_count from public.rsvps where event_id = _event_id and status = 'going';
    exit when going_count >= cap;
    select id into next_id from public.rsvps
      where event_id = _event_id and status = 'waitlist'
      order by waitlist_position asc nulls last, created_at asc limit 1;
    exit when next_id is null;
    update public.rsvps set status = 'going', waitlist_position = null where id = next_id;
  end loop;
end;
$$;

create or replace function public.on_rsvp_update()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if old.status = 'going' and new.status = 'cancelled' then
    perform public.promote_waitlist(new.event_id);
  end if;
  return new;
end;
$$;

create trigger rsvps_after_update after update on public.rsvps
  for each row execute function public.on_rsvp_update();

create or replace function public.on_event_capacity_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.capacity > old.capacity then
    perform public.promote_waitlist(new.id);
  end if;
  return new;
end;
$$;

create trigger events_capacity_change after update of capacity on public.events
  for each row execute function public.on_event_capacity_change();

-- ============== RLS POLICIES ==============

-- profiles: anyone authenticated can read, users update their own; insert handled by trigger
create policy "profiles readable by authenticated" on public.profiles
  for select to authenticated using (true);
create policy "users update own profile" on public.profiles
  for update to authenticated using (id = auth.uid());

-- hosts: public read; owner can update; authenticated users can insert (themselves as owner)
create policy "hosts public read" on public.hosts
  for select using (true);
create policy "users create host" on public.hosts
  for insert to authenticated with check (owner_user_id = auth.uid());
create policy "host members can update" on public.hosts
  for update to authenticated using (public.is_host_member(auth.uid(), id, 'host'));
create policy "host owner can delete" on public.hosts
  for delete to authenticated using (owner_user_id = auth.uid());

-- host_members: members of host can read; host role can manage
create policy "host_members read by member" on public.host_members
  for select to authenticated using (
    user_id = auth.uid() or public.is_host_member(auth.uid(), host_id, 'host')
  );
create policy "host_members managed by host role" on public.host_members
  for all to authenticated
  using (public.is_host_member(auth.uid(), host_id, 'host') or user_id = auth.uid())
  with check (public.is_host_member(auth.uid(), host_id, 'host') or user_id = auth.uid());

-- events: public can see published+public+not hidden; host members see all their host's events; host role can write
create policy "events public read" on public.events
  for select using (
    (status = 'published' and visibility = 'public' and hidden = false)
    or (auth.uid() is not null and public.is_host_member(auth.uid(), host_id))
  );
create policy "events unlisted readable by direct id" on public.events
  for select using (status = 'published' and visibility = 'unlisted' and hidden = false);
create policy "host role can insert events" on public.events
  for insert to authenticated with check (public.is_host_member(auth.uid(), host_id, 'host'));
create policy "host role can update events" on public.events
  for update to authenticated using (public.is_host_member(auth.uid(), host_id, 'host'));
create policy "host role can delete events" on public.events
  for delete to authenticated using (public.is_host_member(auth.uid(), host_id, 'host'));

-- rsvps: user reads own; event host/checker reads all; user inserts own; user cancels own; host updates
create policy "rsvps user read own" on public.rsvps
  for select to authenticated using (
    user_id = auth.uid() or public.is_event_checker_or_host(auth.uid(), event_id)
  );
create policy "rsvps user insert own" on public.rsvps
  for insert to authenticated with check (user_id = auth.uid());
create policy "rsvps user update own or staff" on public.rsvps
  for update to authenticated using (
    user_id = auth.uid() or public.is_event_checker_or_host(auth.uid(), event_id)
  );

-- gallery_photos: public read approved; uploader reads own; host manages
create policy "gallery public read approved" on public.gallery_photos
  for select using (status = 'approved');
create policy "gallery uploader read own" on public.gallery_photos
  for select to authenticated using (uploaded_by_user_id = auth.uid() or public.is_event_host(auth.uid(), event_id));
create policy "gallery uploader insert" on public.gallery_photos
  for insert to authenticated with check (uploaded_by_user_id = auth.uid());
create policy "gallery host manage" on public.gallery_photos
  for update to authenticated using (public.is_event_host(auth.uid(), event_id));

-- feedback: user inserts/reads own; host reads
create policy "feedback read by user or host" on public.feedback
  for select to authenticated using (
    user_id = auth.uid() or public.is_event_host(auth.uid(), event_id)
  );
create policy "feedback insert by user with constraints" on public.feedback
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (select 1 from public.events where id = event_id and end_at < now())
    and exists (select 1 from public.rsvps where event_id = feedback.event_id and user_id = auth.uid() and status <> 'cancelled')
  );

-- reports: any signed-in can insert; reporter and relevant host can read; host can update
create policy "reports insert by authenticated" on public.reports
  for insert to authenticated with check (reporter_user_id = auth.uid());
create policy "reports read by reporter" on public.reports
  for select to authenticated using (reporter_user_id = auth.uid());
create policy "reports update by host role on event target" on public.reports
  for update to authenticated using (
    target_type = 'event' and public.is_event_host(auth.uid(), target_id)
  );

-- check_in_logs: checker/host of the event can read and insert
create policy "checkin logs read by event staff" on public.check_in_logs
  for select to authenticated using (public.is_event_checker_or_host(auth.uid(), event_id));
create policy "checkin logs insert by event staff" on public.check_in_logs
  for insert to authenticated with check (
    checker_user_id = auth.uid() and public.is_event_checker_or_host(auth.uid(), event_id)
  );

-- host_invites: host role can manage; anyone authenticated can read by token via RPC (we allow select by token below)
create policy "invites host manage" on public.host_invites
  for all to authenticated using (public.is_host_member(auth.uid(), host_id, 'host'))
  with check (public.is_host_member(auth.uid(), host_id, 'host'));
create policy "invites readable by authenticated" on public.host_invites
  for select to authenticated using (true);
