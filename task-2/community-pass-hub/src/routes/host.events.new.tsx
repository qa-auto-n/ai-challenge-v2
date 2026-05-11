import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { EventEditor } from "@/components/EventEditor";
import { NoAccess } from "@/components/NoAccess";
import { useAuth } from "@/lib/auth";
import { useMyMemberships } from "@/lib/permissions";

export const Route = createFileRoute("/host/events/new")({
  head: () => ({ meta: [{ title: "New event — CommunityPass" }] }),
  component: NewEvent,
});

function NewEvent() {
  const { user } = useAuth();
  const memberships = useMyMemberships();
  const isHost = (memberships.data ?? []).some((m) => m.role === "host");

  if (!user)
    return (
      <SiteLayout>
        <div className="p-20 text-center">
          Please{" "}
          <Link
            to="/auth"
            search={{ returnTo: "/host/events/new" }}
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
        message="You need a Host role to create events."
        returnTo="/host/register"
        primaryLabel="Become a host"
      />
    );

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">New event</h1>
        <EventEditor />
      </div>
    </SiteLayout>
  );
}
