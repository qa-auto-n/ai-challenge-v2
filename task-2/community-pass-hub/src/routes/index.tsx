import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/EventCard";
import { CalendarCheck, QrCode, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CommunityPass — Host free community events" },
      {
        name: "description",
        content: "Create events, manage RSVPs, and check-in attendees in seconds.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data } = useQuery({
    queryKey: ["featured-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, hosts(name)")
        .eq("status", "published")
        .eq("visibility", "public")
        .eq("hidden", false)
        .order("start_at", { ascending: true })
        .limit(3);
      if (error) throw error;
      const evs = data ?? [];
      return Promise.all(
        evs.map(async (e) => {
          const [g, w] = await Promise.all([
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
          ]);
          return { ...e, goingCount: g.count ?? 0, waitlistCount: w.count ?? 0 };
        }),
      );
    },
  });

  return (
    <SiteLayout>
      <section className="border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Bring your community together — for free.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            CommunityPass is a lightweight platform for hosting events, managing RSVPs, and checking
            in attendees.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/explore">
              <Button size="lg">Explore Events</Button>
            </Link>
            <Link to="/host/register">
              <Button size="lg" variant="outline">
                Become a Host
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              Icon: CalendarCheck,
              title: "Free hosting",
              desc: "Publish unlimited public or unlisted events.",
            },
            {
              Icon: Users,
              title: "Simple RSVPs",
              desc: "Going / waitlist tracking with capacity controls.",
            },
            {
              Icon: QrCode,
              title: "Fast check-in",
              desc: "Scan or enter codes manually at the door.",
            },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="rounded-lg border border-border p-6">
              <Icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {data && data.length > 0 && (
        <section className="container mx-auto px-4 pb-20">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Featured events</h2>
            <Link to="/explore" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                hostName={e.hosts?.name}
                goingCount={e.goingCount}
                waitlistCount={e.waitlistCount}
              />
            ))}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}
