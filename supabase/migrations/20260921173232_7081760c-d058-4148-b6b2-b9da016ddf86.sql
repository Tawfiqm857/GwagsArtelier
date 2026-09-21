CREATE TYPE public.membership_status AS ENUM ('pending', 'approved', 'needs_info', 'rejected');

CREATE TABLE public.gem_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  residential_address text NOT NULL,
  ward text NOT NULL,
  nin text NOT NULL,
  voter_card_number text,
  nimc_document_path text NOT NULL,
  profession text NOT NULL,
  skills text NOT NULL,
  committee_interest text NOT NULL,
  pledge_accepted boolean NOT NULL DEFAULT true,
  status public.membership_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  membership_id text UNIQUE,
  approved_at timestamp with time zone,
  approved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_gem_memberships_status ON public.gem_memberships(status);

GRANT SELECT, INSERT, UPDATE ON public.gem_memberships TO authenticated;
GRANT ALL ON public.gem_memberships TO service_role;

ALTER TABLE public.gem_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own application"
ON public.gem_memberships FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Moderators view all applications"
ON public.gem_memberships FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users submit own application"
ON public.gem_memberships FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Users revise pending application"
ON public.gem_memberships FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND status IN ('pending', 'needs_info'))
WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Moderators review applications"
ON public.gem_memberships FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'))
WITH CHECK (private.has_role(auth.uid(), 'admin') OR private.has_role(auth.uid(), 'moderator'));

CREATE TRIGGER update_gem_memberships_updated_at
BEFORE UPDATE ON public.gem_memberships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public-safe view of approved members for badges across the app
CREATE VIEW public.approved_members
WITH (security_invoker = false) AS
SELECT user_id, full_name, ward, membership_id, approved_at
FROM public.gem_memberships
WHERE status = 'approved';

GRANT SELECT ON public.approved_members TO authenticated, anon;

CREATE SEQUENCE IF NOT EXISTS private.gem_membership_seq START 1;

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
  END IF;

  IF NEW.status <> OLD.status THEN
    INSERT INTO public.notifications (user_id, type, actor_id)
    VALUES (NEW.user_id, 'membership_' || NEW.status::text, COALESCE(auth.uid(), NEW.user_id));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER gem_membership_review
BEFORE UPDATE ON public.gem_memberships
FOR EACH ROW EXECUTE FUNCTION private.handle_membership_review();