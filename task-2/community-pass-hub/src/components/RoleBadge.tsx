import { Badge } from "@/components/ui/badge";

export function RoleBadge({ role }: { role: string }) {
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  const variant = role === "host" ? "default" : role === "checker" ? "secondary" : "outline";
  return <Badge variant={variant as never}>{label}</Badge>;
}
