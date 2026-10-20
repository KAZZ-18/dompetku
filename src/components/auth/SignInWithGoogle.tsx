"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function SignInWithGoogle() {
  const { t } = useI18n();

  if (!import.meta.env["VITE_SUPABASE_URL"] || !import.meta.env["VITE_SUPABASE_ANON_KEY"]) {
    return null;
  }

  const supabase = createBrowserSupabaseClient();

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Google login error:", error.message);
    }
  };

  return (
    <Button onClick={handleGoogleLogin} type="button" variant="outline" className="w-full">
      {t("Masuk dengan Google")}
    </Button>
  );
}
