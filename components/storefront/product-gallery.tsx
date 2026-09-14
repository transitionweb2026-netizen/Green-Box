"use client";

import { useState } from "react";
import { AppImage as Image } from "@/components/ui/app-image";
import { Badge } from "@/components/ui/badge";
import { placeholderImage, type PlaceholderKey } from "@/lib/media/placeholders";
import { cn } from "@/lib/utils/cn";
import type { ProductImage } from "@/lib/services/catalog";

export function ProductGallery({
  images,
  alt,
  fallbackKey,
  boxLabel,
}: {
  images: ProductImage[];
  alt: string;
  fallbackKey: PlaceholderKey;
  boxLabel?: string;
}) {
  const sorted = [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const [activeIndex, setActiveIndex] = useState(0);
  const active = sorted[activeIndex];

  return (
    <div>
      <div className="glass relative aspect-square w-full overflow-hidden !p-0">
        <Image
          src={active?.url ?? placeholderImage(fallbackKey)}
          alt={active ? (active.alt_ar ?? alt) : alt}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {boxLabel && (
          <Badge tone="deep" className="absolute start-4 top-4 shadow-sm">
            {boxLabel}
          </Badge>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {sorted.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                index === activeIndex ? "border-brand-500" : "border-transparent opacity-70 hover:opacity-100",
              )}
              aria-label={`${alt} ${index + 1}`}
              aria-current={index === activeIndex}
            >
              <Image src={image.url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
