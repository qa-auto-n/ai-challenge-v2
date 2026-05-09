create or replace function public.is_photo_host(_user_id uuid, _photo_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.gallery_photos p
    join public.events e on e.id = p.event_id
    join public.host_members m on m.host_id = e.host_id
    where p.id = _photo_id and m.user_id = _user_id and m.role = 'host'
  );
$$;

create policy "reports read by event host"
on public.reports for select to authenticated
using (target_type = 'event' and is_event_host(auth.uid(), target_id));

create policy "reports read by photo host"
on public.reports for select to authenticated
using (target_type = 'photo' and is_photo_host(auth.uid(), target_id));

create policy "reports update by host on photo target"
on public.reports for update to authenticated
using (target_type = 'photo' and is_photo_host(auth.uid(), target_id));