import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { EventCard } from "@/components/EventCard";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/hosts/$hostId")({
  head: () => ({ meta: [{ title: "Host — CommunityPass" }] }),
  component: HostPage,
});

function HostPage() {
  const { hostId } = Route.useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["host", hostId],
    queryFn: async () => {
      const [{ data: host }, { data: events }] = await Promise.all([
        supabase.from("hosts").select("*").eq("id", hostId).maybeSingle(),
        supabase.from("events").select("*").eq("host_id", hostId)
          .eq("status", "published").eq("hidden", false).order("start_at"),
      ]);
      return { host, events: events ?? [] };
    },
  });

  if (isLoading) return <SiteLayout><div className="p-20 text-center">Loading…</div></SiteLayout>;
  if (!data?.host) return <SiteLayout><div className="p-20 text-center"><h1 className="text-2xl font-bold">Host not found</h1></div></SiteLayout>;

  const { host, events } = data;

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {host.logo_url && <img src={host.logo_url} alt={host.name} className="h-24 w-24 rounded-full bg-muted" />}
          <div>
            <h1 className="text-3xl font-bold">{host.name}</h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">{host.bio}</p>
            <a href={`mailto:${host.contact_email}`} className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <Mail className="h-4 w-4" /> {host.contact_email}
            </a>
          </div>
        </div>

        <h2 className="mt-12 text-2xl font-semibold">Events</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => <EventCard key={e.id} event={e} hostName={host.name} />)}
        </div>
      </div>
    </SiteLayout>
  );
}
