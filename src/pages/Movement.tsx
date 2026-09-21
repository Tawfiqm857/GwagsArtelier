import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BrandLogo from "@/components/BrandLogo";
import { GEM_PILLARS, GEM_WARDS, GEM_COMMITTEES, GEM_PLEDGE } from "@/lib/gem";
import { Users, MapPin, HardHat, Landmark, ArrowRight, Quote } from "lucide-react";

export default function Movement() {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const [members, projects] = await Promise.all([
        supabase.from("gem_member_badges").select("user_id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
      ]);
      setMemberCount(members.count ?? 0);
      setProjectCount(projects.count ?? 0);
    };
    load();
  }, []);

  const stats = [
    { label: "Registered members", value: memberCount, icon: Users },
    { label: "Wards covered", value: GEM_WARDS.length, icon: MapPin },
    { label: "Projects tracked", value: projectCount, icon: HardHat },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-24 pb-20">
        {/* Hero */}
        <section className="rounded-2xl border border-border bg-card p-8 md:p-12 text-center">
          <BrandLogo imageClassName="mx-auto h-20 w-auto" />
          <h1 className="mt-6 text-3xl md:text-4xl font-bold">Gwagwalada Elite Movement</h1>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            A youth-led movement in Gwagwalada Area Council, Abuja, building a transparent and
            accountable community — and creating real opportunity for young people.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gradient-primary text-primary-foreground">
              <Link to="/join-gem">
                Register as an Official Member <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/governance">
                <Landmark className="mr-2 h-4 w-4" /> Meet the leadership
              </Link>
            </Button>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <div className="text-2xl font-bold">{stat.value ?? "—"}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Pillars */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Our four pillars</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {GEM_PILLARS.map((pillar) => (
              <Card key={pillar.title}>
                <CardHeader>
                  <CardTitle className="text-lg">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {pillar.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Wards */}
        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" /> Where we work
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {GEM_WARDS.map((ward) => (
                <Badge key={ward} variant="secondary">
                  {ward}
                </Badge>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" /> Committees you can join
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {GEM_COMMITTEES.map((committee) => (
                <Badge key={committee} variant="outline">
                  {committee}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Pledge */}
        <section className="mt-12">
          <Card className="bg-muted/40">
            <CardContent className="p-8">
              <Quote className="h-6 w-6 text-primary" />
              <p className="mt-3 text-lg italic">{GEM_PLEDGE}</p>
            </CardContent>
          </Card>
        </section>

        {/* Closing CTA */}
        <section className="mt-10 rounded-2xl border border-border p-8 text-center">
          <h2 className="text-2xl font-semibold">Ready to stand up for Gwagwalada?</h2>
          <p className="mt-2 text-muted-foreground">
            Official membership is reviewed and approved by the movement's leadership.
          </p>
          <Button asChild size="lg" className="mt-5 gradient-primary text-primary-foreground">
            <Link to="/join-gem">Join the Movement</Link>
          </Button>
        </section>
      </main>
    </div>
  );
}
