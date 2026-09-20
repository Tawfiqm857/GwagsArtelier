CREATE OR REPLACE FUNCTION private.notify_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://mrfsejkbnwkofnwmjwde.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', 'gem_push_9f2c41ab7de84c0fa3b6e5d1c8470923'
    ),
    body := jsonb_build_object(
      'user_id', NEW.user_id,
      'type', NEW.type,
      'actor_id', NEW.actor_id,
      'post_id', NEW.post_id,
      'group_id', NEW.group_id
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;