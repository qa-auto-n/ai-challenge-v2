import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventStatusBadge } from "@/components/EventStatusBadge";
import { Calendar, MapPin, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDateTime, isPast, genTicketCode } from "@/lib/db";
import { TicketActions } from "@/components/TicketActions";
import { ReportDialog } from "@/components/ReportDialog";
import { EventGallery } from "@/components/EventGallery";
import { EventFeedback } from "@/components/EventFeedback";

export const Route = createFileRoute("/events/$eventId")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("events")
      .select("title, description, cover_image_url")
      .eq("id", params.eventId)
      .maybeSingle();
    return data ?? null;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Event"} — CommunityPass` },
      {
        name: "description",
        content: loaderData?.description ?? "A community event on CommunityPass.",
      },
      { property: "og:title", content: loaderData?.title ?? "CommunityPass" },
      {
        property: "og:description",
        content: loaderData?.description ?? "A community event on CommunityPass.",
      },
      { property: "og:type", content: "website" },
      ...(loaderData?.cover_image_url
        ? [{ property: "og:image", content: loaderData.cover_image_url }]
        : []),
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { eventId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["event", eventId],
    refetchInterval: 15000,
    queryFn: async () => {
      const [{ data: event, error }, going, waitlist] = await Promise.all([
        supabase.from("events").select("*, hosts(*)").eq("id", eventId).maybeSingle(),
        supabase
          .from("rsvps")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .eq("status", "going"),
        supabase
          .from("rsvps")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .eq("status", "waitlist"),
      ]);
      if (error) throw error;
      return { event, goingCount: going.count ?? 0, waitlistCount: waitlist.count ?? 0 };
    },
  });

  const { data: myRsvp } = useQuery({
    queryKey: ["my-rsvp", eventId, user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data } = await supabase
        .from("rsvps")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", user!.id)
        .neq("status", "cancelled")
        .maybeSingle();
      return data;
    },
  });

  // Promotion notification.
  const prevStatus = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevStatus.current === "waitlist" && myRsvp?.status === "going") {
      toast.success("You've been promoted from waitlist to going!");
    }
    prevStatus.current = myRsvp?.status;
  }, [myRsvp?.status]);

  const rsvpMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase.from("rsvps").insert({
        event_id: eventId,
        user_id: user.id,
        status: "going",
        ticket_code: genTicketCode(),
      });
      if (error) {
        if (error.code === "23505")
          throw new Error("You already have an active RSVP for this event.");
        throw error;
      }
    },
    onSuccess: async () => {
      // Read back to know if going or waitlist
      const { data: r } = await supabase
        .from("rsvps")
        .select("status")
        .eq("event_id", eventId)
        .eq("user_id", user!.id)
        .neq("status", "cancelled")
        .maybeSingle();
      if (r?.status === "waitlist") toast.message("Event is full — you've joined the waitlist.");
      else toast.success("RSVP confirmed!");
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["my-rsvp", eventId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rsvps")
        .update({ status: "cancelled", checked_in_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("RSVP cancelled");
      qc.invalidateQueries({ queryKey: ["event", eventId] });
      qc.invalidateQueries({ queryKey: ["my-rsvp", eventId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading)
    return (
      <SiteLayout>
        <div className="container mx-auto p-20 text-center">Loading…</div>
      </SiteLayout>
    );
  if (!data?.event)
    return (
      <SiteLayout>
        <div className="container mx-auto p-20 text-center">
          <h1 className="text-2xl font-bold">Event not available</h1>
          <p className="mt-2 text-muted-foreground">
            This event may be hidden, unpublished, or no longer exists.
          </p>
        </div>
      </SiteLayout>
    );

  const event = data.event;
  const host = event.hosts;
  const past = isPast(event);
  const publiclyRsvpable = event.status === "published" && !event.hidden;

  const onRsvp = () => {
    if (!user) {
      navigate({ to: "/auth", search: { returnTo: `/events/${eventId}` } });
      return;
    }
    rsvpMutation.mutate();
  };

  return (
    <SiteLayout>
      {event.cover_image_url && (
        <div className="aspect-[3/1] w-full overflow-hidden bg-muted">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <EventStatusBadge endAt={event.end_at} />
              <Badge variant="outline">{event.visibility}</Badge>
              {event.status !== "published" && <Badge variant="secondary">{event.status}</Badge>}
              {event.hidden && <Badge variant="destructive">Hidden</Badge>}
            </div>
            <h1 className="text-4xl font-bold">{event.title}</h1>
            <p className="whitespace-pre-line text-muted-foreground">{event.description}</p>
          </div>
          <EventGallery eventId={eventId} />
          <EventFeedback eventId={eventId} endAt={event.end_at} />
        </div>
        <aside className="space-y-4">
          <div className="rounded-lg border border-border p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {formatDateTime(event.start_at, event.timezone)}
                </p>
                <p className="text-xs text-muted-foreground">
                  to {formatDateTime(event.end_at, event.timezone)}
                </p>
                <p className="text-xs text-muted-foreground">{event.timezone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              {event.online_link ? (
                <Video className="mt-0.5 h-5 w-5 text-muted-foreground" />
              ) : (
                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
              )}
              <p className="text-sm">{event.online_link ?? event.venue_address}</p>
            </div>
            <div className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <p className="text-sm">
                {data.goingCount}/{event.capacity} going · {data.waitlistCount} waitlist
              </p>
            </div>

            {past ? (
              <div className="rounded-md bg-muted p-3 text-center text-sm text-muted-foreground">
                This event has ended.
              </div>
            ) : !publiclyRsvpable ? (
              <div className="rounded-md bg-muted p-3 text-center text-sm text-muted-foreground">
                RSVP not available.
              </div>
            ) : myRsvp ? (
              <div className="space-y-3">
                <div className="rounded-md bg-accent p-3 text-center text-sm">
                  {myRsvp.status === "going"
                    ? "You're going!"
                    : `You're on the waitlist${myRsvp.waitlist_position ? ` (#${myRsvp.waitlist_position})` : ""}`}
                </div>
                <TicketActions
                  rsvp={myRsvp}
                  event={event}
                  onCancel={(id) => cancelMutation.mutate(id)}
                  cancelling={cancelMutation.isPending}
                />
              </div>
            ) : (
              <Button className="w-full" onClick={onRsvp} disabled={rsvpMutation.isPending}>
                {data.goingCount >= event.capacity ? "Join waitlist" : "RSVP"}
              </Button>
            )}

            <ReportDialog
              targetType="event"
              targetId={eventId}
              returnTo={`/events/${eventId}`}
              triggerLabel="Report event"
            />
          </div>

          {host && (
            <Link
              to="/hosts/$hostId"
              params={{ hostId: host.id }}
              className="block rounded-lg border border-border p-4 hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                {host.logo_url && (
                  <img src={host.logo_url} alt={host.name} className="h-10 w-10 rounded-full" />
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Hosted by</p>
                  <p className="font-medium">{host.name}</p>
                </div>
              </div>
            </Link>
          )}
        </aside>
      </div>
    </SiteLayout>
  );
}
