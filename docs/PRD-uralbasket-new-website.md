# PRD: UralBasket New Website

## Problem Statement

UralBasket's website is built on Tilda.cc, a proprietary Russian website builder. This creates several problems: the codebase is not owned by the team (locked into the platform), the generated code is bloated and unmaintainable (74 JS files, 59 CSS files, all minified and opaque), content editing requires a Tilda subscription, and there is no way to write automated tests. The team wants full ownership of clean, testable code and a simple CMS that a non-technical editor can use day-to-day.

## Solution

Rebuild UralBasket as a static Astro site with content managed through Decap CMS. Content (products, blog posts, static pages) is stored as Markdown files in a git repository. Editors use a browser-based CMS admin at `/admin` — no git knowledge required. The site is deployed automatically to Cloudflare Pages on every git push. Order/inquiry forms are submitted via a Cloudflare Worker that forwards the data to a Telegram bot. No database, no server to maintain, no ongoing platform fees.

## User Stories

### Visitor / Customer

1. As a visitor, I want to browse product categories (Baskets, Trade Equipment, Interior & Design, Trunks & Boxes/Cradles) from the homepage navigation, so that I can quickly find the type of product I'm looking for.
2. As a visitor, I want to see a product catalog grid within each category, so that I can compare products visually.
3. As a visitor, I want to open an individual product page with photos, description, and price, so that I can decide whether to order.
4. As a visitor, I want to zoom in on product photos, so that I can see the craftsmanship detail.
5. As a visitor, I want to fill out an order inquiry form (name, phone, email, optional message) on any product page or contact page, so that I can request an order without calling.
6. As a visitor, I want to receive a confirmation message after submitting an inquiry form, so that I know my request was received.
7. As a visitor, I want to read blog posts about basket-making, materials, and styling, so that I can learn more and trust the brand.
8. As a visitor, I want to browse the blog by category (Master class, Reviews, How-to, Materials), so that I can find relevant articles.
9. As a visitor, I want to read the Payment & Delivery page, so that I understand shipping terms before ordering.
10. As a visitor, I want to read the About Us page, so that I can learn about the company and trust them.
11. As a visitor, I want the site to be fast on mobile, so that I can browse on my phone without frustration.
12. As a visitor, I want the site to render correctly in Russian with Cyrillic fonts, so that I can read everything clearly.
13. As a visitor, I want a clear CTA on every product to contact the seller, so that the path to ordering is obvious.
14. As a visitor, I want a 404 page that helps me navigate back, so that I don't hit a dead end.

### Content Editor (non-technical staff)

15. As a content editor, I want to log into a CMS admin panel at `/admin`, so that I can manage content without touching code or git.
16. As a content editor, I want to add a new product with title, category, description, price, photos, and in-stock status, so that the website catalog stays up to date.
17. As a content editor, I want to edit an existing product's details, so that I can correct mistakes or update pricing.
18. As a content editor, I want to delete a product from the catalog, so that discontinued items don't show to customers.
19. As a content editor, I want to write and publish a blog post using a rich-text editor, so that I can publish content without knowing HTML.
20. As a content editor, I want to set a blog post's cover image, category, and excerpt, so that it appears correctly on the blog listing page.
21. As a content editor, I want to save draft blog posts, so that I can write in stages without publishing prematurely.
22. As a content editor, I want to upload product images through the CMS, so that I don't need FTP or git access to add photos.
23. As a content editor, I want to mark a product as "featured" so that it appears on the homepage.
24. As a content editor, I want changes to go live automatically after saving, so that I don't need developer help for routine updates.

### Developer / Technical Owner

25. As a developer, I want all content defined in typed Astro content collections with Zod schemas, so that TypeScript catches content shape errors at build time.
26. As a developer, I want unit tests for form validation logic, so that I can refactor without fear.
27. As a developer, I want smoke tests that confirm every page renders without build errors, so that content changes don't silently break pages.
28. As a developer, I want the Cloudflare Worker for form submission to be a separate testable module, so that I can test Telegram integration independently.
29. As a developer, I want a single `npm run dev` command to start the local development server, so that onboarding is trivial.
30. As a developer, I want deployments to happen automatically on push to `main`, so that there is no manual deploy step.
31. As a developer, I want all styles written in scoped Astro component styles or a single design-token CSS file, so that styles don't leak and are easy to audit.

### UralBasket Owner (receiving orders)

32. As the site owner, I want to receive a Telegram message for every form submission with the customer's name, phone, and email, so that I can follow up quickly.
33. As the site owner, I want the Telegram message to include which product page the customer submitted from, so that I know what they're interested in.

---

## Implementation Decisions

### Architecture

| Concern | Decision |
|---------|----------|
| Framework | Astro 5.x, static output mode |
| CMS | Decap CMS (browser-based, Git-backed, free) |
| Hosting | Cloudflare Pages (static) |
| Form backend | Cloudflare Worker (forwards to Telegram Bot API) |
| Content storage | Markdown files in `src/content/` (git-versioned) |
| Auth for CMS admin | GitHub OAuth via Decap built-in backend |
| Styling | Scoped Astro styles + CSS custom properties for design tokens |
| Testing | Vitest (unit) + `astro check` + Playwright (smoke) |
| Language | Russian only |

### Content Collections

**`products`** (one `.md` file per product):
```
title, slug, category (enum), description, price (optional string),
images[], inStock (bool), featured (bool), order (int)
```

Product categories (enum): `baskets` | `trade` | `design` | `boxes`

**`blog`** (one `.md` file per post):
```
title, slug, publishedAt (date), category (enum), excerpt, coverImage, draft (bool)
```

