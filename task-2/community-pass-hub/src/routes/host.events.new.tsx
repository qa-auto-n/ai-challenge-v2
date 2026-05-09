import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { EventEditor } from "@/components/EventEditor";

export const Route = createFileRoute("/host/events/new")({
  head: () => ({ meta: [{ title: "New event — CommunityPass" }] }),
  component: () => (
    <SiteLayout>
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">New event</h1>
        <EventEditor />
      </div>
    </SiteLayout>
  ),
});
