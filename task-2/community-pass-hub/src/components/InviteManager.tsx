import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

function genToken() {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 36).toString(36)).join("");
}

export function InviteManager({ hostId }: { hostId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [origin, setOrigin] = useState(typeof window !== "undefined" ? window.location.origin : "");
  if (typeof window !== "undefined" && !origin) setOrigin(window.location.origin);

  const { data: invites = [] } = useQuery({
    queryKey: ["host-invites", hostId],
    queryFn: async () => {
      const { data } = await supabase.from("host_invites").select("*").eq("host_id", hostId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (role: "host" | "checker") => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("host_invites").insert({
        host_id: hostId, role, token: genToken(), created_by_user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Invite link created"); qc.invalidateQueries({ queryKey: ["host-invites", hostId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("host_invites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Invite removed"); qc.invalidateQueries({ queryKey: ["host-invites", hostId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const copy = (token: string) => {
    const url = `${origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite URL copied");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => create.mutate("host")} disabled={create.isPending}>Create Host Invite Link</Button>
          <Button size="sm" variant="secondary" onClick={() => create.mutate("checker")} disabled={create.isPending}>Create Checker Invite Link</Button>
        </div>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invite links yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="flex items-center gap-2">
                  <Badge variant={i.role === "host" ? "default" : "secondary"}>{i.role}</Badge>
                  <code className="font-mono text-xs text-muted-foreground break-all">{origin}/invite/{i.token}</code>
                  {i.used_by_user_id && <Badge variant="outline">used</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => copy(i.token)} aria-label="Copy invite URL"><Copy className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove.mutate(i.id)} aria-label="Delete invite"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
