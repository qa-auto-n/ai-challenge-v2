import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EventRow } from "@/lib/db";

interface Props {
  event: EventRow;
  size?: "sm" | "default";
}

export function EventActions({ event, size = "sm" }: Props) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const setStatus = useMutation({
    mutationFn: async (status: "draft" | "published") => {
      const { error } = await supabase.from("events").update({ status }).eq("id", event.id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      toast.success(status === "published" ? "Event published" : "Event unpublished");
      qc.invalidateQueries({ queryKey: ["dashboard-events"] });
      qc.invalidateQueries({ queryKey: ["my-events"] });
      qc.invalidateQueries({ queryKey: ["explore-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: async () => {
      const start = new Date(event.start_at);
      const end = new Date(event.end_at);
      start.setDate(start.getDate() + 7);
      end.setDate(end.getDate() + 7);
      const { data, error } = await supabase
        .from("events")
        .insert({
          host_id: event.host_id,
          title: `Copy of ${event.title}`,
          description: event.description,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          timezone: event.timezone,
          venue_address: event.venue_address,
          online_link: event.online_link,
          capacity: event.capacity,
          cover_image_url: event.cover_image_url,
          visibility: event.visibility,
          pricing_type: event.pricing_type,
          status: "draft",
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      return data!.id;
    },
    onSuccess: (id) => {
      toast.success("Event duplicated");
      qc.invalidateQueries({ queryKey: ["dashboard-events"] });
      navigate({ to: "/host/events/$eventId/edit", params: { eventId: id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      {event.status === "draft" ? (
        <Button
          variant="outline"
          size={size}
          onClick={() => setStatus.mutate("published")}
          disabled={setStatus.isPending}
        >
          <Eye className="h-4 w-4" /> Publish
        </Button>
      ) : (
        <Button
          variant="outline"
          size={size}
          onClick={() => setStatus.mutate("draft")}
          disabled={setStatus.isPending}
        >
          <EyeOff className="h-4 w-4" /> Unpublish
        </Button>
      )}
      <Button
        variant="outline"
        size={size}
        onClick={() => duplicate.mutate()}
        disabled={duplicate.isPending}
      >
        <Copy className="h-4 w-4" /> Duplicate
      </Button>
    </>
  );
}
