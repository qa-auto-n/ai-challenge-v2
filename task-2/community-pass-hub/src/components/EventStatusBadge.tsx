import { Badge } from "@/components/ui/badge";
import { isPast } from "@/lib/db";

export function EventStatusBadge({ endAt }: { endAt: string }) {
  if (isPast({ end_at: endAt })) return <Badge variant="secondary">Ended</Badge>;
  return <Badge>Upcoming</Badge>;
}
