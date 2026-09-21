import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSignedUrl } from "@/lib/storage";
import { GEM_WARDS } from "@/lib/gem";
import { BadgeCheck, FileText, MessageSquareWarning, XCircle, Phone } from "lucide-react";

type Status = "pending" | "approved" | "needs_info" | "rejected";

interface Application {
  id: string;
  user_id: string;
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
  created_at: string;
}

const statusLabel: Record<Status, string> = {
  pending: "Pending",
  needs_info: "Needs info",
  approved: "Approved",
  rejected: "Declined",
};

export default function MembershipApplications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("pending");
  const [ward, setWard] = useState<string>("all");
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, [status]);

  const fetchApps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gem_memberships")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Could not load applications", description: error.message, variant: "destructive" });
    }
    const rows = (data || []) as Application[];
    setApps(rows);
    setLoading(false);

    const resolved: Record<string, string> = {};
    await Promise.all(
      rows.map(async (row) => {
        const url = await getSignedUrl("membership-docs", row.nimc_document_path);
        if (url) resolved[row.id] = url;
      })
    );
    setDocUrls(resolved);
  };

  const review = async (app: Application, next: Status) => {
    if (next !== "approved" && !notes[app.id]?.trim()) {
      toast({
        title: "Add a short reason",
        description: "Tell the applicant what to fix or why the application was declined.",
        variant: "destructive",
      });
      return;
    }

    setBusy(app.id);
    const { error } = await supabase
      .from("gem_memberships")
      .update({
        status: next,
        admin_notes: notes[app.id]?.trim() || null,
        approved_by: user?.id ?? null,
      })
      .eq("id", app.id);
    setBusy(null);

    if (error) {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title:
        next === "approved"
          ? "Member approved"
          : next === "needs_info"
            ? "More information requested"
            : "Application declined",
    });
    setNotes((n) => ({ ...n, [app.id]: "" }));
    fetchApps();
  };

  const visible = ward === "all" ? apps : apps.filter((a) => a.ward === ward);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
          <TabsList className="flex-wrap h-auto">
            {(Object.keys(statusLabel) as Status[]).map((s) => (
              <TabsTrigger key={s} value={s}>
                {statusLabel[s]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Select value={ward} onValueChange={setWard}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All wards</SelectItem>
            {GEM_WARDS.map((w) => (
              <SelectItem key={w} value={w}>
                {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No {statusLabel[status].toLowerCase()} applications.
          </CardContent>
        </Card>
      ) : (
        visible.map((app) => (
          <Card key={app.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                {app.full_name}
                <Badge variant="secondary">{app.ward}</Badge>
                {app.membership_id && (
                  <Badge className="font-mono">{app.membership_id}</Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Submitted {new Date(app.created_at).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${app.phone}`} className="text-primary hover:underline">
                      {app.phone}
                    </a>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Address: </span>
                    {app.residential_address}
                  </p>
                  <p>
                    <span className="text-muted-foreground">NIN: </span>
                    <span className="font-mono">{app.nin}</span>
                  </p>
                  {app.voter_card_number && (
                    <p>
                      <span className="text-muted-foreground">Voter's card: </span>
                      <span className="font-mono">{app.voter_card_number}</span>
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Profession: </span>
                    {app.profession}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Skills: </span>
                    {app.skills}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Committee: </span>
                    {app.committee_interest}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Uploaded NIMC slip / ID</p>
                  {docUrls[app.id] ? (
                    <a href={docUrls[app.id]} target="_blank" rel="noreferrer">
                      <img
                        src={docUrls[app.id]}
                        alt="Identification document"
                        className="max-h-64 w-full rounded-lg border border-border object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <span className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                        <FileText className="h-4 w-4" /> Open document
                      </span>
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">Loading document…</p>
                  )}
                </div>
              </div>

              {app.admin_notes && (
                <p className="rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="text-muted-foreground">Last note: </span>
                  {app.admin_notes}
                </p>
              )}

              {status !== "approved" && (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Note to the applicant, e.g. the name does not match the NIMC slip"
                    value={notes[app.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [app.id]: e.target.value }))}
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={busy === app.id}
                      onClick={() => review(app, "approved")}
                      className="gap-2"
                    >
                      <BadgeCheck className="h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy === app.id}
                      onClick={() => review(app, "needs_info")}
                      className="gap-2"
                    >
                      <MessageSquareWarning className="h-4 w-4" /> Request info
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={busy === app.id}
                      onClick={() => review(app, "rejected")}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" /> Decline
                    </Button>
                  </div>
                </div>
              )}

              {status === "approved" && (
                <div className="flex flex-wrap gap-2">
                  <Textarea
                    placeholder="Reason for revoking membership"
                    value={notes[app.id] || ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [app.id]: e.target.value }))}
                    rows={2}
                  />
                  <Button
                    variant="destructive"
                    disabled={busy === app.id}
                    onClick={() => review(app, "rejected")}
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" /> Revoke membership
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
