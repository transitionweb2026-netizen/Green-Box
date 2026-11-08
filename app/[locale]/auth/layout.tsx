// Explicit per Phase 1 item 4 ("/auth/* stays dynamic") -- the login/
// register/reset-password pages all read a `?next=` searchParams
// redirect target directly, which already made them dynamic; this makes
// it deliberate for every page under this layout rather than incidental.
export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
