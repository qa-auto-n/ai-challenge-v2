import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { EventCard } from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { isPast } from "@/lib/db";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explore events — CommunityPass" }] }),
  component: Explore,
});

function Explore() {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [location, setLocation] = useState("");
  const [includePast, setIncludePast] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ["explore-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, hosts(name)")
        .eq("status", "published").eq("visibility", "public").eq("hidden", false)
        .order("start_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (!includePast && isPast(e)) return false;
      if (q && !e.title.toLowerCase().includes(q.toLowerCase())) return false;
      if (location && !(e.venue_address ?? "").toLowerCase().includes(location.toLowerCase())) return false;
      if (from && new Date(e.start_at) < new Date(from)) return false;
      if (to && new Date(e.start_at) > new Date(to)) return false;
      return true;
    });
  }, [events, q, from, to, location, includePast]);

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Explore events</h1>
        <p className="mt-1 text-muted-foreground">Discover upcoming community gatherings.</p>

        <div className="mt-6 grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div><Label htmlFor="q">Search</Label><Input id="q" placeholder="Title…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div><Label htmlFor="from">From</Label><Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label htmlFor="to">To</Label><Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div><Label htmlFor="loc">Location</Label><Input id="loc" placeholder="City or venue" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
          <div className="flex items-end gap-2">
            <Switch id="past" checked={includePast} onCheckedChange={setIncludePast} />
            <Label htmlFor="past">Include past</Label>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-12 rounded-lg border border-dashed border-border p-12 text-center">
            <h3 className="font-semibold">No events found</h3>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => <EventCard key={e.id} event={e} hostName={e.hosts?.name} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
