-- Seed demo data: Community Tech Hub + upcoming & past events + demo attendees
-- Uses deterministic UUIDs so the script is idempotent.

DO $$
DECLARE
  demo_host_id uuid := '00000000-0000-0000-0000-d0000000001a';
  upcoming_event_id uuid := '00000000-0000-0000-0000-e0000000001a';
  past_event_id uuid := '00000000-0000-0000-0000-e0000000002a';
  names text[] := ARRAY['Ada Lovelace','Linus Torvalds','Grace Hopper','Alan Turing','Margaret Hamilton','Dennis Ritchie'];
  uid uuid;
  i int;
BEGIN
  -- Host
  INSERT INTO public.hosts (id, name, logo_url, bio, contact_email)
  VALUES (
    demo_host_id,
    'Community Tech Hub',
    'https://api.dicebear.com/7.x/shapes/svg?seed=communitytech',
    'A grassroots collective bringing developers, designers, and curious minds together.',
    'hello@communitytechhub.org'
  ) ON CONFLICT (id) DO NOTHING;

  -- Upcoming event (June 2026)
  INSERT INTO public.events (id, host_id, title, description, start_at, end_at, timezone, venue_address, capacity, cover_image_url, visibility, status)
  VALUES (
    upcoming_event_id,
    demo_host_id,
    'Frontend Meetup 2026',
    'Join us for an evening of lightning talks, demos, and discussion about the latest in frontend development. Topics include React 19, signals, and edge rendering.',
    '2026-06-12T18:30:00Z',
    '2026-06-12T21:00:00Z',
    'Europe/Berlin',
    'Tech Hub Loft, 12 Garden St, Berlin',
    80,
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80',
    'public',
    'published'
  ) ON CONFLICT (id) DO NOTHING;

  -- Past event (November 2025)
  INSERT INTO public.events (id, host_id, title, description, start_at, end_at, timezone, online_link, capacity, cover_image_url, visibility, status)
  VALUES (
    past_event_id,
    demo_host_id,
    'QA Community Night',
    'A retrospective evening with QA leads sharing testing strategies, automation tips, and community Q&A.',
    '2025-11-04T18:00:00Z',
    '2025-11-04T20:30:00Z',
    'Europe/Berlin',
    'https://meet.example.com/qa-night',
    60,
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&q=80',
    'public',
    'published'
  ) ON CONFLICT (id) DO NOTHING;

  -- Demo attendees + RSVPs for both events
  FOR i IN 1..array_length(names, 1) LOOP
    uid := gen_random_uuid();
    INSERT INTO public.demo_attendees (user_id, name, email)
    VALUES (uid, names[i], lower(replace(names[i], ' ', '.')) || '+' || substr(uid::text, 1, 4) || '@demo.test')
    ON CONFLICT (user_id) DO NOTHING;

    -- Upcoming event: first 5 going, last 1 waitlist
    IF i < array_length(names, 1) THEN
      INSERT INTO public.rsvps (event_id, user_id, status, ticket_code, created_at)
      VALUES (upcoming_event_id, uid, 'going', 'CP-DEMO' || upper(substr(md5(random()::text), 1, 6)), now() - (i || ' days')::interval)
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO public.rsvps (event_id, user_id, status, ticket_code, waitlist_position, created_at)
      VALUES (upcoming_event_id, uid, 'waitlist', 'CP-DEMO' || upper(substr(md5(random()::text), 1, 6)), 1, now() - (i || ' hours')::interval)
      ON CONFLICT DO NOTHING;
    END IF;

    -- Past event: all going, most checked in
    INSERT INTO public.rsvps (event_id, user_id, status, ticket_code, checked_in_at, created_at)
    VALUES (
      past_event_id, uid, 'going',
      'CP-DEMO' || upper(substr(md5(random()::text), 1, 6)),
      CASE WHEN i <= 4 THEN '2025-11-04T19:00:00Z'::timestamptz ELSE NULL END,
      now() - ((i + 30) || ' days')::interval
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
