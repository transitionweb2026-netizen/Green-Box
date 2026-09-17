/**
 * Bespoke hand-drawn-style line icons for the Contact page, matching the
 * reference's loose sketch illustration look (deliberately imperfect
 * strokes, no fill) rather than the clean geometric Lucide icons used
 * everywhere else on the site. Each is a plain inline SVG so no icon
 * library needs to ship a "sketch" variant just for this one page.
 */

type SketchIconProps = { className?: string };

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function EmailSketchIcon({ className }: SketchIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="7" y="17" width="50" height="34" rx="3" {...common} transform="rotate(-1 32 34)" />
      <path d="M9 20 L32 37 L55 20" {...common} />
      <path d="M16 42 h13" {...common} strokeWidth={1.4} opacity={0.8} />
      <path d="M16 46.5 h9" {...common} strokeWidth={1.4} opacity={0.8} />
    </svg>
  );
}

export function PhoneSketchIcon({ className }: SketchIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M20 12c-5 3-9 7-8 12 2 12 17 27 29 29 5 1 9-3 12-8 1.5-2.5.5-4-1.5-5l-8-4.5c-2-1-4-.5-5.5 1l-2.5 3c-5-3-11-9-14-14l3-2.5c1.5-1.5 2-3.5 1-5.5L21 8.5C20 6.5 18 6 16 7"
        {...common}
        transform="translate(1 1) rotate(2 32 32)"
      />
      <path d="M42 10c3 1 6 4 7 7" {...common} strokeWidth={1.3} opacity={0.85} />
      <path d="M46 5c5 1.5 9 6 10.5 11" {...common} strokeWidth={1.3} opacity={0.7} />
    </svg>
  );
}

export function WriteToSketchIcon({ className }: SketchIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="9" y="14" width="34" height="42" rx="2" {...common} transform="rotate(-2 26 35)" />
      <path d="M16 26 h20" {...common} strokeWidth={1.3} opacity={0.8} />
      <path d="M16 33 h20" {...common} strokeWidth={1.3} opacity={0.8} />
      <path d="M16 40 h13" {...common} strokeWidth={1.3} opacity={0.8} />
      <path d="M30 47 L52 15 L58 19 L36 51 L28 53 Z" {...common} />
      <path d="M50 17.5 L54.5 20.5" {...common} strokeWidth={1.3} />
    </svg>
  );
}

export function FacebookSketchIcon({ className }: SketchIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="10" y="9" width="44" height="46" rx="10" {...common} transform="rotate(1 32 32)" />
      <path d="M37 55 V33 h7 l1.3-9H37v-6c0-2.6 1-4.3 4.6-4.3H45V5.6C43.7 5.4 40.8 5 37.7 5 30.9 5 26.6 9 26.6 16.4V24H19v9h7.6v22" {...common} />
    </svg>
  );
}

export function InstagramSketchIcon({ className }: SketchIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="14" {...common} transform="rotate(-1.5 32 32)" />
      <circle cx="32" cy="32" r="12" {...common} />
      <circle cx="45" cy="19" r="2.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppSketchIcon({ className }: SketchIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M32 8c13 0 23 10 23 22 0 12-10 22-23 22-4 0-7.5-.8-10.7-2.4L9 53l3.6-11.7C10.8 38 9 33.6 9 30 9 18 19 8 32 8Z"
        {...common}
        transform="rotate(1 32 32)"
      />
      <path
        d="M23.5 24c-1 0-2.3 1.2-2.3 3.4 0 4.7 4.3 11.8 11.8 15 6 2.5 8.2.9 9.4-.3 1-1 1.6-2.8 1.3-3.6-.3-.8-4.6-2.7-5.5-2.9-.8-.2-1.3 0-1.9.7l-1 1.4c-.4.6-.9.6-1.6.3-1.8-.8-5.8-3.4-7-6.6-.3-.7-.1-1.1.4-1.6l1-1.1c.5-.6.5-1.1.2-1.8l-2.1-5c-.4-1-1-1.1-1.7-1.1Z"
        {...common}
        strokeWidth={1.4}
      />
    </svg>
  );
}

export function TikTokSketchIcon({ className }: SketchIconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path
        d="M35 7v33.5c0 4-3.2 7.2-7.2 7.2-4 0-7.3-3.2-7.3-7.2s3.3-7.3 7.3-7.3c.8 0 1.5.1 2.2.3"
        {...common}
        transform="rotate(-1 30 30)"
      />
      <path
        d="M35 8c1 5.5 5 9.7 10.5 10.4"
        {...common}
        strokeWidth={1.4}
      />
      <path d="M45.5 18.4v8c-3.8 0-7.3-1.1-10.3-3" {...common} strokeWidth={1.4} />
    </svg>
  );
}
