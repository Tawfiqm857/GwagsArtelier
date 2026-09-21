import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Returns the set of user ids that are approved GEM members, for the given ids. */
export function useMemberBadges(userIds: string[]) {
  const [members, setMembers] = useState<Set<string>>(new Set());
  const key = Array.from(new Set(userIds.filter(Boolean))).sort().join(",");

  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (ids.length === 0) {
      setMembers(new Set());
      return;
    }
    let active = true;
    supabase
      .from("gem_member_badges")
      .select("user_id")
      .in("user_id", ids)
      .then(({ data }) => {
        if (active) setMembers(new Set((data || []).map((r) => r.user_id)));
      });
    return () => {
      active = false;
    };
  }, [key]);

  return members;
}

export interface MemberCard {
  user_id: string;
  full_name: string;
  ward: string;
  membership_id: string | null;
  approved_at: string;
}

/** Returns the public member card for a single user, or null when not a member. */
export function useMemberCard(userId?: string | null) {
  const [card, setCard] = useState<MemberCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCard(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    supabase
      .from("gem_member_badges")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) {
          setCard(data ?? null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return { card, loading };
}
