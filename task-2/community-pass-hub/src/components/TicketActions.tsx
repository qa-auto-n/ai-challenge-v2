import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarPlus, X } from "lucide-react";
import { buildICS, downloadICS } from "@/lib/ics";
import type { EventRow, RsvpRow } from "@/lib/db";

interface Props {
  rsvp: Pick<RsvpRow, "id" | "status" | "ticket_code">;
  event: Pick<EventRow, "id" | "title" | "description" | "start_at" | "end_at" | "venue_address" | "online_link">;
  onCancel: (rsvpId: string) => void;
  cancelling?: boolean;
  qrSize?: number;
}

export function TicketActions({ rsvp, event, onCancel, cancelling, qrSize = 96 }: Props) {
  const isWaitlist = rsvp.status === "waitlist";

  const addToCalendar = () => {
    const ics = buildICS({
      uid: rsvp.ticket_code,
      title: event.title,
      description: event.description ?? "",
      startISO: event.start_at,
      endISO: event.end_at,
      location: event.online_link || event.venue_address || "",
      url: typeof window !== "undefined" ? `${window.location.origin}/events/${event.id}` : null,
    });
    downloadICS(`${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`, ics);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-col items-center gap-1">
        <div className={`rounded-md border bg-white p-2 ${isWaitlist ? "opacity-50" : ""}`}>
          <QRCodeSVG value={rsvp.ticket_code} size={qrSize} />
        </div>
        <code className="font-mono text-xs text-muted-foreground">{rsvp.ticket_code}</code>
        {isWaitlist && <span className="text-[10px] text-muted-foreground">Not valid for entry</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={addToCalendar}>
          <CalendarPlus className="h-4 w-4" /> Add to Calendar
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={cancelling}>
              <X className="h-4 w-4" /> Cancel RSVP
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel your RSVP?</AlertDialogTitle>
              <AlertDialogDescription>
                Your spot will be released and the next waitlisted attendee may be promoted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep RSVP</AlertDialogCancel>
              <AlertDialogAction onClick={() => onCancel(rsvp.id)}>Cancel RSVP</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
