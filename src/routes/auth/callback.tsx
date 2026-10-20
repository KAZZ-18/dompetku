import { createFileRoute } from "@tanstack/react-router";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const origin = url.origin;

        if (!code) {
          return Response.redirect(`${origin}/login?error=google_callback_failed`);
        }

        const supabase = createServerSupabaseClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.user) {
          return Response.redirect(`${origin}/login?error=google_callback_failed`);
        }

        const ownerEmail = process.env["APP_OWNER_EMAIL"];
        if (!ownerEmail || data.user.email?.toLowerCase() !== ownerEmail.toLowerCase()) {
          return Response.redirect(`${origin}/login?error=google_not_authorized`);
        }

        const appUsername = process.env["APP_USERNAME"];
        if (!appUsername) {
          return Response.redirect(`${origin}/login?error=google_config_missing`);
        }

        const { createSession } = await import("@/lib/session.server");
        createSession(appUsername, null, null);

        return Response.redirect(`${origin}/dashboard`, 302);
      },
    },
  },
});
