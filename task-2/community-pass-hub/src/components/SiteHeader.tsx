import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Ticket } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMyMemberships } from "@/lib/permissions";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const memberships = useMyMemberships();
  const ms = memberships.data ?? [];
  const isHost = ms.some((m) => m.role === "host");
  const isChecker = !isHost && ms.some((m) => m.role === "checker");
  const [open, setOpen] = useState(false);

  const links: { to: string; label: string }[] = [{ to: "/explore", label: "Explore" }];
  if (user) links.push({ to: "/tickets", label: "My Tickets" });
  if (user && (isHost || isChecker)) links.push({ to: "/my-events", label: "My Events" });
  if (isHost) {
    links.push({ to: "/host/dashboard", label: "Dashboard" });
    links.push({ to: "/host/gallery-review", label: "Gallery" });
    links.push({ to: "/host/reports", label: "Reports" });
  }

  const navLinkClass = "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";
  const navLinkActiveClass = "rounded-md px-3 py-2 text-sm font-medium text-foreground bg-accent";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Ticket className="h-5 w-5 text-primary" />
          <span>CommunityPass</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={navLinkClass} activeProps={{ className: navLinkActiveClass }}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={() => signOut()} className="hidden md:inline-flex">Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/auth" className="hidden md:inline-flex"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link to="/host/register" className="hidden md:inline-flex"><Button size="sm">Become a host</Button></Link>
            </>
          )}

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="mt-6 flex flex-col gap-1">
                {links.map((l) => (
                  <Link key={l.to} to={l.to} className={navLinkClass} activeProps={{ className: navLinkActiveClass }}
                    onClick={() => setOpen(false)}>
                    {l.label}
                  </Link>
                ))}
                <div className="mt-4 border-t border-border pt-4 flex flex-col gap-2">
                  {user ? (
                    <>
                      <p className="px-3 text-xs text-muted-foreground truncate">{user.email}</p>
                      <Button variant="ghost" size="sm" onClick={() => { signOut(); setOpen(false); }}>Sign out</Button>
                    </>
                  ) : (
                    <>
                      <Link to="/auth" onClick={() => setOpen(false)}><Button variant="ghost" size="sm" className="w-full">Sign in</Button></Link>
                      <Link to="/host/register" onClick={() => setOpen(false)}><Button size="sm" className="w-full">Become a host</Button></Link>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
