import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Video } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDateTime, isPast } from "@/lib/db";
import { TicketActions } from "@/components/TicketActions";

export const Route = createFileRoute("/tickets")({
  head: () => ({ meta: [{ title: "My tickets — CommunityPass" }] }),
  component: MyTickets,
});

function MyTickets() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-tickets", user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data } = await supabase
        .from("rsvps")
        .select("*, events(*, hosts(name))")
        .eq("user_id", user!.id)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });
      return (data ?? []).filter((t) => t.events && !isPast(t.events));
    },
  });

  // Detect waitlist→going promotion across refetches.
  const prevStatus = useRef<Record<string, string>>({});
  useEffect(() => {
    for (const t of data) {
      const prev = prevStatus.current[t.id];
      if (prev === "waitlist" && t.status === "going") {
        toast.success(`You've been promoted from waitlist to going for ${t.events!.title}!`);
      }
      prevStatus.current[t.id] = t.status;
    }
  }, [data]);

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("rsvps")
        .update({ status: "cancelled", checked_in_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("RSVP cancelled");
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user)
    return (
      <SiteLayout>
        <div className="p-20 text-center">
          Please{" "}
          <Link to="/auth" search={{ returnTo: "/tickets" }} className="text-primary underline">
            sign in
          </Link>
          .
        </div>
      </SiteLayout>
    );

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">My tickets</h1>
        <p className="mt-1 text-muted-foreground">Your upcoming RSVPs.</p>
        {isLoading ? (
          <p className="mt-6">Loading…</p>
        ) : data.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-border p-12 text-center">
            <h3 className="font-semibold">No upcoming tickets</h3>
            <p className="mt-1 text-sm text-muted-foreground">RSVP to an event to see it here.</p>
            <Link to="/explore">
              <Button className="mt-4">Explore events</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {data.map((t) => {
              const ev = t.events!;
              const host = (ev as unknown as { hosts?: { name: string } | null }).hosts;
              return (
                <Card key={t.id}>
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to="/events/$eventId"
                          params={{ eventId: ev.id }}
                          className="font-semibold hover:underline"
                        >
                          {ev.title}
                        </Link>
                        <Badge variant={t.status === "going" ? "default" : "secondary"}>
                          {t.status === "going"
                            ? "Going"
                            : `Waitlist${t.waitlist_position ? ` #${t.waitlist_position}` : ""}`}
                        </Badge>
                      </div>
                      {host && <p className="text-sm text-muted-foreground">by {host.name}</p>}
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDateTime(ev.start_at, ev.timezone)} ({ev.timezone})
                      </p>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        {ev.online_link ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <MapPin className="h-4 w-4" />
                        )}
                        {ev.online_link || ev.venue_address}
                      </p>
                      {t.status === "waitlist" && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          You are on the waitlist. We'll promote you automatically if a spot opens.
                        </p>
                      )}
                    </div>
                    <TicketActions
                      rsvp={t}
                      event={ev}
                      onCancel={(id) => cancel.mutate(id)}
                      cancelling={cancel.isPending}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
