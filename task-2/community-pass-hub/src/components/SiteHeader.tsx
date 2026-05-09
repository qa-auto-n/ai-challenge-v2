import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMyMemberships } from "@/lib/permissions";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const memberships = useMyMemberships();
  const ms = memberships.data ?? [];
  const isHost = ms.some((m) => m.role === "host");
  const isChecker = !isHost && ms.some((m) => m.role === "checker");

  const links: { to: string; label: string }[] = [{ to: "/explore", label: "Explore" }];
  if (user) links.push({ to: "/tickets", label: "My Tickets" });
  if (user && (isHost || isChecker)) links.push({ to: "/my-events", label: "My Events" });
  if (isHost) {
    links.push({ to: "/host/dashboard", label: "Dashboard" });
    links.push({ to: "/host/gallery-review", label: "Gallery" });
    links.push({ to: "/host/reports", label: "Reports" });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Ticket className="h-5 w-5 text-primary" />
          <span>CommunityPass</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-foreground bg-accent" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/host/register"><Button size="sm">Become a host</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
