import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv, rowsToCsv, slugify, formatLocalDateTime, rsvpStatusLabel } from "@/lib/csv";

type Variant = "rsvps" | "attendance";

interface Props {
  label: string;
  eventId: string;
  eventTitle?: string;
  variant?: Variant;
  /** When false, button shows a permission-denied toast on click. */
  canExport?: boolean;
}

const HEADERS = ["name", "email", "RSVP status", "check-in time"];

export function CsvExportButton({
  label,
  eventId,
  eventTitle,
  variant = "rsvps",
  canExport = true,
}: Props) {
  const handleClick = async () => {
    if (!canExport) {
      toast.error("You do not have permission to export this data.");
      return;
    }
    const { data, error } = await supabase
      .from("rsvps")
      .select("user_id, status, checked_in_at, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    let rsvps = data ?? [];
    if (variant === "attendance") {
      // Going + Waitlist always; Cancelled only if previously checked-in.
      rsvps = rsvps.filter(
        (r) =>
          r.status === "going" ||
          r.status === "waitlist" ||
          (r.status === "cancelled" && r.checked_in_at),
      );
    }
    const userIds = Array.from(new Set(rsvps.map((r) => r.user_id)));
    const [{ data: profiles }, { data: demos }] = await Promise.all([
      supabase.from("profiles").select("id, name, email").in("id", userIds),
      supabase.from("demo_attendees").select("user_id, name, email").in("user_id", userIds),
    ]);
    const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    const dMap = new Map((demos ?? []).map((d) => [d.user_id, d]));

    const rows = rsvps.map((r) => {
      const p = pMap.get(r.user_id);
      const d = dMap.get(r.user_id);
      return [
        p?.name ?? d?.name ?? "",
        p?.email ?? d?.email ?? "",
        rsvpStatusLabel(r.status),
        formatLocalDateTime(r.checked_in_at),
      ];
    });

    if (rows.length === 0) {
      toast.message("Nothing to export yet");
      return;
    }
    const slug = slugify(eventTitle ?? eventId);
    const filename = `communitypass-${variant === "attendance" ? "attendance" : "rsvps"}-${slug}.csv`;
    downloadCsv(filename, rowsToCsv(HEADERS, rows));
    toast.success(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"}`);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleClick}>
      <Download className="h-4 w-4" /> {label}
    </Button>
  );
}
