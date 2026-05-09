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

export const Route = createFileRoute("/host/reports")({
  head: () => ({ meta: [{ title: "Reports — CommunityPass" }] }),
  component: Reports,
});

interface EnrichedReport {
  id: string;
  target_type: "event" | "photo";
  target_id: string;
  reason: string | null;
  status: string;
  created_at: string;
  reporter_user_id: string;
  reporter_name?: string;
  reporter_email?: string;
  event_title?: string;
  photo_url?: string;
}

function Reports() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const memberships = useMyMemberships();

  const { data = [] } = useQuery({
    queryKey: ["open-reports", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<EnrichedReport[]> => {
      const { data: rows } = await supabase.from("reports").select("*")
        .eq("status", "open").order("created_at", { ascending: false });
      const list = (rows ?? []) as EnrichedReport[];
      if (list.length === 0) return [];

      const eventIds = list.filter((r) => r.target_type === "event").map((r) => r.target_id);
      const photoIds = list.filter((r) => r.target_type === "photo").map((r) => r.target_id);
      const userIds = Array.from(new Set(list.map((r) => r.reporter_user_id)));

      const [{ data: events }, { data: photos }, { data: profiles }] = await Promise.all([
        eventIds.length ? supabase.from("events").select("id, title").in("id", eventIds) : Promise.resolve({ data: [] }),
        photoIds.length ? supabase.from("gallery_photos").select("id, image_url, event_id").in("id", photoIds) : Promise.resolve({ data: [] }),
        supabase.from("profiles").select("id, name, email").in("id", userIds),
      ]);

      const photoEventIds = (photos ?? []).map((p) => p.event_id);
      const { data: photoEvents } = photoEventIds.length
        ? await supabase.from("events").select("id, title").in("id", photoEventIds)
        : { data: [] };

      const evMap = new Map((events ?? []).map((e) => [e.id, e]));
      const photoMap = new Map((photos ?? []).map((p) => [p.id, p]));
      const photoEvMap = new Map((photoEvents ?? []).map((e) => [e.id, e]));
      const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      return list.map((r) => {
        const reporter = pMap.get(r.reporter_user_id);
        if (r.target_type === "event") {
          return { ...r, event_title: evMap.get(r.target_id)?.title, reporter_name: reporter?.name ?? undefined, reporter_email: reporter?.email ?? undefined };
        }
        const photo = photoMap.get(r.target_id);
        return {
          ...r,
          photo_url: photo?.image_url,
          event_title: photo ? photoEvMap.get(photo.event_id)?.title : undefined,
          reporter_name: reporter?.name ?? undefined,
          reporter_email: reporter?.email ?? undefined,
        };
      });
    },
  });

  const hide = useMutation({
    mutationFn: async (r: EnrichedReport) => {
      if (r.target_type === "event") {
        const { error } = await supabase.from("events").update({ hidden: true }).eq("id", r.target_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("gallery_photos").update({ status: "hidden" }).eq("id", r.target_id);
        if (error) throw error;
      }
      const { error: rerr } = await supabase.from("reports").update({ status: "hidden" }).eq("id", r.id);
      if (rerr) throw rerr;
    },
    onSuccess: () => { toast.success("Item hidden"); qc.invalidateQueries({ queryKey: ["open-reports"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reports").update({ status: "dismissed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Report dismissed"); qc.invalidateQueries({ queryKey: ["open-reports"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) return <SiteLayout><div className="p-20 text-center">Please <Link to="/auth" search={{ returnTo: "/host/reports" }} className="text-primary underline">sign in</Link>.</div></SiteLayout>;
  if (memberships.isLoading) return <SiteLayout><div className="p-20 text-center">Loading…</div></SiteLayout>;
  if (!hasHostRole(memberships.data)) return <NoAccess message="Only hosts can review reports." />;

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Report queue</h1>
        <p className="mt-1 text-muted-foreground">Open reports for events and photos under your hosts.</p>
        {data.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-border p-12 text-center">
            <h3 className="font-semibold">Nothing to review</h3>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {data.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-start justify-between gap-4 p-4">
                  <div className="flex flex-1 items-start gap-4">
                    {r.target_type === "photo" && r.photo_url && (
                      <img src={r.photo_url} alt="" className="h-20 w-20 rounded-md object-cover" />
                    )}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{r.target_type}</Badge>
                        <span className="font-medium">{r.event_title ?? "—"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.reason || <em>No reason given</em>}</p>
                      <p className="text-xs text-muted-foreground">
                        Reported by {r.reporter_name || r.reporter_email || "anonymous"} · {formatDateTime(r.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {r.target_type === "event" && (
                      <Link to="/events/$eventId" params={{ eventId: r.target_id }}><Button variant="ghost" size="sm">View</Button></Link>
                    )}
                    <Button variant="outline" size="sm" onClick={() => hide.mutate(r)} disabled={hide.isPending}>Hide item</Button>
                    <Button variant="ghost" size="sm" onClick={() => dismiss.mutate(r.id)} disabled={dismiss.isPending}>Dismiss</Button>
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
