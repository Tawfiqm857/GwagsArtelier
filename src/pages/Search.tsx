import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search as SearchIcon } from "lucide-react";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("q") || "";
  const [term, setTerm] = useState(initial);
  const [query, setQuery] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [people, setPeople] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setPeople([]); setPosts([]); setProjects([]); setListings([]);
      return;
    }
    const run = async () => {
      setLoading(true);
      const like = `%${query.trim()}%`;
      const [pe, po, pr, li] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, bio")
          .or(`username.ilike.${like},display_name.ilike.${like},bio.ilike.${like}`)
          .limit(20),
        supabase
          .from("posts")
          .select("id, content, created_at, user_id, profiles(display_name, username, avatar_url)")
          .ilike("content", like)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("projects")
          .select("id, title, description, ward, status")
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(20),
        supabase
          .from("marketplace_listings")
          .select("id, title, description, price, category, seller_id")
          .eq("is_active", true)
          .or(`title.ilike.${like},description.ilike.${like}`)
          .limit(20),
      ]);
      setPeople(pe.data || []);
      setPosts(po.data || []);
      setProjects(pr.data || []);
      setListings(li.data || []);
      setLoading(false);
    };
    run();
  }, [query]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(term);
    setParams(term.trim() ? { q: term.trim() } : {});
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-28 pb-16">
        <h1 className="text-3xl font-bold mb-6">Search GEM</h1>

        <form onSubmit={submit} className="flex gap-3 mb-8">
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="People, posts, projects or market items"
            aria-label="Search"
          />
          <Button type="submit" className="gap-2">
            <SearchIcon className="w-4 h-4" /> Search
          </Button>
        </form>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-lg" />
            <Skeleton className="h-20 rounded-lg" />
          </div>
        ) : !query.trim() ? (
          <p className="text-muted-foreground">Type something above to start searching.</p>
        ) : (
          <Tabs defaultValue="people">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="people">People ({people.length})</TabsTrigger>
              <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
              <TabsTrigger value="market">Market ({listings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="people" className="space-y-3 mt-6">
              {people.length === 0 ? <p className="text-muted-foreground">No people found.</p> : people.map((p) => (
                <Link key={p.id} to={`/profile/${p.id}`}>
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar>
                        <AvatarImage src={p.avatar_url || undefined} alt={p.display_name || "Member"} />
                        <AvatarFallback>{(p.display_name || p.username || "G").charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          {p.display_name || p.username || "Resident"}
                          {memberIds.has(p.id) && <MemberBadge />}
                        </div>
                        {p.bio && <p className="text-sm text-muted-foreground line-clamp-1">{p.bio}</p>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="posts" className="space-y-3 mt-6">
              {posts.length === 0 ? <p className="text-muted-foreground">No posts found.</p> : posts.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4 space-y-2">
                    <Link to={`/profile/${p.user_id}`} className="text-sm font-medium hover:underline">
                      {p.profiles?.display_name || p.profiles?.username || "Resident"}
                    </Link>
                    <p className="text-sm">{p.content}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="projects" className="space-y-3 mt-6">
              {projects.length === 0 ? <p className="text-muted-foreground">No projects found.</p> : projects.map((p) => (
                <Link key={p.id} to={`/projects/${p.id}`}>
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{p.title}</span>
                        <Badge variant="outline">{p.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                      <span className="text-xs text-muted-foreground">{p.ward}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="market" className="space-y-3 mt-6">
              {listings.length === 0 ? <p className="text-muted-foreground">No market items found.</p> : listings.map((l) => (
                <Link key={l.id} to={`/shop/${l.seller_id}`}>
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{l.title}</span>
                        <Badge variant="outline">{l.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{l.description}</p>
                      <span className="text-sm font-bold text-primary">₦{Number(l.price).toLocaleString()}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
