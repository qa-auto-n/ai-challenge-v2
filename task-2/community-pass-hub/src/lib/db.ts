import type { Database } from "@/integrations/supabase/types";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type HostRow = Database["public"]["Tables"]["hosts"]["Row"];
export type RsvpRow = Database["public"]["Tables"]["rsvps"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type HostMemberRow = Database["public"]["Tables"]["host_members"]["Row"];
export type GalleryPhotoRow = Database["public"]["Tables"]["gallery_photos"]["Row"];
export type ReportRow = Database["public"]["Tables"]["reports"]["Row"];

export const isPast = (e: { end_at: string }) => new Date(e.end_at).getTime() < Date.now();

export function formatDateTime(iso: string, tz?: string) {
  const d = new Date(iso);
  // Stable format to avoid SSR/CSR hydration mismatches across locales.
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
    hour12: false,
  });
  return fmt.format(d);
}

export function genTicketCode() {
  return "CP-" + Math.random().toString(36).substring(2, 10).toUpperCase();
}
