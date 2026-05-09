import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface Props {
  targetType: "event" | "photo";
  targetId: string;
  /** Where to return after sign-in if user is not authenticated. */
  returnTo: string;
  triggerLabel?: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default";
}

export function ReportDialog({ targetType, targetId, returnTo, triggerLabel, variant = "ghost", size = "sm" }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onTriggerClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate({ to: "/auth", search: { returnTo } });
    }
  };

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: reason.trim() || null,
      status: "open",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Report submitted for review.");
    setReason("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} onClick={onTriggerClick}>
          <Flag className="h-4 w-4" /> {triggerLabel ?? `Report ${targetType}`}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report this {targetType}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea id="reason" rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder={`Tell us what's wrong with this ${targetType}…`} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>Submit report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
