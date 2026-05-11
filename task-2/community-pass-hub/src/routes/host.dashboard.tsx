import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { NoAccess } from "@/components/NoAccess";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CsvExportButton } from "@/components/CsvExportButton";
import { EventActions } from "@/components/EventActions";
import { InviteManager } from "@/components/InviteManager";
import { DashboardStats } from "@/components/DashboardStats";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { isPast, formatDateTime, EventRow } from "@/lib/db";
import { useMyMemberships } from "@/lib/permissions";

export const Route = createFileRoute("/host/dashboard")({
  head: () => ({ meta: [{ title: "Host dashboard — CommunityPass" }] }),
  component: HostDashboard,
});

type EventWithCounts = EventRow & { going: number; waitlist: number; checked: number };

function HostDashboard() {
  const { user } = useAuth();
  const memberships = useMyMemberships();
  const hostMemberships = (memberships.data ?? []).filter((m) => m.role === "host");
  const [selectedHostId, setSelectedHostId] = useState<string>("");

  useEffect(() => {
    if (!selectedHostId && hostMemberships.length > 0)
      setSelectedHostId(hostMemberships[0].host_id);
  }, [hostMemberships, selectedHostId]);

  const { data: hostInfo } = useQuery({
    queryKey: ["host-info", selectedHostId],
    enabled: !!selectedHostId,
    queryFn: async () =>
      (await supabase.from("hosts").select("*").eq("id", selectedHostId).maybeSingle()).data,
  });

  const { data = [], isLoading } = useQuery({
    queryKey: ["dashboard-events", selectedHostId],
    enabled: !!selectedHostId,
    queryFn: async (): Promise<EventWithCounts[]> => {
      const { data: events } = await supabase
        .from("events")
        .select("*")
        .eq("host_id", selectedHostId)
        .order("start_at", { ascending: false });
      const evs = events ?? [];
      return Promise.all(
        evs.map(async (e) => {
          const [g, w, c] = await Promise.all([
            supabase
              .from("rsvps")
              .select("id", { count: "exact", head: true })
              .eq("event_id", e.id)
              .eq("status", "going"),
            supabase
              .from("rsvps")
              .select("id", { count: "exact", head: true })
              .eq("event_id", e.id)
              .eq("status", "waitlist"),
            supabase
              .from("rsvps")
              .select("id", { count: "exact", head: true })
              .eq("event_id", e.id)
              .eq("status", "going")
              .not("checked_in_at", "is", null),
          ]);
          return { ...e, going: g.count ?? 0, waitlist: w.count ?? 0, checked: c.count ?? 0 };
        }),
      );
    },
  });

  const stats = useMemo(() => {
    const totalGoing = data.reduce((s, e) => s + e.going, 0);
    const totalWait = data.reduce((s, e) => s + e.waitlist, 0);
    const totalChecked = data.reduce((s, e) => s + e.checked, 0);
    return [
      { label: "Going (all events)", value: totalGoing },
      { label: "Waitlist (all events)", value: totalWait },
      { label: "Checked-in (all events)", value: totalChecked },
    ];
  }, [data]);

  if (!user)
    return (
      <SiteLayout>
        <div className="p-20 text-center">
          Please{" "}
          <Link
            to="/auth"
            search={{ returnTo: "/host/dashboard" }}
            className="text-primary underline"
          >
            sign in
          </Link>
          .
        </div>
      </SiteLayout>
    );
  if (memberships.isLoading)
    return (
      <SiteLayout>
        <div className="p-20 text-center">Loading…</div>
      </SiteLayout>
    );
  if (hostMemberships.length === 0) {
    return (
      <NoAccess
        message="You need a Host role to access the dashboard. Become a host or use a host invite link."
        returnTo="/host/register"
        primaryLabel="Become a host"
      />
    );
  }

  const upcoming = data.filter((e) => !isPast(e));
  const past = data.filter((e) => isPast(e));

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Host dashboard</h1>
            <p className="text-muted-foreground">Manage your events and RSVPs.</p>
          </div>
          <Link to="/host/events/new">
            <Button>New event</Button>
          </Link>
        </div>

        {hostMemberships.length > 1 && (
          <div className="max-w-xs">
            <Label htmlFor="host-select">Host</Label>
            <select
              id="host-select"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedHostId}
              onChange={(e) => setSelectedHostId(e.target.value)}
            >
              {hostMemberships.map((m) => (
                <option key={m.host_id} value={m.host_id}>
                  {m.hosts?.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {hostInfo && (
          <Card>
            <CardContent className="flex flex-wrap items-center gap-4 p-4">
              {hostInfo.logo_url && (
                <img
                  src={hostInfo.logo_url}
                  alt={hostInfo.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-semibold">{hostInfo.name}</p>
                <p className="text-sm text-muted-foreground">{hostInfo.contact_email}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <DashboardStats stats={stats} />

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              <EventTable list={upcoming} />
            </TabsContent>
            <TabsContent value="past">
              <EventTable list={past} />
            </TabsContent>
          </Tabs>
        )}

        {selectedHostId && (
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Team & invites</h2>
            <InviteManager hostId={selectedHostId} />
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function EventTable({ list }: { list: EventWithCounts[] }) {
  if (list.length === 0)
    return (
      <Card className="mt-4">
        <CardContent className="p-12 text-center text-muted-foreground">
          No events here yet.
        </CardContent>
      </Card>
    );
  return (
    <Card className="mt-4">
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead className="text-right">Going</TableHead>
              <TableHead className="text-right">Waitlist</TableHead>
              <TableHead className="text-right">Checked-in</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  <div>{e.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.online_link ? "Online" : (e.venue_address ?? "—")}
                  </div>
                </TableCell>
                <TableCell>{formatDateTime(e.start_at, e.timezone)}</TableCell>
                <TableCell>
                  <Badge variant={e.status === "published" ? "default" : "secondary"}>
                    {e.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{e.visibility}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {e.going}/{e.capacity}
                </TableCell>
                <TableCell className="text-right">{e.waitlist}</TableCell>
                <TableCell className="text-right">{e.checked}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link to="/host/events/$eventId/edit" params={{ eventId: e.id }}>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </Link>
                    <EventActions event={e} />
                    <Link to="/check-in/$eventId" params={{ eventId: e.id }}>
                      <Button variant="outline" size="sm">
                        Check-in
                      </Button>
                    </Link>
                    <CsvExportButton
                      label="RSVPs CSV"
                      eventId={e.id}
                      eventTitle={e.title}
                      variant="rsvps"
                    />
                    <CsvExportButton
                      label="Attendance CSV"
                      eventId={e.id}
                      eventTitle={e.title}
                      variant="attendance"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
