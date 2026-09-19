import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, MapPin } from "lucide-react";

type Verdict =
  | "Looks complete"
  | "Still ongoing"
  | "Not started / abandoned"
  | "Something looks wrong";

const VERDICTS: Verdict[] = [
  "Looks complete",
  "Still ongoing",
  "Not started / abandoned",
  "Something looks wrong",
];

const MAX_BYTES = 30 * 1024 * 1024;

interface Props {
  projectId: string;
  onSubmitted: () => void;
}

const VerifyProjectDialog = ({ projectId, onSubmitted }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | "">("");
  const [note, setNote] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setVerdict("");
    setNote("");
    setAnonymous(false);
    setFile(null);
    setCoords(null);
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Location unavailable on this device" });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast({ title: "Location attached" });
      },
      () => {
        setLocating(false);
        toast({ variant: "destructive", title: "Could not get your location" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected && selected.size > MAX_BYTES) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please keep photos and clips under 30MB.",
      });
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file || !verdict) return;

    setSubmitting(true);
    const isVideo = file.type.startsWith("video/");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const folder = anonymous ? "anonymous" : user.id;
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setSubmitting(false);
      toast({ variant: "destructive", title: "Upload failed", description: uploadError.message });
      return;
    }

    const { error: insertError } = await supabase.from("project_photos").insert({
      project_id: projectId,
      uploaded_by: anonymous ? null : user.id,
      is_anonymous: anonymous,
      photo_url: path,
      caption: note,
      verdict,
      media_type: isVideo ? "video" : "photo",
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    });

    setSubmitting(false);

    if (insertError) {
      toast({ variant: "destructive", title: "Could not save report", description: insertError.message });
      return;
    }

    toast({
      title: "Report submitted",
      description: anonymous
        ? "Sent anonymously. Thank you for keeping projects honest."
        : "Thank you — your report is now on the project page.",
    });
    reset();
    setOpen(false);
    onSubmitted();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <ShieldCheck className="w-4 h-4" /> Verify this project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report what you saw on site</DialogTitle>
          <DialogDescription>
            Visit the site, capture a photo or short clip, and tell the community what is really there.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Your verdict</Label>
            <Select value={verdict} onValueChange={(v) => setVerdict(v as Verdict)}>
              <SelectTrigger>
                <SelectValue placeholder="What is the state of this project?" />
              </SelectTrigger>
              <SelectContent>
                {VERDICTS.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence">Photo or video evidence</Label>
            <Input
              id="evidence"
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleFile}
            />
            <p className="text-xs text-muted-foreground">
              Up to 30MB. On a phone this opens your camera directly.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Notes (optional)</Label>
            <Textarea
              id="note"
              placeholder="Describe what you found — progress, quality concerns, or anything suspicious."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5 pr-4">
              <Label htmlFor="anon">Submit anonymously</Label>
              <p className="text-xs text-muted-foreground">
                Your name is never stored or shown, not even to admins.
              </p>
            </div>
            <Switch id="anon" checked={anonymous} onCheckedChange={setAnonymous} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="space-y-0.5 pr-4">
              <Label>Attach site location</Label>
              <p className="text-xs text-muted-foreground">
                {coords
                  ? `Attached: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                  : "Optional, helps prove you were on site."}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={captureLocation} disabled={locating}>
              <MapPin className="w-4 h-4 mr-1" />
              {locating ? "Locating..." : coords ? "Update" : "Attach"}
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={submitting || !file || !verdict}>
            {submitting ? "Submitting..." : "Submit report"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VerifyProjectDialog;
