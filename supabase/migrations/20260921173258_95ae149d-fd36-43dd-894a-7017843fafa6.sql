DROP VIEW IF EXISTS public.approved_members;

CREATE TABLE public.gem_member_badges (
  user_id uuid NOT NULL PRIMARY KEY,
  full_name text NOT NULL,
  ward text NOT NULL,
  membership_id text,
  approved_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.gem_member_badges TO anon, authenticated;
GRANT ALL ON public.gem_member_badges TO service_role;

ALTER TABLE public.gem_member_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Member badges are public"
ON public.gem_member_badges FOR SELECT
USING (true);

CREATE OR REPLACE FUNCTION private.handle_membership_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
    IF NEW.membership_id IS NULL THEN
      NEW.membership_id := 'GEM-GWG-' || to_char(now(), 'YYYY') || '-' ||
        lpad(nextval('private.gem_membership_seq')::text, 4, '0');
    END IF;
    NEW.approved_at := now();

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'volunteer')
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.gem_member_badges (user_id, full_name, ward, membership_id, approved_at)
    VALUES (NEW.user_id, NEW.full_name, NEW.ward, NEW.membership_id, NEW.approved_at)
    ON CONFLICT (user_id) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          ward = EXCLUDED.ward,
          membership_id = EXCLUDED.membership_id,
          approved_at = EXCLUDED.approved_at;
  END IF;

  IF NEW.status <> 'approved' AND OLD.status = 'approved' THEN
    DELETE FROM public.gem_member_badges WHERE user_id = NEW.user_id;
  END IF;

  IF NEW.status <> OLD.status THEN
    INSERT INTO public.notifications (user_id, type, actor_id)
    VALUES (NEW.user_id, 'membership_' || NEW.status::text, COALESCE(auth.uid(), NEW.user_id));
  END IF;

  RETURN NEW;
END;
$$;