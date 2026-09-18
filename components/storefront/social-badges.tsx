import { type ReactNode } from "react";

/**
 * Solid-colored circular social icon badges for the footer -- a distinct
 * style from the hand-drawn sketch icons on the Contact page (this
 * reference calls for flat, brand-colored badges with a white glyph, not
 * line-art). Each is a self-contained <a> so the footer just drops in
 * whichever platforms have a URL configured.
 */

type BadgeProps = { href?: string; label: string };

function BadgeLink({ href, label, colorClass, children }: BadgeProps & { colorClass: string; children: ReactNode }) {
  const content = (
    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform hover:scale-110 ${colorClass}`}>
      {children}
    </span>
  );
  if (!href) return <span className="opacity-40">{content}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {content}
    </a>
  );
}

export function FacebookBadge(props: BadgeProps) {
  return (
    <BadgeLink {...props} colorClass="bg-[#1877F2]">
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
        <path d="M13.5 21v-8h2.7l.4-3.3h-3.1V7.6c0-.9.3-1.6 1.7-1.6h1.6V3.1C15.9 3 14.9 3 13.7 3 11 3 9.2 4.6 9.2 7.4v2.3H6.5V13h2.7v8h4.3z" />
      </svg>
    </BadgeLink>
  );
}

export function InstagramBadge(props: BadgeProps) {
  return (
    <BadgeLink {...props} colorClass="bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    </BadgeLink>
  );
}

export function TiktokBadge(props: BadgeProps) {
  return (
    <BadgeLink {...props} colorClass="bg-black">
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
        <path d="M16 3v10.7a3.6 3.6 0 1 1-2.6-3.46V7.6a5.7 5.7 0 1 0 5 5.65V9.3a6.6 6.6 0 0 0 3.7 1.13V7.7a4.1 4.1 0 0 1-3.7-2.7V3h-2.4z" />
      </svg>
    </BadgeLink>
  );
}

export function WhatsappBadge(props: BadgeProps) {
  return (
    <BadgeLink {...props} colorClass="bg-[#25D366]">
      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden="true">
        <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.3A9 9 0 1 0 12 3zm0 1.8a7.2 7.2 0 0 1 6 11.2l-.3.5.9 3.1-3.2-.9-.5.3A7.2 7.2 0 1 1 12 4.8z" />
        <path d="M9 8.3c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4l.7 1.7c.1.2 0 .4-.1.6l-.4.5c-.1.2-.1.3 0 .5.3.6 1.6 1.9 2.6 2.4.2.1.4.1.5-.1l.4-.5c.2-.2.4-.2.6-.1l1.6.8c.2.1.4.2.4.4 0 .8-.5 1.6-1.3 1.9-.7.3-1.5.3-2.5-.1-1.9-.7-3.7-2.4-4.4-4.3-.5-1.2-.3-2.3.3-3.2z" />
      </svg>
    </BadgeLink>
  );
}
