import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface Props {
  eventId: string;
  endAt: string;
}

export function EventFeedback({ eventId, endAt }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const ended = new Date(endAt).getTime() < Date.now();

  const { data: feedback = [] } = useQuery({
    queryKey: ["feedback", eventId],
    enabled: ended,
    queryFn: async () => {
      const { data } = await supabase.from("feedback").select("id, user_id, rating, comment, created_at")
        .eq("event_id", eventId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: myRsvp } = useQuery({
    queryKey: ["my-rsvp-any", eventId, user?.id],
    enabled: !!user && ended,
    queryFn: async () => {
      const { data } = await supabase.from("rsvps").select("status")
        .eq("event_id", eventId).eq("user_id", user!.id).neq("status", "cancelled").maybeSingle();
      return data;
    },
  });

  const mine = user ? feedback.find((f) => f.user_id === user.id) : null;
  const avg = feedback.length ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0;

  const submit = async () => {
    if (!user) return;
    if (rating < 1 || rating > 5) { toast.error("Please select a rating"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("feedback").insert({
      event_id: eventId, user_id: user.id, rating, comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Feedback submitted. Thank you!");
    setComment(""); setRating(0);
    qc.invalidateQueries({ queryKey: ["feedback", eventId] });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Feedback</h2>
        {feedback.length > 0 && (
          <p className="text-sm text-muted-foreground">
            ★ {avg.toFixed(1)} · {feedback.length} rating{feedback.length === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {!ended ? (
        <p className="text-sm text-muted-foreground">Feedback will be available after the event ends.</p>
      ) : !user ? (
        <Link to="/auth" search={{ returnTo: `/events/${eventId}` }}>
          <Button variant="outline">Sign in to leave feedback</Button>
        </Link>
      ) : !myRsvp ? (
        <p className="text-sm text-muted-foreground">Feedback is available for attendees.</p>
      ) : mine ? (
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Thank you for your feedback</p>
          <StarRow value={mine.rating} />
          {mine.comment && <p className="mt-2 text-sm text-muted-foreground">{mine.comment}</p>}
        </div>
      ) : (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div>
            <p className="mb-1 text-sm font-medium">Your rating</p>
            <StarRow value={rating} onChange={setRating} />
          </div>
          <Textarea rows={3} maxLength={1000} placeholder="Optional comment…"
            value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button onClick={submit} disabled={submitting}>Submit feedback</Button>
        </div>
      )}

      {ended && feedback.length > 0 && (
        <ul className="space-y-3">
          {feedback.slice(0, 10).map((f) => (
            <li key={f.id} className="rounded-md border border-border p-3">
              <StarRow value={f.rating} />
              {f.comment && <p className="mt-1 text-sm text-muted-foreground">{f.comment}</p>}
            </li>
          ))}
        </ul>
      )}
      {ended && feedback.length === 0 && <p className="text-sm text-muted-foreground">No feedback yet.</p>}
    </section>
  );
}

function StarRow({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange?.(n)} disabled={!onChange}
          className={onChange ? "cursor-pointer" : "cursor-default"} aria-label={`${n} stars`}>
          <Star className={`h-5 w-5 ${n <= value ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}
