
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('host-logos', 'host-logos', true, 2097152, array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('event-covers', 'event-covers', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('gallery-photos', 'gallery-photos', true, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "public read host-logos" on storage.objects for select using (bucket_id = 'host-logos');
create policy "public read event-covers" on storage.objects for select using (bucket_id = 'event-covers');
create policy "public read gallery-photos" on storage.objects for select using (bucket_id = 'gallery-photos');

create policy "user upload host-logos" on storage.objects for insert to authenticated
  with check (bucket_id = 'host-logos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "user update host-logos" on storage.objects for update to authenticated
  using (bucket_id = 'host-logos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "user delete host-logos" on storage.objects for delete to authenticated
  using (bucket_id = 'host-logos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "user upload event-covers" on storage.objects for insert to authenticated
  with check (bucket_id = 'event-covers' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "user update event-covers" on storage.objects for update to authenticated
  using (bucket_id = 'event-covers' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "user delete event-covers" on storage.objects for delete to authenticated
  using (bucket_id = 'event-covers' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "user upload gallery-photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "user update gallery-photos" on storage.objects for update to authenticated
  using (bucket_id = 'gallery-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "user delete gallery-photos" on storage.objects for delete to authenticated
  using (bucket_id = 'gallery-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Loosen rsvps.user_id constraint so demo data can be seeded without real auth users.
alter table public.rsvps drop constraint if exists rsvps_user_id_fkey;

create table if not exists public.demo_attendees (
  user_id uuid primary key,
  name text not null,
  email text not null
);
alter table public.demo_attendees enable row level security;
create policy "demo attendees public read" on public.demo_attendees for select using (true);

do $$
declare
  e_record record;
  uid uuid;
  names text[] := array['Ada Lovelace','Linus Torvalds','Grace Hopper','Alan Turing','Margaret Hamilton','Dennis Ritchie'];
  i int;
begin
  for e_record in select id, capacity from public.events loop
    for i in 1..array_length(names,1) loop
      uid := gen_random_uuid();
      insert into public.demo_attendees (user_id, name, email)
        values (uid, names[i], lower(replace(names[i],' ','.')) || '+' || substr(uid::text,1,4) || '@demo.test');
      insert into public.rsvps (event_id, user_id, status, ticket_code, created_at)
        values (e_record.id, uid, 'going', 'CP-DEMO' || upper(substr(md5(random()::text),1,5)), now() - (i || ' days')::interval);
    end loop;
    update public.rsvps set checked_in_at = now() - interval '1 hour'
      where id = (select id from public.rsvps where event_id = e_record.id and status='going' order by created_at asc limit 1);
  end loop;
end $$;
