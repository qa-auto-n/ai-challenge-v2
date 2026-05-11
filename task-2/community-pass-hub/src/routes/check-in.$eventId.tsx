import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { NoAccess } from "@/components/NoAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Undo2, Video } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/db";
import { useMyMemberships, canCheckIn } from "@/lib/permissions";

export const Route = createFileRoute("/check-in/$eventId")({
  head: () => ({ meta: [{ title: "Check-in — CommunityPass" }] }),
  component: CheckIn,
});

function CheckIn() {
  const { eventId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const memberships = useMyMemberships();

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["checkin-event", eventId],
    queryFn: async () =>
      (await supabase.from("events").select("*, hosts(name)").eq("id", eventId).maybeSingle()).data,
  });

  const { data: stats } = useQuery({
    queryKey: ["checkin-stats", eventId],
    refetchInterval: 10000,
    queryFn: async () => {
      const [g, w, c] = await Promise.all([
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
        supabase
          .from("rsvps")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventId)
          .eq("status", "going")
          .not("checked_in_at", "is", null),
      ]);
      return { going: g.count ?? 0, waitlist: w.count ?? 0, checked: c.count ?? 0 };
    },
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["recent-scans", eventId],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data } = await supabase
        .from("check_in_logs")
        .select(
          "*, rsvps(ticket_code, user_id, profiles(name, email)), profiles!check_in_logs_checker_user_id_fkey(name, email)",
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const checkIn = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      const trimmed = code.trim();
      if (!trimmed) throw new Error("Enter a ticket code");

      // Normalize common manual-entry variations:
      // - lowercase vs uppercase
      // - smart dashes / em dashes
      // - stray spaces from copy/paste
      // - optional CP prefix without the dash
      const normalized = trimmed
        .toUpperCase()
        .replace(/[‐‑–—]/g, "-")
        .replace(/\s+/g, "");
      const compact = normalized.replace(/-/g, "");
      const candidates = Array.from(
        new Set([
          normalized,
          compact.startsWith("CP") && compact.length > 2 ? `CP-${compact.slice(2)}` : normalized,
          compact.startsWith("CP") ? compact : `CP${compact}`,
        ]),
      );

      // Look up by ticket_code first, then fall back to equivalent normalized forms.
      let rsvp = null;
      for (const candidate of candidates) {
        const { data } = await supabase
          .from("rsvps")
          .select("*, profiles(name, email)")
          .eq("ticket_code", candidate)
          .maybeSingle();
        if (data) {
          rsvp = data;
          break;
        }
      }
      if (!rsvp) throw new Error("Ticket not found");
      if (rsvp.event_id !== eventId) throw new Error("This ticket is for another event");
      if (rsvp.status === "cancelled") throw new Error("This RSVP was cancelled");
      if (rsvp.status === "waitlist")
        throw new Error("This attendee is still on the waitlist and cannot be checked in");
      if (rsvp.checked_in_at) {
        const at = new Date(rsvp.checked_in_at).toLocaleTimeString();
        throw new Error(`Already checked in at ${at}`);
      }
      const { error: uErr } = await supabase
        .from("rsvps")
        .update({ checked_in_at: new Date().toISOString() })
        .eq("id", rsvp.id);
      if (uErr) throw uErr;
      const { error: lErr } = await supabase.from("check_in_logs").insert({
        event_id: eventId,
        rsvp_id: rsvp.id,
        checker_user_id: user.id,
        action: "check_in",
      });
      if (lErr) throw lErr;
      const profile = (rsvp as unknown as { profiles?: { name?: string; email?: string } | null })
        .profiles;
      return profile?.name || profile?.email || "Attendee";
    },
    onSuccess: (name) => {
      toast.success(`Checked in ${name}`);
      setCode("");
      qc.invalidateQueries({ queryKey: ["checkin-stats", eventId] });
      qc.invalidateQueries({ queryKey: ["recent-scans", eventId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const undo = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      // Find latest check_in by this checker for this event whose RSVP is still checked in.
      const { data: logs } = await supabase
        .from("check_in_logs")
        .select("id, rsvp_id, created_at, rsvps(checked_in_at)")
        .eq("event_id", eventId)
        .eq("checker_user_id", user.id)
        .eq("action", "check_in")
        .order("created_at", { ascending: false })
        .limit(20);
      const target = (logs ?? []).find((l) => {
        const r = (l as unknown as { rsvps?: { checked_in_at: string | null } | null }).rsvps;
        return r && r.checked_in_at != null;
      });
      if (!target) throw new Error("No recent check-in to undo");
      const { error: uErr } = await supabase
        .from("rsvps")
        .update({ checked_in_at: null })
        .eq("id", target.rsvp_id);
      if (uErr) throw uErr;
      const { error: lErr } = await supabase.from("check_in_logs").insert({
        event_id: eventId,
        rsvp_id: target.rsvp_id,
        checker_user_id: user.id,
        action: "undo",
      });
      if (lErr) throw lErr;
    },
    onSuccess: () => {
      toast.success("Last check-in was undone");
      qc.invalidateQueries({ queryKey: ["checkin-stats", eventId] });
      qc.invalidateQueries({ queryKey: ["recent-scans", eventId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user)
    return (
      <SiteLayout>
        <div className="p-20 text-center">
          Please{" "}
          <Link
            to="/auth"
            search={{ returnTo: `/check-in/${eventId}` }}
            className="text-primary underline"
          >
            sign in
          </Link>
          .
        </div>
      </SiteLayout>
    );
  if (eventLoading || memberships.isLoading)
    return (
      <SiteLayout>
        <div className="p-20 text-center">Loading…</div>
      </SiteLayout>
    );
  if (!event)
    return (
      <SiteLayout>
        <div className="p-20 text-center">
          <h1 className="text-2xl font-bold">Event not found</h1>
        </div>
      </SiteLayout>
    );
  if (!canCheckIn(memberships.data, event.host_id)) {
    return (
      <NoAccess message="You need a host or checker role for this event's host to access check-in." />
    );
  }

  const remaining = Math.max(0, (stats?.going ?? 0) - (stats?.checked ?? 0));
  const hostName = (event as unknown as { hosts?: { name: string } }).hosts?.name;

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {hostName && <span>by {hostName}</span>}
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDateTime(event.start_at, event.timezone)}
          </span>
          <span className="flex items-center gap-1">
            {event.online_link ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
            {event.online_link || event.venue_address}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Going", value: stats?.going ?? 0 },
            { label: "Waitlist", value: stats?.waitlist ?? 0 },
            { label: "Checked-in", value: stats?.checked ?? 0 },
            { label: "Remaining", value: remaining },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Manual check-in</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Enter ticket code (e.g. CP-XXXXXXXX)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                onKeyDown={(e) => e.key === "Enter" && checkIn.mutate()}
              />
              <Button onClick={() => checkIn.mutate()} disabled={!code.trim() || checkIn.isPending}>
                Check in
              </Button>
              <Button variant="outline" onClick={() => undo.mutate()} disabled={undo.isPending}>
                <Undo2 className="h-4 w-4" /> Undo Last Scan
              </Button>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium">Recent scans</h4>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scans yet.</p>
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {recent.map((s) => {
                    const r = (
                      s as unknown as {
                        rsvps?: {
                          ticket_code: string;
                          profiles?: { name?: string; email?: string } | null;
                        } | null;
                      }
                    ).rsvps;
                    const checker = (
                      s as unknown as { profiles?: { name?: string; email?: string } | null }
                    ).profiles;
                    const name = r?.profiles?.name || r?.profiles?.email || "Unknown";
                    return (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{name}</span>
                          {checker && (
                            <span className="text-xs text-muted-foreground">
                              by {checker.name || checker.email}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <code className="font-mono text-xs">{r?.ticket_code}</code>
                          <Badge variant={s.action === "check_in" ? "default" : "secondary"}>
                            {s.action}
                          </Badge>
                          <span className="text-xs">
                            {new Date(s.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