Blog categories (enum): `master-class` | `reviews` | `how-to` | `materials`

**`pages`** (editable static content):
```
about, delivery — title + body (Markdown)
```

### Key Modules

| Module | Role | Testable in isolation |
|--------|------|-----------------------|
| `src/content/config.ts` | Zod schemas for all collections | Yes — unit tests reject/accept shapes |
| `src/lib/formValidation.ts` | Pure validation for name/email/phone | Yes — pure functions, no I/O |
| `functions/api/order.ts` | Cloudflare Worker: form → Telegram Bot API | Yes — mock fetch |
| `src/components/OrderForm.astro` | Inquiry form with client-side validation | Playwright smoke |
| `src/components/ProductCard.astro` | Reusable product thumbnail | Playwright smoke |
| `src/pages/[category].astro` | Dynamic category listing pages | Routing smoke test |
| `src/pages/product/[slug].astro` | Product detail pages | Routing smoke test |
| `src/pages/blog/[slug].astro` | Blog post pages | Routing smoke test |
| `public/admin/config.yml` | Decap CMS configuration | Manual QA |

### Order Form Flow

1. User fills OrderForm → client-side validation (no request if invalid)
2. JS POSTs JSON `{ name, phone, email, message?, productSlug? }` to `/api/order`
3. Cloudflare Worker validates fields server-side
4. Worker calls `api.telegram.org/bot{TOKEN}/sendMessage` with formatted message
5. Worker returns `{ success: true }` or `{ error: "..." }`
6. Form renders success confirmation or inline error message

### Design Tokens (CSS custom properties)

```css
--color-primary: #1e441e;   /* dark forest green — logo, headings */
--color-accent:  #058240;   /* bright green — buttons, hover states */
--color-hover:   #063b39;   /* dark teal — nav hover */
--font-primary:  'Montserrat', sans-serif;
```

No CSS framework. Plain CSS keeps the bundle small and maintainable.

### URL Structure (preserving old slugs for SEO)

```
/                   → Homepage
/baskets            → Baskets category
/trade              → Trade equipment category
/design             → Interior & design category
/boxes              → Trunks, boxes & cradles category
/product/[slug]     → Product detail
/blog               → Blog listing
/blog/[slug]        → Blog post
/delivery           → Payment & delivery
/about              → About us
/contacts           → Contact page
/admin              → Decap CMS (protected by GitHub OAuth)
```

---

## Testing Decisions

**What makes a good test:** Test observable behavior, not implementation. Validate that the form rejects a bad phone number — not that it called a specific regex. Tests must run with `npm test` in under 30 seconds without a browser (unit/integration) or be clearly labelled as E2E (Playwright).

| Area | Tool | Tests |
|------|------|-------|
| Form validation | Vitest | `validateName` (empty, too short, valid); `validateEmail` (malformed, valid); `validatePhone` (non-digits, too short, valid) |
| Content schemas | Vitest | Zod schemas reject missing required fields; accept valid product and blog post shapes |
| Cloudflare Worker | Vitest + fetch mock | Returns 200 + calls Telegram on valid data; returns 400 on missing fields; handles Telegram API error gracefully |
| Page routing | Playwright smoke | GET every static and dynamic route, assert HTTP 200 and no console errors |

---

## Out of Scope

- Payment gateway (YooKassa, Stripe, etc.)
- Customer accounts / login
- Shopping cart (replaced by inquiry form)
- Site search
- Inventory / stock management system
- Multilingual support (English)
- Product reviews / ratings
- Wishlist / favorites
- Analytics (GTM, Facebook Pixel) — drop-in scripts can be added later
- Email notification delivery (Telegram only for v1)
- Automated content migration from Tilda (products re-entered manually or via one-time script)

---

## Further Notes

- Old Tilda site at `uralbasket.ru` stays live during development; new site launches at staging URL first
- 315+ product images in `/Users/sverdlovsk/Downloads/old_/images/` can be copied to `public/images/`
- 31 indexable pages in the old sitemap — all URL slugs preserved to avoid SEO regression
- Decap CMS is free and open-source; no subscription fee
- Cloudflare Pages + Workers free tier (100k Worker requests/day) is more than sufficient for this traffic level

---

## Execution Phases

### Phase 1 — Scaffold
- `npm create astro@latest` with minimal template + TypeScript
- Add `@astrojs/cloudflare` adapter
- Configure Vitest + Playwright

### Phase 2 — Content schema + seed data
- Define Zod schemas in `src/content/config.ts`
- Write schema unit tests
- Add 2–3 sample products and 1 blog post as Markdown files

### Phase 3 — Core pages
- Base layout: Header (responsive nav), Footer
- Homepage with featured products
- Category pages (`/[category]`)
- Product detail pages (`/product/[slug]`)
- Blog listing + blog post pages
- Static pages: About, Delivery, Contacts, 404

### Phase 4 — Order form + Cloudflare Worker
- `src/lib/formValidation.ts` with Vitest unit tests
- `OrderForm.astro` component
- `functions/api/order.ts` Cloudflare Worker with Telegram integration
- Worker unit tests (mocked fetch)

### Phase 5 — Decap CMS
- `public/admin/config.yml` matching content schemas
- GitHub OAuth backend configuration
- QA: add product via CMS, verify it appears after deploy

### Phase 6 — Design polish
- Apply CSS design tokens and Montserrat font
- Responsive layout (mobile-first, 768px breakpoint)
- Product image gallery (CSS-native or minimal JS)
- Copy brand assets from old site

### Phase 7 — Deploy
- Connect repo to Cloudflare Pages
- Set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` as environment secrets
- DNS switch: point `uralbasket.ru` from Tilda to Cloudflare Pages
