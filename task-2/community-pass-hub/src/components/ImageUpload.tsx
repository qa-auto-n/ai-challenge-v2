import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

interface Props {
  bucket: "host-logos" | "event-covers" | "gallery-photos";
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: "square" | "video";
}

export function ImageUpload({ bucket, value, onChange, label = "Upload image", aspect = "video" }: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!user) {
      toast.error("Sign in to upload");
      return;
    }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className={`relative overflow-hidden rounded-lg border border-dashed border-border bg-muted ${aspect === "video" ? "aspect-video" : "aspect-square w-32"}`}>
        {value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-foreground hover:bg-background"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" /> {busy ? "Uploading…" : label}
      </Button>
    </div>
  );
}
