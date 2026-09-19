import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSignedUrls } from "@/lib/storage";
import { BadgeCheck, MessageCircle, Store } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  is_negotiable: boolean;
  whatsapp_number: string | null;
  images: string[];
}

export default function Shop() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const covers = useSignedUrls("marketplace-images", listings.map((l) => l.images?.[0]).filter(Boolean) as string[]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      const [{ data: p }, { data: l }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("marketplace_listings")
          .select("*")
          .eq("seller_id", userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "verified_trader"),
      ]);
      setProfile(p);
      setListings((l || []) as Listing[]);
      setVerified((r || []).length > 0);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 pt-28 pb-16 space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </main>
      </div>
    );
  }

  const shopName = profile?.shop_name || profile?.display_name || profile?.username || "Shop";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-28 pb-16">
        <Card className="mb-8">
          <CardContent className="flex flex-wrap items-center gap-4 p-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={shopName} />
              <AvatarFallback>{shopName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-[200px]">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Store className="w-5 h-5 text-primary" /> {shopName}
              </h1>
              {profile?.bio && <p className="text-muted-foreground mt-1">{profile.bio}</p>}
              <div className="flex flex-wrap gap-2 mt-2">
                {verified && (
                  <Badge className="gap-1"><BadgeCheck className="w-3 h-3" /> Verified trader</Badge>
                )}
                <Badge variant="outline">{listings.length} item{listings.length === 1 ? "" : "s"}</Badge>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to={`/profile/${userId}`}>View profile</Link>
            </Button>
          </CardContent>
        </Card>

        {listings.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            This shop has no active items right now.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              const cover = listing.images?.[0] ? covers[listing.images[0]] : undefined;
              return (
                <Card key={listing.id} className="overflow-hidden">
                  {cover ? (
                    <img src={cover} alt={listing.title} loading="lazy" className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 bg-muted" />
                  )}
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-semibold">{listing.title}</h2>
                      <Badge variant="outline">{listing.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{listing.description}</p>
                    <p className="font-bold text-primary">
                      ₦{Number(listing.price).toLocaleString()}
                      {listing.is_negotiable && (
                        <span className="text-xs font-normal text-muted-foreground"> · negotiable</span>
                      )}
                    </p>
                    {listing.whatsapp_number && (
                      <Button asChild className="w-full gap-2" size="sm">
                        <a
                          href={`https://wa.me/${listing.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hello, I'm interested in "${listing.title}" on GEM.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="w-4 h-4" /> Contact on WhatsApp
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
