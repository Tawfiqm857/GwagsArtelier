import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Camera, CheckCircle, Flag, MapPin, UserRound, EyeOff } from "lucide-react";
import { useSignedUrls } from "@/lib/storage";
import VerifyProjectDialog from "@/components/VerifyProjectDialog";

interface Report {
  id: string;
  photo_url: string;
  caption: string | null;
  submitted_at: string;
  verified: boolean;
  flagged: boolean;
  verdict: string | null;
  media_type: string;
  is_anonymous: boolean;
  uploaded_by: string | null;
}

interface Props {
  projectId: string;
}

const CommunityVerification = ({ projectId }: Props) => {
  const { user } = useAuth();
  const { isModerator } = useRole();
  const { toast } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const mediaUrls = useSignedUrls("project-photos", reports.map((r) => r.photo_url));

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("project_photos")
      .select("*")
      .eq("project_id", projectId)
      .order("submitted_at", { ascending: false });

    const list = (data || []) as Report[];
    setReports(list);

    const authorIds = Array.from(
      new Set(list.filter((r) => !r.is_anonymous && r.uploaded_by).map((r) => r.uploaded_by as string))
    );
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", authorIds);
      const map: Record<string, string> = {};
      (profiles || []).forEach((p) => {
        map[p.id] = p.display_name || p.username || "Resident";
      });
      setNames(map);
    }
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const setFlag = async (id: string, flagged: boolean) => {
    const { error } = await supabase.from("project_photos").update({ flagged }).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
      return;
    }
    toast({ title: flagged ? "Report flagged as spam" : "Report restored" });
    fetchReports();
  };

  const setVerified = async (id: string, verified: boolean) => {
    const { error } = await supabase.from("project_photos").update({ verified }).eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
      return;
    }
    toast({ title: verified ? "Report verified" : "Verification removed" });
    fetchReports();
  };

  const visible = reports.filter((r) => !r.flagged);
  const tally = visible.reduce<Record<string, number>>((acc, r) => {
    if (r.verdict) acc[r.verdict] = (acc[r.verdict] || 0) + 1;
    return acc;
  }, {});
  const total = Object.values(tally).reduce((a, b) => a + b, 0);
  const leading = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Community verification</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            What residents actually found on the ground.
          </p>
        </div>
        {user && <VerifyProjectDialog projectId={projectId} onSubmitted={fetchReports} />}
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : visible.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <p className="text-muted-foreground">No resident reports yet.</p>
            <p className="text-sm text-muted-foreground">
              Be the first to visit the site and share what you see.
            </p>
          </div>
        ) : (
          <>
            {leading && (
              <div className="space-y-3 p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium">
                  {leading[1]} of {total} residents say: {leading[0]}
                </p>
                {Object.entries(tally).map(([verdict, count]) => (
                  <div key={verdict} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{verdict}</span>
                      <span>{count}</span>
                    </div>
                    <Progress value={total > 0 ? (count / total) * 100 : 0} className="h-2" />
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-5">
              {(isModerator ? reports : visible).map((report) => (
                <div key={report.id} className="space-y-2">
                  {mediaUrls[report.photo_url] ? (
                    report.media_type === "video" ? (
                      <video
                        src={mediaUrls[report.photo_url]}
                        controls
                        className="w-full h-48 object-cover rounded-lg bg-black"
                      />
                    ) : (
                      <img
                        src={mediaUrls[report.photo_url]}
                        alt={report.caption || "Resident verification photo"}
                        loading="lazy"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )
                  ) : (
                    <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {report.verdict && <Badge variant="default">{report.verdict}</Badge>}
                    {report.verified && (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </Badge>
                    )}
                    {report.flagged && <Badge variant="destructive">Flagged as spam</Badge>}
                  </div>

                  {report.caption && <p className="text-sm">{report.caption}</p>}

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {report.is_anonymous ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Anonymous resident
                        </>
                      ) : (
                        <>
                          <UserRound className="w-3 h-3" />
                          {names[report.uploaded_by || ""] || "Resident"}
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      {new Date(report.submitted_at).toLocaleDateString()}
                    </span>
                    {isModerator && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={report.verified ? "outline" : "default"}
                          onClick={() => setVerified(report.id, !report.verified)}
                        >
                          {report.verified ? "Unverify" : "Verify"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => setFlag(report.id, !report.flagged)}
                        >
                          <Flag className="w-3 h-3" />
                          {report.flagged ? "Restore" : "Flag"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <p className="text-xs text-muted-foreground flex items-start gap-2">
          <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
          Reports may include site location when the resident chooses to attach it.
        </p>
      </CardContent>
    </Card>
  );
};

export default CommunityVerification;
