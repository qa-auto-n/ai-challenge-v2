import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMyMemberships, hasHostRole } from "@/lib/permissions";
import { NoAccess } from "@/components/NoAccess";
import { formatDateTime } from "@/lib/db";

export const Route = createFileRoute("/host/gallery-review")({
  head: () => ({ meta: [{ title: "Gallery review — CommunityPass" }] }),
  component: GalleryReview,
});

function GalleryReview() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const memberships = useMyMemberships();

  const { data = [] } = useQuery({
    queryKey: ["pending-photos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: members } = await supabase
        .from("host_members")
        .select("host_id")
        .eq("user_id", user!.id)
        .eq("role", "host");
      const hostIds = (members ?? []).map((m) => m.host_id);
      if (hostIds.length === 0) return [];
      const { data: events } = await supabase
        .from("events")
        .select("id, title, host_id, hosts(name)")
        .in("host_id", hostIds);
      const evMap = new Map((events ?? []).map((e) => [e.id, e]));
      const eventIds = Array.from(evMap.keys());
      if (eventIds.length === 0) return [];
      const { data: photos } = await supabase
        .from("gallery_photos")
        .select("*")
        .in("event_id", eventIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      const ps = photos ?? [];
      const userIds = Array.from(new Set(ps.map((p) => p.uploaded_by_user_id)));
      const { data: profiles } = userIds.length
        ? await supabase.from("profiles").select("id, name, email").in("id", userIds)
        : { data: [] };
      const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
      return ps.map((p) => ({
        ...p,
        event_title: evMap.get(p.event_id)?.title,
        host_name: evMap.get(p.event_id)?.hosts?.name,
        uploader_name: pMap.get(p.uploaded_by_user_id)?.name,
        uploader_email: pMap.get(p.uploaded_by_user_id)?.email,
      }));
    },
  });

  const update = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "rejected" | "hidden";
    }) => {
      const { error } = await supabase.from("gallery_photos").update({ status }).eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      const msg =
        status === "approved"
          ? "Photo approved"
          : status === "rejected"
            ? "Photo rejected"
            : "Photo hidden";
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["pending-photos"] });
      qc.invalidateQueries({ queryKey: ["gallery-approved"] });
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
            search={{ returnTo: "/host/gallery-review" }}
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
  if (!hasHostRole(memberships.data))
    return <NoAccess message="Only hosts can review gallery photos." />;

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Gallery review</h1>
        <p className="mt-1 text-muted-foreground">Approve, reject, or hide attendee photos.</p>
        {data.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-border p-12 text-center">
            <h3 className="font-semibold">All caught up</h3>
            <p className="mt-1 text-sm text-muted-foreground">No pending photos right now.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((p) => (
              <Card key={p.id} className="overflow-hidden pt-0">
                <img src={p.image_url} alt="" className="aspect-video w-full object-cover" />
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">pending</Badge>
                    <p className="text-sm font-medium">{p.event_title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By {p.uploader_name || p.uploader_email || "Unknown"} ·{" "}
                    {formatDateTime(p.created_at)}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => update.mutate({ id: p.id, status: "approved" })}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => update.mutate({ id: p.id, status: "rejected" })}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => update.mutate({ id: p.id, status: "hidden" })}
                    >
                      Hide
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
