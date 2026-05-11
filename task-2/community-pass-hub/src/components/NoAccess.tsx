import { Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export function NoAccess({
  message,
  returnTo,
  primaryLabel,
}: {
  message?: string;
  returnTo?: string;
  primaryLabel?: string;
}) {
  return (
    <SiteLayout>
      <div className="container mx-auto max-w-md px-4 py-20 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-muted-foreground">
          {message ?? "You do not have permission to access this page."}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to={(returnTo ?? "/explore") as "/explore"}>
            <Button>{primaryLabel ?? "Go back"}</Button>
          </Link>
          <Link to="/">
            <Button variant="outline">Home</Button>
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
