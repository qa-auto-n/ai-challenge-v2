import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ImageUpload";
import { ReportDialog } from "@/components/ReportDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface Props {
  eventId: string;
}

export function EventGallery({ eventId }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: approved = [] } = useQuery({
    queryKey: ["gallery-approved", eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from("gallery_photos")
        .select("id, image_url, created_at")
        .eq("event_id", eventId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: mine = [] } = useQuery({
    queryKey: ["gallery-mine", eventId, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("gallery_photos")
        .select("id, image_url, status, created_at")
        .eq("event_id", eventId)
        .eq("uploaded_by_user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data ?? []).filter((p) => p.status !== "approved");
    },
  });

  const onUploadClick = () => {
    if (!user) navigate({ to: "/auth", search: { returnTo: `/events/${eventId}` } });
  };

  const submit = async () => {
    if (!user || !pendingUrl) return;
    setSubmitting(true);
    const { error } = await supabase.from("gallery_photos").insert({
      event_id: eventId,
      image_url: pendingUrl,
      uploaded_by_user_id: user.id,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Photo uploaded and waiting for host approval.");
    setPendingUrl(null);
    qc.invalidateQueries({ queryKey: ["gallery-mine", eventId] });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Gallery</h2>
      </div>

      {approved.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos yet. Be the first to share!</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {approved.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden rounded-md border border-border"
            >
              <img
                src={p.image_url}
                alt=""
                className="aspect-square w-full object-cover"
                loading="lazy"
              />
              <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                <ReportDialog
                  targetType="photo"
                  targetId={p.id}
                  returnTo={`/events/${eventId}`}
                  triggerLabel="Report"
                  variant="outline"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {user && mine.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Your submissions</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {mine.map((p) => (
              <div key={p.id} className="relative overflow-hidden rounded-md border border-border">
                <img src={p.image_url} alt="" className="aspect-square w-full object-cover" />
                <div className="absolute left-1 top-1">
                  <Badge variant={p.status === "rejected" ? "destructive" : "secondary"}>
                    {p.status === "pending" ? "Pending approval" : p.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border p-4">
        <h3 className="font-semibold">Share a photo</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Photos appear in the gallery after host approval.
        </p>
        {!user ? (
          <Button variant="outline" onClick={onUploadClick}>
            Sign in to upload
          </Button>
        ) : (
          <>
            <ImageUpload
              bucket="gallery-photos"
              value={pendingUrl}
              onChange={setPendingUrl}
              label="Upload photo"
            />
            {pendingUrl && (
              <Button className="mt-3" size="sm" onClick={submit} disabled={submitting}>
                Submit for review
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
