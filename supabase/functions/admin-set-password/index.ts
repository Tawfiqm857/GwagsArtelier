import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const GUARD = "gem-8f31c2ad-set-pw-once";

Deno.serve(async (req) => {
  if (req.headers.get("x-guard") !== GUARD) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  }

  const { email, password } = await req.json();

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const { data: list, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) {
    return new Response(JSON.stringify({ error: listError.message }), { status: 500 });
  }

  const target = list.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());
  if (!target) {
    return new Response(JSON.stringify({ error: "user not found" }), { status: 404 });
  }

  const { error } = await admin.auth.admin.updateUserById(target.id, { password });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});
