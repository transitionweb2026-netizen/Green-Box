# Green Box — Project Specification

## 1. Overview

**Green Box** is a production-ready, Arabic-first fresh food / grocery e-commerce web application. It replaces informal ordering (phone/WhatsApp-style) with a structured online store: browsing, cart, checkout, tracking, loyalty, and subscriptions, backed by a full admin dashboard so non-technical staff can run the business day-to-day without a developer.

This document is the source of truth for **what** we are building. See [ARCHITECTURE.md](ARCHITECTURE.md) for **how**, [DATABASE.md](DATABASE.md) for the data model, [ROADMAP.md](ROADMAP.md) for the delivery plan, and [DECISIONS.md](DECISIONS.md) for confirmed vs. open business decisions.

## 2. Repository Status (as of Phase 0)

- The `GREEN BOX` project folder is **empty** — no existing code, no git repository, no package.json, no Supabase project wiring. This is a greenfield build.
- No prior technical debt to inherit.
- The Desktop that contains this folder also contains an unrelated pre-existing project (`giant-storage`) and a large amount of unrelated personal files. That project is **not** part of Green Box and will not be touched or reused; it was only inspected to confirm which framework versions already run cleanly in this environment (see [ARCHITECTURE.md](ARCHITECTURE.md) §2).
- A repo-root `AGENTS.md`/`CLAUDE.md` pair exists one level up (Desktop root) with a generic note: the installed Next.js version may have breaking API changes vs. training data, and its bundled docs (`node_modules/next/dist/docs/`) should be checked before writing framework-specific code. This applies to Green Box once its own `node_modules` exists and will be followed during implementation.

## 3. Product Categories

### Confirmed, launching now
1. Fresh Vegetables
2. Fresh Fruits
3. Fresh Chicken — **reservation-based** (exact reservation rules TBD, see [DECISIONS.md](DECISIONS.md))
4. Prepared Vegetables
5. Prepared Fruits (e.g., fruit salad / fruit plates)
6. Green Box Boxes (curated product bundles — see §11)

### Must be supportable without rebuilding architecture
7. Herbs & Spices (العطارة)
8. Local Meat (اللحوم البلدي)
9. Supermarket / Grocery

**Requirement:** categories are fully admin-managed (create, edit, delete, reorder, activate/deactivate) — never hardcoded in frontend code.

## 4. Core Customer Journey

```
Browse → Product → Add to Cart → Cart → Address → Delivery Time → Payment → Review Order → Confirm → Track Order
```

Customer-facing capabilities required:
- Home page, category browsing, product listing, product details
- Smart search with suggestions, typo tolerance, Arabic-aware matching
- Cart: add, adjust quantity, remove, per-order notes
- Registration/login/logout, profile management
- Multiple saved addresses, delivery-zone validation, delivery time-slot selection
- Checkout with payment method selection, order review, confirmation
- Order history, order details, live status tracking timeline
- Loyalty points balance and history
- Weekly subscriptions (architecture only until rules are confirmed)

## 5. Account System

Every customer who places an order has an account (Supabase Auth). Customers can register, log in, log out, edit their profile, manage addresses, view/track orders, view loyalty points and history, and manage subscriptions.

**Hard requirement:** a customer must never be able to read or modify another customer's orders, addresses, loyalty data, subscriptions, or profile. This is enforced at the database level (Row Level Security), not only in the UI — see [DATABASE.md](DATABASE.md) §RLS.

## 6. Address & Delivery

Addresses store: title/label, recipient name, phone, governorate, city, area, detailed address, landmark, optional notes. A customer may save multiple addresses.

Delivery zones are database-driven and admin-managed (create/edit/activate/deactivate, plus configurable rules such as fee and minimum order once the business defines them). A zone is defined by the specific governorate/city/area combinations the admin assigns to it; a customer validates deliverability by picking their area from that admin-curated list when saving an address, rather than free-typing a location that might not actually be served. **No delivery fees, zone boundaries, or zone rules are invented in this build** — the schema supports them; actual values are entered by the admin.

## 7. Delivery Time Slots

Slots (e.g., `09:00–12:00`, `12:00–15:00`, `15:00–18:00`, `18:00–21:00`) are **illustrative only**. Admin can create, edit, activate/deactivate, and reorder slots. No slot data is hardcoded or seeded as real business data.

## 8. Payment

Launch methods: **Vodafone Cash** and **InstaPay** only. No card/Visa/Mastercard support at launch.

The checkout and data model must support adding new payment providers later (e.g., a card gateway) without rebuilding checkout, and must not assume a specific payment-confirmation workflow (transaction reference vs. screenshot vs. manual admin approval vs. automatic verification) — the business has not decided this yet. See [ARCHITECTURE.md](ARCHITECTURE.md) §Payment Abstraction and [DECISIONS.md](DECISIONS.md).

## 9. Orders

An order captures customer, line items, **snapshotted prices** (a later price change must never alter historical orders), subtotal, delivery info, delivery slot, payment method, payment status, order status, customer notes, and timestamps.

