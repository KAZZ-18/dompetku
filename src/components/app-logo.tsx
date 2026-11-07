import { useBranding, useTagline, useBrandingSync } from "@/lib/branding";
import { cn } from "@/lib/utils";

/** The app mark: custom logo from Settings, else the bundled wallet logo. */
export function AppLogo({ className }: { className?: string }) {
  const b = useBranding();
  return (
    <img
      src={b.has_logo ? b.logo_url : "/logo.svg"}
      alt=""
      aria-hidden="true"
      width={32}
      height={32}
      className={cn("size-8 shrink-0 rounded-[22%] object-contain", className)}
    />
  );
}

/** "Name." wordmark with the accent dot. */
export function AppName({ className }: { className?: string }) {
  const b = useBranding();
  return (
    <span className={className}>
      {b.app_name}
      <span className="text-sidebar-primary">.</span>
    </span>
  );
}

/**
 * Keeps the favicon and document title in sync with Settings (client-side; the static
 * manifest stays as is so previews and installs keep working without the v14 table).
 */
export function BrandingSync() {
  useBrandingSync();
  return null;
}
