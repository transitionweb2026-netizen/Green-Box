import { getTranslations } from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("common");
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-brand-300/40" />
        <span className="bg-brand-gradient relative flex h-10 w-10 items-center justify-center rounded-full text-white shadow-[0_8px_20px_-8px_rgba(84,120,41,0.6)]">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
            <path
              d="M12 21c-4.5 0-8-3.5-8-8 0-6 5-9 8-11 3 2 8 5 8 11 0 4.5-3.5 8-8 8Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {t("loading")}
      </span>
    </div>
  );
}
