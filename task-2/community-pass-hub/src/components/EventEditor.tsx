import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { EventRow } from "@/lib/db";
import { ImageUpload } from "@/components/ImageUpload";

export function EventEditor({ event }: { event?: EventRow }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: hostOptions = [] } = useQuery({
    queryKey: ["my-hosts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("host_members").select("host_id, hosts(id, name)")
        .eq("user_id", user!.id).eq("role", "host");
      return (data ?? []).map((d) => d.hosts).filter(Boolean) as { id: string; name: string }[];
    },
  });

  const [form, setForm] = useState({
    host_id: event?.host_id ?? "",
    title: event?.title ?? "",
    description: event?.description ?? "",
    start_at: event?.start_at?.slice(0, 16) ?? "",
    end_at: event?.end_at?.slice(0, 16) ?? "",
    timezone: event?.timezone ?? "Europe/Berlin",
    venue_address: event?.venue_address ?? "",
    online_link: event?.online_link ?? "",
    capacity: event?.capacity ?? 50,
    cover_image_url: event?.cover_image_url ?? "",
    visibility: event?.visibility ?? "public",
    status: event?.status ?? "draft",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!form.host_id && hostOptions.length === 1) {
      setForm((f) => ({ ...f, host_id: hostOptions[0].id }));
    }
  }, [hostOptions, form.host_id]);

  const set = (k: keyof typeof form, v: string | number) => setForm({ ...form, [k]: v });

  const save = async (status: "draft" | "published") => {
    if (!form.host_id) { toast.error("Pick a host"); return; }
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.start_at) { toast.error("Start date is required"); return; }
    if (!form.end_at) { toast.error("End date is required"); return; }
    if (!form.timezone.trim()) { toast.error("Timezone is required"); return; }
    if (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) <= 0) {
      toast.error("Capacity must be a positive integer"); return;
    }
    if (new Date(form.end_at) <= new Date(form.start_at)) {
      toast.error("End must be after start"); return;
    }
    if (!form.venue_address.trim() && !form.online_link.trim()) {
      toast.error("Provide a venue address or an online link"); return;
    }
    setSaving(true);
    const payload = {
      host_id: form.host_id,
      title: form.title, description: form.description,
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      timezone: form.timezone,
      venue_address: form.venue_address || null,
      online_link: form.online_link || null,
      capacity: Number(form.capacity),
      cover_image_url: form.cover_image_url || null,
      visibility: form.visibility as "public" | "unlisted",
      status,
    };
    const { error } = event
      ? await supabase.from("events").update(payload).eq("id", event.id)
      : await supabase.from("events").insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "published" ? "Published" : "Saved");
    navigate({ to: "/host/dashboard" });
  };

  return (
    <Card>
      <CardHeader><CardTitle>{event ? "Edit event" : "Create event"}</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {!event && hostOptions.length > 0 && (
          <div>
            <Label htmlFor="h">Host</Label>
            <select id="h" className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.host_id} onChange={(e) => set("host_id", e.target.value)}>
              <option value="">Select a host…</option>
              {hostOptions.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        )}
        <div><Label htmlFor="t">Title</Label><Input id="t" value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div><Label htmlFor="d">Description</Label><Textarea id="d" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="s">Start</Label><Input id="s" type="datetime-local" value={form.start_at} onChange={(e) => set("start_at", e.target.value)} /></div>
          <div><Label htmlFor="e">End</Label><Input id="e" type="datetime-local" value={form.end_at} onChange={(e) => set("end_at", e.target.value)} /></div>
          <div><Label htmlFor="tz">Timezone</Label><Input id="tz" value={form.timezone} onChange={(e) => set("timezone", e.target.value)} /></div>
          <div><Label htmlFor="cap">Capacity</Label><Input id="cap" type="number" value={form.capacity} onChange={(e) => set("capacity", Number(e.target.value))} /></div>
          <div><Label htmlFor="v">Venue address</Label><Input id="v" value={form.venue_address} onChange={(e) => set("venue_address", e.target.value)} /></div>
          <div><Label htmlFor="o">Online link</Label><Input id="o" value={form.online_link} onChange={(e) => set("online_link", e.target.value)} /></div>
        </div>
        <div>
          <Label>Cover image</Label>
          <ImageUpload bucket="event-covers" value={form.cover_image_url} onChange={(url) => set("cover_image_url", url ?? "")} label="Upload cover" />
        </div>

        <div className="flex flex-wrap items-center gap-6 rounded-md border border-border p-4">
          <div className="flex items-center gap-2">
            <Switch id="vis" checked={form.visibility === "public"} onCheckedChange={(v) => set("visibility", v ? "public" : "unlisted")} />
            <Label htmlFor="vis">Public {form.visibility === "unlisted" && "(Unlisted)"}</Label>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <Switch id="paid" checked={false} disabled />
                <Label htmlFor="paid" className="text-muted-foreground">Paid event</Label>
              </div>
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save("draft")} disabled={saving}>Save draft</Button>
          <Button onClick={() => save("published")} disabled={saving}>Publish</Button>
          {event?.status === "published" && (
            <Button variant="outline" onClick={() => save("draft")}>Unpublish</Button>
          )}
          {event && (
            <Button variant="outline" onClick={async () => {
              const start = new Date(event.start_at); start.setDate(start.getDate() + 7);
              const end = new Date(event.end_at); end.setDate(end.getDate() + 7);
              const { data, error } = await supabase.from("events").insert({
                host_id: event.host_id, title: `Copy of ${event.title}`, description: event.description,
                start_at: start.toISOString(), end_at: end.toISOString(), timezone: event.timezone,
                venue_address: event.venue_address, online_link: event.online_link,
                capacity: event.capacity, cover_image_url: event.cover_image_url,
                visibility: event.visibility, pricing_type: event.pricing_type, status: "draft",
              }).select("id").maybeSingle();
              if (error) toast.error(error.message);
              else { toast.success("Event duplicated"); navigate({ to: "/host/events/$eventId/edit", params: { eventId: data!.id } }); }
            }}>
              <Copy className="h-4 w-4" /> Duplicate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