Order status values (confirmed): `PENDING → CONFIRMED → PREPARING → PACKING → OUT_FOR_DELIVERY → DELIVERED`, with `CANCELLED` as a terminal alternate state. Every status change is recorded in a status history so the customer sees a visual tracking timeline (e.g., ✓ Order received · ✓ Confirmed · ✓ Preparing · ✓ Packing · ● Out for delivery · ○ Delivered).

## 10. Shopping Cart

Add, increase/decrease quantity, remove, see line price and subtotal, add order notes, continue shopping, proceed to checkout. Cart works for logged-in users; the data model leaves room to add guest carts later without a redesign, but guest cart is **not** built now (avoid unnecessary complexity).

## 11. Loyalty Program

Confirmed default formula (admin-editable, not hardcoded):
- 1000 EGP spent → 100 points earned
- 100 points → 10 EGP redemption value (≈1% reward rate)

Admin must be able to configure the spend threshold, points earned, redemption value, an optional minimum redemption amount, and enable/disable the whole program. Every points movement (earn, redeem, adjust) is a recorded transaction tied to a balance and, where applicable, an order — never a single mutable counter.

## 12. Weekly Subscriptions

Business rules for renewal, payment timing, pause/skip weeks, cancellation, and refunds are **not yet confirmed**. This build creates the data model and admin visibility needed to support subscriptions later, without inventing or implementing any of the unconfirmed behaviors. See [DECISIONS.md](DECISIONS.md) for the explicit list of open questions.

## 13. Green Box Boxes

Boxes are curated bundles of existing products (name, description, image, price, availability, contents, ordering, active state — all admin-managed). Architectural approach: **boxes are represented as products** with a `product_type = 'box'` flag plus a join table describing their contents, rather than a parallel product system. Rationale is documented in [ARCHITECTURE.md](ARCHITECTURE.md) §Green Box Boxes.

## 14. Smart Search

V1 target: search-as-you-type suggestions, product/category matching, Arabic-aware and typo-tolerant matching, relevance ranking — built on Postgres full-text search + trigram similarity (no external search service, no AI ranking yet). Architecture leaves room to swap in a dedicated search service later if needed.

## 15. Admin Dashboard

Minimum sections: Dashboard, Orders, Customers, Products, Categories, Green Boxes, Delivery Zones, Delivery Time Slots, Payments, Loyalty, Subscriptions, Content/CMS, Settings. Any data a business owner would reasonably expect to change without a developer (prices, availability, images, categories, ordering, delivery config, payment info, loyalty rules, homepage content) must be editable here.

## 16. Bilingual (Arabic-first, English-ready)

Arabic is the primary experience with correct RTL layout; English is a first-class secondary locale. Bilingual content is stored as paired columns (e.g., `name_ar`/`name_en`) rather than duplicated components or duplicated tables — see [ARCHITECTURE.md](ARCHITECTURE.md) §Internationalization.

## 17. Design Direction

Modern, premium, but practical — communicating freshness, trust, and quality, using Green Box's brand colors/visual references as the source of truth once supplied. Clear product cards, clear prices, obvious add-to-cart actions, clear checkout, clear order tracking, strong visual hierarchy. Usability is never sacrificed for visual effects.

> Brand assets (logo, color palette, reference imagery) have not been supplied yet — required before UI visual design work in Phase 4 can start. Tracked in [DECISIONS.md](DECISIONS.md).

## 18. Responsive Design

Fully responsive across mobile, tablet, desktop, with special attention to mobile shopping UX. No horizontal overflow, no broken RTL, no unreadable text, no unusable tap targets.

## 19. Performance

Server components by default, optimized images, pagination (never load the full catalog for a 20-product page), proper indexes, minimal client JS, no unnecessary realtime subscriptions.

## 20. SEO

Dynamic titles/meta descriptions, Open Graph, Twitter/X cards, canonical URLs, `ar`/`en` alternates, product structured data, semantic headings, image alt text, sitemap, robots.txt — manageable from the admin where appropriate.

## 21. Explicit Non-Goals for This Build

Do not implement yet (tracked as future scalability in [ARCHITECTURE.md](ARCHITECTURE.md) §Future Extension Points):
- Card/Visa/Mastercard payments or any real payment gateway integration
- Coupons/promotions, advanced inventory, multi-branch, multiple admin roles/permission tiers
- WhatsApp/SMS/email/push notifications
- AI-powered search/ranking
- Any invented delivery fee, zone boundary, minimum order, payment verification workflow, or subscription rule not explicitly confirmed by the business

## 22. Definition of Done (applies to every phase)

A phase is not "done" because it compiles. It is done when: the app runs, TypeScript and lint are clean, relevant tests pass, database migrations apply cleanly, RLS has been verified (a user cannot read another user's data), the UI has been checked responsively, and the implementation has been checked against this spec — per the process in [ROADMAP.md](ROADMAP.md).
