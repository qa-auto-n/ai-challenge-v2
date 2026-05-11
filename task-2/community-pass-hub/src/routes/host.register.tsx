import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";

export const Route = createFileRoute("/host/register")({
  head: () => ({ meta: [{ title: "Become a host — CommunityPass" }] }),
  component: HostRegister,
});

function HostRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", logoUrl: "", bio: "", contactEmail: "" });
  const [loading, setLoading] = useState(false);
  const update =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    if (!user) {
      navigate({ to: "/auth", search: { returnTo: "/host/register" } });
      return;
    }
    setLoading(true);
    const { data: host, error } = await supabase
      .from("hosts")
      .insert({
        name: form.name,
        logo_url: form.logoUrl || null,
        bio: form.bio || null,
        contact_email: form.contactEmail,
        owner_user_id: user.id,
      })
      .select()
      .single();
    if (error || !host) {
      toast.error(error?.message ?? "Failed");
      setLoading(false);
      return;
    }
    const { error: memberErr } = await supabase.from("host_members").insert({
      host_id: host.id,
      user_id: user.id,
      role: "host",
    });
    setLoading(false);
    if (memberErr) {
      toast.error(memberErr.message);
      return;
    }
    toast.success("Host created!");
    navigate({ to: "/host/dashboard" });
  };

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-xl px-4 py-12">
        <h1 className="text-3xl font-bold">Become a host</h1>
        <p className="mt-1 text-muted-foreground">Tell us about your community.</p>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Host profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Organization name</Label>
              <Input id="name" value={form.name} onChange={update("name")} />
            </div>
            <div>
              <Label>Logo</Label>
              <ImageUpload
                bucket="host-logos"
                aspect="square"
                value={form.logoUrl}
                onChange={(url) => setForm({ ...form, logoUrl: url ?? "" })}
                label="Upload logo"
              />
            </div>
            <div>
              <Label htmlFor="bio">Short bio</Label>
              <Textarea id="bio" rows={3} value={form.bio} onChange={update("bio")} />
            </div>
            <div>
              <Label htmlFor="email">Contact email</Label>
              <Input
                id="email"
                type="email"
                value={form.contactEmail}
                onChange={update("contactEmail")}
              />
            </div>
            <Button
              className="w-full"
              onClick={submit}
              disabled={loading || !form.name || !form.contactEmail}
            >
              Submit
            </Button>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
