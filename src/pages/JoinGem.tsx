import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BrandLogo from "@/components/BrandLogo";
import { GEM_WARDS, GEM_COMMITTEES, GEM_PLEDGE } from "@/lib/gem";
import { getSignedUrl } from "@/lib/storage";
import { BadgeCheck, Clock, AlertTriangle, XCircle, Upload, FileText } from "lucide-react";

type Status = "pending" | "approved" | "needs_info" | "rejected";

interface Application {
  id: string;
  full_name: string;
  phone: string;
  residential_address: string;
  ward: string;
  nin: string;
  voter_card_number: string | null;
  nimc_document_path: string;
  profession: string;
  skills: string;
  committee_interest: string;
  status: Status;
  admin_notes: string | null;
  membership_id: string | null;
  approved_at: string | null;
  created_at: string;
}

const emptyForm = {
  full_name: "",
  phone: "",
  residential_address: "",
  ward: GEM_WARDS[0] as string,
  nin: "",
  voter_card_number: "",
  profession: "",
  skills: "",
  committee_interest: GEM_COMMITTEES[0] as string,
};

export default function JoinGem() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [pledge, setPledge] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchApplication();
  }, [user, authLoading]);

  const fetchApplication = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gem_memberships")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();

    const app = (data as Application) || null;
    setApplication(app);
    if (app) {
      setForm({
        full_name: app.full_name,
        phone: app.phone,
        residential_address: app.residential_address,
        ward: app.ward,
        nin: app.nin,
        voter_card_number: app.voter_card_number || "",
        profession: app.profession,
        skills: app.skills,
        committee_interest: app.committee_interest,
      });
      setPledge(true);
      getSignedUrl("membership-docs", app.nimc_document_path).then(setDocUrl);
      setEditing(app.status === "needs_info");
    }
    setLoading(false);
  };

  const validate = () => {
    if (!/^\d{11}$/.test(form.nin.trim())) {
      toast({
        title: "Check your NIN",
        description: "Your National Identification Number must be exactly 11 digits.",
        variant: "destructive",
      });
      return false;
    }
    if (!form.full_name.trim() || !form.phone.trim() || !form.residential_address.trim()) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return false;
    }
    if (!pledge) {
      toast({ title: "Please accept the movement pledge", variant: "destructive" });
      return false;
    }
    if (!application && !file) {
      toast({
        title: "ID document required",
        description: "Upload a clear photo or scan of your NIMC slip or National ID card.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;

    setSubmitting(true);
    let path = application?.nimc_document_path ?? "";

    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        toast({ title: "File too large", description: "Keep it under 15MB.", variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const ext = file.name.split(".").pop() || "jpg";
      const newPath = `${user.id}/nimc-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("membership-docs")
        .upload(newPath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      path = newPath;
    }

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      residential_address: form.residential_address.trim(),
      ward: form.ward,
      nin: form.nin.trim(),
      voter_card_number: form.voter_card_number.trim() || null,
      nimc_document_path: path,
      profession: form.profession.trim(),
      skills: form.skills.trim(),
      committee_interest: form.committee_interest,
      pledge_accepted: true,
    };

    const { error } = application
      ? await supabase
          .from("gem_memberships")
          .update({ ...payload, status: "pending" as const, admin_notes: null })
          .eq("id", application.id)
      : await supabase.from("gem_memberships").insert({ ...payload, user_id: user.id });

    setSubmitting(false);

    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Application submitted",
      description: "The movement's leadership will review it shortly.",
    });
    setFile(null);
    setEditing(false);
    fetchApplication();
  };

  const statusMeta: Record<Status, { label: string; icon: typeof Clock; tone: string }> = {
    pending: { label: "Under review", icon: Clock, tone: "text-amber-500" },
    approved: { label: "Approved member", icon: BadgeCheck, tone: "text-primary" },
    needs_info: { label: "More information needed", icon: AlertTriangle, tone: "text-amber-500" },
    rejected: { label: "Not approved", icon: XCircle, tone: "text-destructive" },
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto max-w-3xl px-6 pt-24 pb-20">
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  const showForm = !application || editing;
  const meta = application ? statusMeta[application.status] : null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto max-w-3xl px-6 pt-24 pb-20">
        <div className="text-center">
          <BrandLogo imageClassName="mx-auto h-16 w-auto" />
          <h1 className="mt-4 text-3xl font-bold">Official GEM Membership</h1>
          <p className="mt-2 text-muted-foreground">
            Register as a recognised member of the Gwagwalada Elite Movement. Applications are
            reviewed and approved by the movement's leadership.
          </p>
          <Link to="/movement" className="mt-2 inline-block text-sm text-primary hover:underline">
            Learn about the movement
          </Link>
        </div>

        {/* Approved member card */}
        {application?.status === "approved" && (
          <Card className="mt-8 overflow-hidden border-primary/40">
            <div className="gradient-primary p-6 text-primary-foreground">
              <div className="flex items-center justify-between">
                <BrandLogo imageClassName="h-12 w-auto" />
                <Badge className="bg-background/20 text-primary-foreground">Official Member</Badge>
              </div>
              <div className="mt-6">
                <div className="text-2xl font-bold">{application.full_name}</div>
                <div className="text-sm opacity-90">{application.ward} Ward</div>
              </div>
              <div className="mt-4 flex items-end justify-between text-sm">
                <div>
                  <div className="opacity-75">Membership number</div>
                  <div className="font-mono font-semibold">{application.membership_id}</div>
                </div>
                <div className="text-right">
                  <div className="opacity-75">Approved</div>
                  <div className="font-semibold">
                    {application.approved_at
                      ? new Date(application.approved_at).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Your GEM Member badge now appears beside your name across the app.
            </CardContent>
          </Card>
        )}

        {/* Status panel */}
        {application && application.status !== "approved" && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 text-lg ${meta!.tone}`}>
                {(() => {
                  const Icon = meta!.icon;
                  return <Icon className="h-5 w-5" />;
                })()}
                {meta!.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Submitted {new Date(application.created_at).toLocaleDateString()}
              </p>
              {application.admin_notes && (
                <div className="rounded-lg border border-border bg-muted/50 p-4">
                  <div className="font-semibold">Message from the leadership</div>
                  <p className="mt-1 text-muted-foreground">{application.admin_notes}</p>
                </div>
              )}
              {docUrl && (
                <a
                  href={docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" /> View the ID document you uploaded
                </a>
              )}
              {!editing && application.status !== "rejected" && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Update my application
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Application form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">1. Personal & contact details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full legal name *</Label>
                  <Input
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="As written on your NIMC slip"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone / WhatsApp number *</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 08012345678"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Residential address *</Label>
                  <Textarea
                    id="address"
                    value={form.residential_address}
                    onChange={(e) => setForm({ ...form, residential_address: e.target.value })}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">2. Ward & identification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Ward *</Label>
                  <Select value={form.ward} onValueChange={(v) => setForm({ ...form, ward: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GEM_WARDS.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nin">National Identification Number (NIN) *</Label>
                  <Input
                    id="nin"
                    value={form.nin}
                    inputMode="numeric"
                    maxLength={11}
                    onChange={(e) =>
                      setForm({ ...form, nin: e.target.value.replace(/\D/g, "").slice(0, 11) })
                    }
                    placeholder="11 digits"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vin">Voter's card number (optional)</Label>
                  <Input
                    id="vin"
                    value={form.voter_card_number}
                    onChange={(e) => setForm({ ...form, voter_card_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="doc">
                    NIMC slip or National ID card {application ? "(upload to replace)" : "*"}
                  </Label>
                  <Input
                    id="doc"
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Upload className="h-3 w-3" /> Only the movement's leadership can see this
                    document. Max 15MB.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">3. Skills & engagement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="profession">Profession / occupation *</Label>
                  <Input
                    id="profession"
                    value={form.profession}
                    onChange={(e) => setForm({ ...form, profession: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="skills">Key skills *</Label>
                  <Textarea
                    id="skills"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    placeholder="e.g. photography, community mobilisation, data entry"
                    required
                  />
                </div>
                <div>
                  <Label>Committee you want to join *</Label>
                  <Select
                    value={form.committee_interest}
                    onValueChange={(v) => setForm({ ...form, committee_interest: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GEM_COMMITTEES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">4. Movement pledge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="rounded-lg bg-muted/50 p-4 text-sm italic">{GEM_PLEDGE}</p>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="pledge"
                    checked={pledge}
                    onCheckedChange={(v) => setPledge(Boolean(v))}
                  />
                  <Label htmlFor="pledge" className="text-sm font-normal">
                    I accept this pledge and confirm that all the details above are true.
                  </Label>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="gradient-primary text-primary-foreground"
              >
                {submitting
                  ? "Submitting..."
                  : application
                    ? "Resubmit application"
                    : "Submit application"}
              </Button>
              {application && (
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
