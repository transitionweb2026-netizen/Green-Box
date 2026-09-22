import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-lg", className)} {...props} />;
}

/** Matches the real ProductCard's blob-card shape (see
 * components/storefront/product-card.tsx) so the loading state doesn't
 * flash a differently-shaped placeholder right before the real card. */
export function ProductCardSkeleton() {
  return (
    <div className="card-blob flex flex-col bg-brand-50 p-3 sm:p-4">
      <Skeleton className="aspect-square w-full rounded-[1.5rem]" />
      <div className="flex flex-col gap-2 pt-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="mt-2 h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)]">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}
