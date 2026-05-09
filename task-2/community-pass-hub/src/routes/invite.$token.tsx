import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({
  head: () => ({ meta: [{ title: "Invite — CommunityPass" }] }),
  component: InvitePage,
});

type Status =
  | { kind: "loading" }
  | { kind: "invalid"; message: string }
  | { kind: "ok"; hostName: string; role: "host" | "checker"; alreadyMember: boolean };

function InvitePage() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth", search: { returnTo: `/invite/${token}` } });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: invite } = await supabase.from("host_invites").select("*, hosts(name)").eq("token", token).maybeSingle();
      if (!invite) { if (!cancelled) setStatus({ kind: "invalid", message: "Invalid invite link." }); return; }
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        if (!cancelled) setStatus({ kind: "invalid", message: "This invite has expired." }); return;
      }
      const hostName = (invite as unknown as { hosts: { name: string } }).hosts?.name ?? "this host";

      // Check existing membership
      const { data: existing } = await supabase.from("host_members").select("role")
        .eq("host_id", invite.host_id).eq("user_id", user.id).maybeSingle();

      if (existing) {
        if (!cancelled) setStatus({ kind: "ok", hostName, role: invite.role, alreadyMember: true });
        return;
      }

      const { error } = await supabase.from("host_members").insert({
        host_id: invite.host_id, user_id: user.id, role: invite.role,
      });
      if (error) {
        if (!cancelled) setStatus({ kind: "invalid", message: error.message });
        return;
      }
      if (!invite.used_by_user_id) {
        await supabase.from("host_invites").update({ used_by_user_id: user.id }).eq("id", invite.id);
      }
      toast.success(`You joined ${hostName} as ${invite.role}`);
      if (!cancelled) setStatus({ kind: "ok", hostName, role: invite.role, alreadyMember: false });
    })();
    return () => { cancelled = true; };
  }, [user, loading, token, navigate]);

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-md px-4 py-20">
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            {status.kind === "loading" && <p>Processing invite…</p>}
            {status.kind === "invalid" && (
              <>
                <h1 className="text-2xl font-bold">Invite unavailable</h1>
                <p className="text-muted-foreground">{status.message}</p>
                <Link to="/"><Button variant="outline">Home</Button></Link>
              </>
            )}
            {status.kind === "ok" && (
              <>
                <h1 className="text-2xl font-bold">
                  {status.alreadyMember ? "You're already a member" : `Welcome to ${status.hostName}`}
                </h1>
                <p className="text-muted-foreground">
                  {status.alreadyMember
                    ? `You're already part of ${status.hostName}.`
                    : `You joined ${status.hostName} as ${status.role}.`}
                </p>
                <div className="flex justify-center gap-2">
                  {status.role === "host" ? (
                    <Link to="/host/dashboard"><Button>Open Host dashboard</Button></Link>
                  ) : (
                    <Link to="/my-events"><Button>Go to My Events</Button></Link>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
