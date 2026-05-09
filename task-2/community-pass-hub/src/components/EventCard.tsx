import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { EventStatusBadge } from "./EventStatusBadge";
import { Calendar, MapPin, Users, Video } from "lucide-react";
import { EventRow, formatDateTime } from "@/lib/db";

interface Props {
  event: EventRow;
  hostName?: string;
  goingCount?: number;
  waitlistCount?: number;
}

export function EventCard({ event, hostName, goingCount = 0, waitlistCount = 0 }: Props) {
  return (
    <Link to="/events/$eventId" params={{ eventId: event.id }} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-lg pt-0">
        <div className="aspect-video overflow-hidden bg-muted">
          {event.cover_image_url && (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          )}
        </div>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{event.title}</h3>
            <EventStatusBadge endAt={event.end_at} />
          </div>
          {hostName && <p className="text-sm text-muted-foreground">by {hostName}</p>}
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(event.start_at, event.timezone)}</span>
            </div>
            <div className="flex items-center gap-2">
              {event.online_link ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              <span className="truncate">{event.online_link ? "Online" : event.venue_address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>
                {goingCount}/{event.capacity} going
                {waitlistCount > 0 ? ` · ${waitlistCount} waitlist` : ""}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
