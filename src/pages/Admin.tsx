import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, CheckCircle, ExternalLink } from "lucide-react";

const WARDS = ["Gwagwalada Center", "Paiko", "Ibwa", "Zuba", "Kutunku"] as const;
const BADGES = ["GEM Grassroots", "Area Council Municipal", "Joint Initiative"] as const;
const STATUSES = ["Planning", "In Progress", "Completed"] as const;
const DOC_TYPES = [
  "Financial Summary",
  "Balance Sheet",
  "Audit Report",
  "Press Release",
  "Governance Guideline",
] as const;
const ROLES = ["resident", "verified_trader", "volunteer", "moderator", "admin"] as const;

interface ProjectRow {
  id: string;
  title: string;
  ward: string;
  status: string;
  budget_approved: number;
  budget_spent: number;
}

export default function Admin() {
  const { isAdmin, isModerator, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  // Project form
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pWard, setPWard] = useState<string>(WARDS[0]);
  const [pBadge, setPBadge] = useState<string>(BADGES[0]);
  const [pStatus, setPStatus] = useState<string>(STATUSES[0]);
  const [pApproved, setPApproved] = useState("");
  const [pSpent, setPSpent] = useState("");
  const [pContractor, setPContractor] = useState("");
  const [pContact, setPContact] = useState("");
  const [pStart, setPStart] = useState("");
  const [pTarget, setPTarget] = useState("");

  // Milestone form
  const [mProject, setMProject] = useState("");
  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [mDate, setMDate] = useState("");

  // Revenue form
  const [rWard, setRWard] = useState<string>(WARDS[0]);
  const [rAmount, setRAmount] = useState("");
  const [rSource, setRSource] = useState("");
  const [rProject, setRProject] = useState("");
  const [rNotes, setRNotes] = useState("");

  // Document form
  const [dTitle, setDTitle] = useState("");
  const [dType, setDType] = useState<string>(DOC_TYPES[0]);
  const [dFile, setDFile] = useState<File | null>(null);

  // Leadership form
  const [lName, setLName] = useState("");
  const [lRole, setLRole] = useState("");
  const [lBio, setLBio] = useState("");
  const [lOrder, setLOrder] = useState("0");
  const [lPhoto, setLPhoto] = useState<File | null>(null);

  // Roles tab
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState<any[]>([]);
  const [peopleRoles, setPeopleRoles] = useState<Record<string, string[]>>({});
  const [grantRole, setGrantRole] = useState<string>("resident");

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin && !isModerator) {
      navigate("/");
      return;
    }
    fetchAll();
  }, [isAdmin, isModerator, roleLoading]);

  const fetchAll = async () => {
    setLoading(true);
    const [p, d, l, r] = await Promise.all([
      supabase.from("projects").select("id,title,ward,status,budget_approved,budget_spent").order("created_at", { ascending: false }),
      supabase.from("transparency_documents").select("*").order("published_at", { ascending: false }),
      supabase.from("leadership").select("*").order("display_order", { ascending: true }),
      supabase.from("revenue_logs").select("*").order("recorded_at", { ascending: false }).limit(25),
    ]);
    setProjects((p.data || []) as ProjectRow[]);
    setDocs(d.data || []);
    setLeaders(l.data || []);
    setRevenue(r.data || []);
    setLoading(false);
  };

  const fail = (error: { message: string }) =>
    toast({ variant: "destructive", title: "Something went wrong", description: error.message });

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("projects").insert({
      title: pTitle,
      description: pDesc,
      ward: pWard as any,
      entity_badge: pBadge as any,
      status: pStatus as any,
      budget_approved: Number(pApproved || 0),
      budget_spent: Number(pSpent || 0),
      contractor_name: pContractor || null,
      contractor_contact: pContact || null,
      start_date: pStart || null,
      target_completion_date: pTarget || null,
    });
    setBusy(false);
    if (error) return fail(error);
    toast({ title: "Project created" });
    setPTitle(""); setPDesc(""); setPApproved(""); setPSpent("");
    setPContractor(""); setPContact(""); setPStart(""); setPTarget("");
    fetchAll();
  };

  const updateProjectStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("projects").update({ status: status as any }).eq("id", id);
    if (error) return fail(error);
    toast({ title: "Status updated" });
    fetchAll();
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return fail(error);
    toast({ title: "Project deleted" });
    fetchAll();
  };

  const addMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mProject) return;
    setBusy(true);
    const { error } = await supabase.from("project_milestones").insert({
      project_id: mProject,
      title: mTitle,
      description: mDesc || null,
      target_date: mDate || null,
    });
    setBusy(false);
    if (error) return fail(error);
    toast({ title: "Milestone added" });
    setMTitle(""); setMDesc(""); setMDate("");
  };

  const addRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from("revenue_logs").insert({
      ward: rWard as any,
      amount: Number(rAmount || 0),
      source: rSource,
      linked_project_id: rProject || null,
      notes: rNotes || null,
    });
    setBusy(false);
    if (error) return fail(error);
    toast({ title: "Revenue entry recorded" });
    setRAmount(""); setRSource(""); setRNotes(""); setRProject("");
    fetchAll();
  };

  const publishDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dFile) return;
    setBusy(true);
    const path = `${Date.now()}-${dFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("transparency-docs").upload(path, dFile);
    if (upErr) { setBusy(false); return fail(upErr); }
    const { error } = await supabase.from("transparency_documents").insert({
      title: dTitle,
      document_type: dType as any,
      file_url: path,
    });
    setBusy(false);
    if (error) return fail(error);
    toast({ title: "Document published" });
    setDTitle(""); setDFile(null);
    fetchAll();
  };

  const deleteDocument = async (id: string) => {
    const { error } = await supabase.from("transparency_documents").delete().eq("id", id);
    if (error) return fail(error);
    toast({ title: "Document removed" });
    fetchAll();
  };

  const addLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    let photoPath: string | null = null;
    if (lPhoto) {
      const path = `${Date.now()}-${lPhoto.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("leadership-photos").upload(path, lPhoto);
      if (upErr) { setBusy(false); return fail(upErr); }
      photoPath = path;
    }
    const { error } = await supabase.from("leadership").insert({
      name: lName,
      role_title: lRole,
      bio: lBio || null,
      photo_url: photoPath,
      display_order: Number(lOrder || 0),
    });
    setBusy(false);
    if (error) return fail(error);
    toast({ title: "Leader added" });
    setLName(""); setLRole(""); setLBio(""); setLPhoto(null);
    fetchAll();
  };

  const deleteLeader = async (id: string) => {
    const { error } = await supabase.from("leadership").delete().eq("id", id);
    if (error) return fail(error);
    toast({ title: "Leader removed" });
    fetchAll();
  };

  const searchPeople = async (e: React.FormEvent) => {
    e.preventDefault();
    const term = search.trim();
    if (!term) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
      .limit(20);
    if (error) return fail(error);
    setPeople(data || []);

    const ids = (data || []).map((p) => p.id);
    if (ids.length > 0) {
      const { data: rolesData } = await supabase.from("user_roles").select("user_id, role").in("user_id", ids);
      const map: Record<string, string[]> = {};
      (rolesData || []).forEach((r) => {
        map[r.user_id] = [...(map[r.user_id] || []), r.role];
      });
      setPeopleRoles(map);
    } else {
      setPeopleRoles({});
    }
  };

  const toggleRole = async (userId: string, role: string, has: boolean) => {
    if (role === "admin" && !isAdmin) {
      toast({ variant: "destructive", title: "Only an admin can grant the admin role" });
      return;
    }
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any)
      : await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    if (error) return fail(error);
    toast({ title: has ? "Role removed" : "Role granted" });
    setPeopleRoles((prev) => {
      const current = prev[userId] || [];
      return { ...prev, [userId]: has ? current.filter((r) => r !== role) : [...current, role] };
    });
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 pt-28 pb-16 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin console</h1>
          <p className="text-muted-foreground mt-1">
            Manage projects, revenue, documents, leadership, roles and requests.
          </p>
        </div>

        <Tabs defaultValue="projects">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="leadership">Leadership</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="members">Movement Applications</TabsTrigger>
          </TabsList>

          {/* PROJECTS */}
          <TabsContent value="projects" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle>New project</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={createProject} className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="pt">Title</Label>
                    <Input id="pt" value={pTitle} onChange={(e) => setPTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="pd">Description</Label>
                    <Textarea id="pd" value={pDesc} onChange={(e) => setPDesc(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ward</Label>
                    <Select value={pWard} onValueChange={setPWard}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{WARDS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Entity</Label>
                    <Select value={pBadge} onValueChange={setPBadge}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{BADGES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={pStatus} onValueChange={setPStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pa">Budget approved (₦)</Label>
                    <Input id="pa" type="number" value={pApproved} onChange={(e) => setPApproved(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ps">Budget spent (₦)</Label>
                    <Input id="ps" type="number" value={pSpent} onChange={(e) => setPSpent(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pc">Contractor</Label>
                    <Input id="pc" value={pContractor} onChange={(e) => setPContractor(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pcc">Contractor contact</Label>
                    <Input id="pcc" value={pContact} onChange={(e) => setPContact(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="psd">Start date</Label>
                    <Input id="psd" type="date" value={pStart} onChange={(e) => setPStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ptd">Target completion</Label>
                    <Input id="ptd" type="date" value={pTarget} onChange={(e) => setPTarget(e.target.value)} />
                  </div>
                  <Button type="submit" className="sm:col-span-2 gap-2" disabled={busy}>
                    <Plus className="w-4 h-4" /> Create project
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Add milestone</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={addMilestone} className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Project</Label>
                    <Select value={mProject} onValueChange={setMProject}>
                      <SelectTrigger><SelectValue placeholder="Choose a project" /></SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mt">Milestone</Label>
                    <Input id="mt" value={mTitle} onChange={(e) => setMTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="md">Target date</Label>
                    <Input id="md" type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="mdesc">Details</Label>
                    <Textarea id="mdesc" value={mDesc} onChange={(e) => setMDesc(e.target.value)} />
                  </div>
                  <Button type="submit" className="sm:col-span-2" disabled={busy || !mProject}>Add milestone</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>All projects</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {projects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">No projects yet.</p>
                ) : projects.map((p) => (
                  <div key={p.id} className="flex flex-wrap items-center gap-3 justify-between p-3 rounded-lg border border-border">
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {p.ward} · ₦{Number(p.budget_spent).toLocaleString()} of ₦{Number(p.budget_approved).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={p.status} onValueChange={(v) => updateProjectStatus(p.id, v)}>
                        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="outline" size="icon" onClick={() => deleteProject(p.id)} aria-label="Delete project">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REVENUE */}
          <TabsContent value="revenue" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle>Record revenue</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={addRevenue} className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ward</Label>
                    <Select value={rWard} onValueChange={setRWard}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{WARDS.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ra">Amount (₦)</Label>
                    <Input id="ra" type="number" value={rAmount} onChange={(e) => setRAmount(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rs">Source</Label>
                    <Input id="rs" value={rSource} onChange={(e) => setRSource(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Linked project (optional)</Label>
                    <Select value={rProject} onValueChange={setRProject}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="rn">Notes</Label>
                    <Textarea id="rn" value={rNotes} onChange={(e) => setRNotes(e.target.value)} />
                  </div>
                  <Button type="submit" className="sm:col-span-2" disabled={busy}>Record entry</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Recent entries</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {revenue.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">No revenue recorded yet.</p>
                ) : revenue.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <div className="font-medium">₦{Number(r.amount).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">{r.source} · {r.ward || "All wards"}</div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.recorded_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* DOCUMENTS */}
          <TabsContent value="documents" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle>Publish a document</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={publishDocument} className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dt">Title</Label>
                    <Input id="dt" value={dTitle} onChange={(e) => setDTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={dType} onValueChange={setDType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{DOC_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="df">File (PDF)</Label>
                    <Input id="df" type="file" accept="application/pdf" onChange={(e) => setDFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <Button type="submit" className="sm:col-span-2" disabled={busy || !dFile}>Publish</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Published documents</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {docs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">Nothing published yet.</p>
                ) : docs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <div className="font-medium">{d.title}</div>
                      <Badge variant="outline" className="mt-1">{d.document_type}</Badge>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => deleteDocument(d.id)} aria-label="Remove document">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LEADERSHIP */}
          <TabsContent value="leadership" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle>Add a leader</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={addLeader} className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ln">Name</Label>
                    <Input id="ln" value={lName} onChange={(e) => setLName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lr">Role title</Label>
                    <Input id="lr" value={lRole} onChange={(e) => setLRole(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lp">Portrait</Label>
                    <Input id="lp" type="file" accept="image/*" onChange={(e) => setLPhoto(e.target.files?.[0] ?? null)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lo">Display order</Label>
                    <Input id="lo" type="number" value={lOrder} onChange={(e) => setLOrder(e.target.value)} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="lb">Bio</Label>
                    <Textarea id="lb" value={lBio} onChange={(e) => setLBio(e.target.value)} />
                  </div>
                  <Button type="submit" className="sm:col-span-2" disabled={busy}>Add leader</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Leadership team</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {leaders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">No leaders added yet.</p>
                ) : leaders.map((l) => (
                  <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <div className="font-medium">{l.name}</div>
                      <div className="text-sm text-muted-foreground">{l.role_title}</div>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => deleteLeader(l.id)} aria-label="Remove leader">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROLES */}
          <TabsContent value="roles" className="space-y-6 mt-6">
            <Card>
              <CardHeader><CardTitle>Member roles</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={searchPeople} className="flex flex-wrap gap-3">
                  <Input
                    placeholder="Search by name or username"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 min-w-[200px]"
                  />
                  <Select value={grantRole} onValueChange={setGrantRole}>
                    <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button type="submit">Search</Button>
                </form>

                {people.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">Search for a member to manage their roles.</p>
                ) : people.map((p) => {
                  const roles = peopleRoles[p.id] || [];
                  const has = roles.includes(grantRole);
                  return (
                    <div key={p.id} className="flex flex-wrap items-center gap-3 justify-between p-3 rounded-lg border border-border">
                      <div>
                        <div className="font-medium">{p.display_name || p.username || "Resident"}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {roles.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No roles</span>
                          ) : roles.map((r) => (
                            <Badge key={r} variant="outline">{r.replace("_", " ")}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant={has ? "outline" : "default"}
                        size="sm"
                        onClick={() => toggleRole(p.id, grantRole, has)}
                      >
                        {has ? `Remove ${grantRole.replace("_", " ")}` : `Grant ${grantRole.replace("_", " ")}`}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* REQUESTS */}
          <TabsContent value="requests" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Service requests</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Review resident assistance, volunteer onboarding and grievance reports.
                </p>
                <Button className="gap-2" onClick={() => navigate("/admin/services")}>
                  <ExternalLink className="w-4 h-4" /> Open request review
                </Button>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" /> Statuses update instantly for residents.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
