import Image, { type ImageProps } from "next/image";

const UNOPTIMIZED_HOSTS = ["loremflickr.com"];

/**
 * Thin wrapper around next/image that automatically serves temporary
 * placeholder images (see lib/media/placeholders.ts) unoptimized.
 *
 * Next's image optimizer does its own server-side DNS lookup + private-IP
 * check on every remote host before fetching it (SSRF protection -- see
 * node_modules/next/dist/server/image-optimizer.js). Against
 * loremflickr.com specifically this was observed to be non-deterministic
 * in this environment: the exact same URL succeeded once, then failed with
 * `"url" parameter is not allowed` on every subsequent request in the same
 * dev server process, with no config or code change in between. Real
 * product/category/banner photos (Supabase Storage) are unaffected and
 * stay fully optimized; only known-flaky third-party placeholder hosts are
 * routed around the optimizer, since the browser fetching them directly is
 * strictly more reliable than depending on that server-side check for
 * throwaway imagery.
 */
export function AppImage({ alt, unoptimized, ...props }: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const isUnoptimizedHost = UNOPTIMIZED_HOSTS.some((host) => src.includes(host));
  return <Image {...props} alt={alt} unoptimized={isUnoptimizedHost || unoptimized} />;
}
