import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { EventEditor } from "@/components/EventEditor";
import { NoAccess } from "@/components/NoAccess";
import { useAuth } from "@/lib/auth";
import { useMyMemberships } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/host/events/$eventId/edit")({
  head: () => ({ meta: [{ title: "Edit event — CommunityPass" }] }),
  component: EditEvent,
});

function EditEvent() {
  const { eventId } = Route.useParams();
  const { user } = useAuth();
  const memberships = useMyMemberships();
  const isHost = (memberships.data ?? []).some((m) => m.role === "host");

  const { data, isLoading } = useQuery({
    queryKey: ["edit-event", eventId],
    enabled: isHost,
    queryFn: async () =>
      (await supabase.from("events").select("*").eq("id", eventId).maybeSingle()).data,
  });

  if (!user)
    return (
      <SiteLayout>
        <div className="p-20 text-center">
          Please{" "}
          <Link
            to="/auth"
            search={{ returnTo: `/host/events/${eventId}/edit` }}
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
  if (!isHost)
    return (
      <NoAccess
        message="You need a Host role to edit events."
        returnTo="/host/register"
        primaryLabel="Become a host"
      />
    );

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Edit event</h1>
        {isLoading ? <p>Loading…</p> : data ? <EventEditor event={data} /> : <p>Not found.</p>}
      </div>
    </SiteLayout>
  );
}
