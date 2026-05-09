-- Allow anyone to read feedback for events that have already ended.
-- Ratings and comments are public information once an event is over.
-- The existing "feedback read by user or host" policy remains; the two SELECT
-- policies are OR-ed by Postgres, so users keep read access to their own rows
-- on upcoming events as well.
create policy "feedback public read for past events"
on public.feedback for select
using (
  exists (
    select 1 from public.events e
    where e.id = event_id and e.end_at < now()
  )
);
