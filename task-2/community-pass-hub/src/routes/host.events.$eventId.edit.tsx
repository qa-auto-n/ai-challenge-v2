import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { EventEditor } from "@/components/EventEditor";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/host/events/$eventId/edit")({
  head: () => ({ meta: [{ title: "Edit event — CommunityPass" }] }),
  component: EditEvent,
});

function EditEvent() {
  const { eventId } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["edit-event", eventId],
    queryFn: async () => (await supabase.from("events").select("*").eq("id", eventId).maybeSingle()).data,
  });
  return (
    <SiteLayout>
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Edit event</h1>
        {isLoading ? <p>Loading…</p> : data ? <EventEditor event={data} /> : <p>Not found.</p>}
      </div>
    </SiteLayout>
  );
}
