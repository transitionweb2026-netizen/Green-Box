/**
 * Shared, invisible SVG <clipPath> defs referenced by id from CSS
 * (`clip-path: url(#product-card-clip)`) -- rendered once here rather than
 * inline per-card to avoid duplicate ids. `clipPathUnits="objectBoundingBox"`
 * is what makes this scale correctly with each card's own width/height
 * (0..1 = the element's own box) instead of a fixed pixel path that would
 * distort on a differently-sized card -- a plain CSS `clip-path: path(...)`
 * doesn't have that property, which is why this needs real SVG rather than
 * a single inline style value.
 */
export function SvgDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        {/* The product card's organic silhouette -- an asymmetric rounded
            shape (each corner its own radius) with a gentle wave along the
            top and bottom edges instead of straight lines, so it reads as a
            molded object rather than "rectangle + border-radius". Kept
            within a ~2-4% deviation from a plain rounded-rect so it never
            eats into the card's own padding at typical card sizes. */}
        <clipPath id="product-card-clip" clipPathUnits="objectBoundingBox">
          <path
            d="M 0.16 0
               C 0.34 0.02 0.5 0.005 0.64 0.016
               C 0.76 0.025 0.85 0.01 0.91 0.028
               C 0.97 0.046 1 0.085 1 0.14
               L 1 0.80
               C 1 0.865 0.975 0.92 0.92 0.945
               C 0.84 0.98 0.7 0.965 0.56 0.982
               C 0.42 0.998 0.26 0.985 0.15 0.96
               C 0.06 0.94 0 0.885 0 0.815
               L 0 0.16
               C 0 0.09 0.06 0.025 0.16 0
               Z"
          />
        </clipPath>

        {/* The product-image area's own shape -- organic top corners (soft,
            matching the outer card's language) plus a genuinely wavy
            bottom edge (three gentle bumps, not a straight line) instead
            of a horizontal divider between the photo and the text below.
            Deliberately a SEPARATE shape from product-card-clip: it's a
            wider/shorter box (the image area, not the whole card), so the
            two paths are proportioned for their own aspect ratios. */}
        <clipPath id="product-image-clip" clipPathUnits="objectBoundingBox">
          <path
            d="M 0.18 0
               C 0.4 0.02 0.62 0.005 0.82 0.02
               C 0.92 0.03 1 0.06 1 0.14
               L 1 0.70
               C 0.93 0.64 0.85 0.775 0.745 0.735
               C 0.64 0.695 0.55 0.815 0.44 0.775
               C 0.33 0.735 0.235 0.845 0.135 0.795
               C 0.06 0.755 0 0.70 0 0.62
               L 0 0.13
               C 0 0.05 0.08 0.01 0.18 0
               Z"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
