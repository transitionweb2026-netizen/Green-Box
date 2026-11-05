"use client";

import { useRef, useState, useTransition } from "react";
import { ImageIcon, Upload } from "lucide-react";
import { AppImage as Image } from "@/components/ui/app-image";
import { FormMessage } from "@/components/ui/form-message";
import { updateHeroImageAction } from "@/app/admin/(dashboard)/content/actions";
import type { HeroImages } from "@/lib/services/content";

function HeroImageSlot({
  slot,
  label,
  url,
}: {
  slot: "box" | "background" | "greenBoxPage" | "greenBoxTeaser" | "freshSplit" | "preparedSplit";
  label: string;
  url: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const result = await updateHeroImageAction(slot, formData);
          if (result.status === "error") setError(result.message ?? "فشل رفع الصورة");
        });
      }}
      className="flex flex-col items-center gap-1.5"
    >
      <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-brand-50">
        {url ? (
          <Image src={url} alt={label} fill sizes="128px" className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-2">
            <ImageIcon className="h-5 w-5" />
            <span className="text-[0.65rem]">الافتراضية</span>
          </div>
        )}
      </div>
      <label className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-deep-700 hover:text-deep-800">
        <Upload className="h-3.5 w-3.5" />
        {isPending ? "جارٍ الرفع..." : label}
        <input
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={isPending}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
      <FormMessage className="max-w-[8rem] text-center text-[0.65rem]">{error}</FormMessage>
    </form>
  );
}

/**
 * Every homepage/hero image that had no upload path before (see
 * lib/services/content.ts's HeroImages doc comment) -- separate from
 * BannerManager above, which covers the rotating banner images once an
 * admin has added at least one banner, and from the category grid's own
 * per-category image (edited from each category's own edit page, not
 * here).
 */
export function HeroImagesManager({ images }: { images: HeroImages | null }) {
  return (
    <div>
      <h2 className="mb-1 font-bold text-foreground">صور الصفحة الرئيسية</h2>
      <p className="mb-4 text-sm text-muted">
        تظهر صورة &quot;الصندوق&quot; طول ما مفيش بانر مضاف. الخلفية ظاهرة دايمًا خلف قسم الهيرو. صورة &quot;صفحة جرين
        بوكس&quot; تظهر أعلى صفحة &quot;جرين بوكس&quot; المستقلة (/box). صور &quot;جرين بوكس التعريفية&quot; و&quot;طازج&quot;
        و&quot;جاهز للاستخدام&quot; تظهر في أقسام الصفحة الرئيسية بنفس الأسماء. صور كروت الأقسام (خضروات طازجة، فواكه
        طازجة...) بتتعدل من صفحة تعديل كل قسم على حدة، مش هنا.
      </p>
      <div className="flex flex-wrap gap-6">
        <HeroImageSlot slot="box" label="صورة الصندوق" url={images?.boxCompositionUrl ?? null} />
        <HeroImageSlot slot="background" label="الخلفية" url={images?.backgroundUrl ?? null} />
        <HeroImageSlot slot="greenBoxPage" label="صورة صفحة جرين بوكس" url={images?.greenBoxPageUrl ?? null} />
        <HeroImageSlot slot="greenBoxTeaser" label="صورة جرين بوكس التعريفية" url={images?.greenBoxTeaserUrl ?? null} />
        <HeroImageSlot slot="freshSplit" label='صورة "طازج"' url={images?.freshSplitUrl ?? null} />
        <HeroImageSlot slot="preparedSplit" label='صورة "جاهز للاستخدام"' url={images?.preparedSplitUrl ?? null} />
      </div>
    </div>
  );
}
