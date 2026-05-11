import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CsvExportButton } from "@/components/CsvExportButton";
import { RoleBadge } from "@/components/RoleBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDateTime, isPast } from "@/lib/db";
import { useMyMemberships } from "@/lib/permissions";

export const Route = createFileRoute("/my-events")({
  head: () => ({ meta: [{ title: "My events — CommunityPass" }] }),
  component: MyEvents,
});

type RoleFilter = "all" | "host" | "checker";

function MyEvents() {
  const { user } = useAuth();
  const memberships = useMyMemberships();
  const [hostFilter, setHostFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [includePast, setIncludePast] = useState(false);

  const ms = useMemo(() => memberships.data ?? [], [memberships.data]);
  const roleByHost = useMemo(() => {
    const r: Record<string, "host" | "checker"> = {};
    ms.forEach((m) => {
      if (m.role === "host" || !r[m.host_id]) r[m.host_id] = m.role;
    });
    return r;
  }, [ms]);
  const hosts = useMemo(
    () =>
      Array.from(new Map(ms.map((m) => [m.host_id, m.hosts])).values()).filter(Boolean) as {
        id: string;
        name: string;
      }[],
    [ms],
  );

  const { data: events = [] } = useQuery({
    queryKey: ["my-events", user?.id, ms.map((m) => m.host_id).join(",")],
    enabled: !!user && ms.length > 0,
    queryFn: async () => {
      const hostIds = Object.keys(roleByHost);
      if (hostIds.length === 0) return [];
      const { data } = await supabase
        .from("events")
        .select("*, hosts(id, name)")
        .in("host_id", hostIds)
        .order("start_at", { ascending: false });
      const evs = data ?? [];
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

  const filtered = useMemo(
    () =>
      events
        .filter((e) => {
          const role = roleByHost[e.host_id];
          if (hostFilter && e.host_id !== hostFilter) return false;
          if (roleFilter !== "all" && role !== roleFilter) return false;
          if (!includePast && isPast(e)) return false;
          if (q && !e.title.toLowerCase().includes(q.toLowerCase())) return false;
          if (from && new Date(e.start_at) < new Date(from)) return false;
          if (to && new Date(e.start_at) > new Date(to)) return false;
          return true;
        })
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
    [events, hostFilter, roleFilter, includePast, q, from, to, roleByHost],
  );

  if (!user)
    return (
      <SiteLayout>
        <div className="p-20 text-center">
          Please{" "}
          <Link to="/auth" search={{ returnTo: "/my-events" }} className="text-primary underline">
            sign in
          </Link>
          .
        </div>
      </SiteLayout>
    );

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">My events</h1>
        <p className="mt-1 text-muted-foreground">
          Events from hosts where you're a host or checker.
        </p>

        <div className="mt-6 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <Label htmlFor="h">Host</Label>
            <select
              id="h"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={hostFilter}
              onChange={(e) => setHostFilter(e.target.value)}
            >
              <option value="">All</option>
              {hosts.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="r">Role</Label>
            <select
              id="r"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            >
              <option value="all">All</option>
              <option value="host">Host</option>
              <option value="checker">Checker</option>
            </select>
          </div>
          <div>
            <Label htmlFor="q">Search</Label>
            <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="f">From</Label>
            <Input id="f" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="t">To</Label>
            <Input id="t" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <Switch id="past" checked={includePast} onCheckedChange={setIncludePast} />
            <Label htmlFor="past">Include past</Label>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {filtered.map((e) => {
            const role = roleByHost[e.host_id];
            return (
              <Card key={e.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{e.title}</h3>
                      {role && <RoleBadge role={role} />}
                      <Badge variant={e.status === "published" ? "default" : "secondary"}>
                        {e.status}
                      </Badge>
                      <Badge variant="outline">{e.visibility}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {e.hosts?.name} · {formatDateTime(e.start_at, e.timezone)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Going {e.going}/{e.capacity} · Waitlist {e.waitlist} · Checked-in {e.checked}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role === "host" && (
                      <>
                        <Link to="/host/events/$eventId/edit" params={{ eventId: e.id }}>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </Link>
                        <Link to="/host/dashboard">
                          <Button variant="outline" size="sm">
                            Dashboard
                          </Button>
                        </Link>
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
                          canExport
                        />
                        <CsvExportButton
                          label="Attendance CSV"
                          eventId={e.id}
                          eventTitle={e.title}
                          variant="attendance"
                          canExport
                        />
                      </>
                    )}
                    {role === "checker" && (
                      <Link to="/check-in/$eventId" params={{ eventId: e.id }}>
                        <Button size="sm">Check-in</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-12 text-center">
              <p className="font-semibold">No events</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {ms.length === 0
                  ? "Use a host or checker invite link to join a host team."
                  : "Try clearing filters or enabling Include past."}
              </p>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
