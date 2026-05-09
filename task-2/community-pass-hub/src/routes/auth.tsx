import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const schema = z.object({ returnTo: fallback(z.string(), "/").default("/") });

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(schema),
  head: () => ({ meta: [{ title: "Sign in — CommunityPass" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { returnTo } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: returnTo, replace: true });
  }, [user, returnTo, navigate]);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
  };

  const signUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}${returnTo}` },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created! Check your email to confirm before signing in.");
  };

  return (
    <SiteLayout>
      <div className="container mx-auto max-w-md px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to CommunityPass</CardTitle>
            <p className="text-sm text-muted-foreground">RSVP requires sign-in. You'll be returned to <code className="font-mono text-xs">{returnTo}</code>.</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="space-y-4 pt-4">
                <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label htmlFor="pw">Password</Label><Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button className="w-full" onClick={signIn} disabled={loading}>Sign in</Button>
              </TabsContent>
              <TabsContent value="signup" className="space-y-4 pt-4">
                <div><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label htmlFor="email2">Email</Label><Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label htmlFor="pw2">Password</Label><Input id="pw2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button className="w-full" onClick={signUp} disabled={loading}>Create account</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
