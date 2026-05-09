import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type HostRole = "host" | "checker";

export interface Membership {
  host_id: string;
  role: HostRole;
  hosts: { id: string; name: string } | null;
}

export function useMyMemberships() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-memberships", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Membership[]> => {
      const { data, error } = await supabase
        .from("host_members")
        .select("host_id, role, hosts(id, name)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as unknown as Membership[];
    },
  });
}

export function hasHostRole(memberships: Membership[] | undefined, hostId?: string) {
  if (!memberships) return false;
  return memberships.some((m) => m.role === "host" && (!hostId || m.host_id === hostId));
}

export function canCheckIn(memberships: Membership[] | undefined, hostId: string) {
  if (!memberships) return false;
  return memberships.some((m) => m.host_id === hostId);
}
