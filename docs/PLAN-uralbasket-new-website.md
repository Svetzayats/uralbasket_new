# Plan: UralBasket New Website

> Source PRD: `docs/PRD-uralbasket-new-website.md`

## Architectural Decisions

Durable decisions that apply across all phases:

- **Routes**: `/` · `/baskets` · `/trade` · `/design` · `/boxes` · `/product/[slug]` · `/blog` · `/blog/[slug]` · `/delivery` · `/about` · `/contacts` · `/admin`
- **Framework**: Astro 5.x, static output, `@astrojs/cloudflare` adapter
- **Content storage**: Markdown files in `src/content/` via Astro content collections (Zod-typed)
- **Product schema**: `title`, `slug`, `category` (enum: `baskets|trade|design|boxes`), `description`, `price?`, `images[]`, `inStock`, `featured`, `order`
- **Blog schema**: `title`, `slug`, `publishedAt`, `category` (enum: `master-class|reviews|how-to|materials`), `excerpt`, `coverImage`, `draft`
- **Pages schema**: `about` / `delivery` — `title` + Markdown body
- **Form endpoint**: Cloudflare Worker at `/api/order` → Telegram Bot API
- **CMS**: Decap CMS at `/admin`, GitHub OAuth backend, content saved back to git
- **Styling**: Plain CSS, CSS custom properties for design tokens (no framework)
  - `--color-primary: #1e441e` · `--color-accent: #058240` · `--color-hover: #063b39`
  - Font: Montserrat (Google Fonts, Cyrillic subset)
- **Testing**: Vitest (unit + Worker) · Playwright (E2E smoke)
- **Hosting**: Cloudflare Pages (static) + Cloudflare Workers (form API)
- **Deployment**: Auto-deploy on push to `main` via Cloudflare Pages git integration

---

## Phase 1: Project Scaffold + CI Deploy

**User stories**: 29 (single `npm run dev` command), 30 (auto-deploy on push)

### What to build

Bootstrap the Astro project with TypeScript, connect the Cloudflare Pages adapter, and wire up continuous deployment from the git repo. A minimal layout shell (header with placeholder nav links, footer) should render at `/` and deploy live to Cloudflare Pages on every push to `main`. No real content yet — just the scaffold proving the full pipeline works.

### Acceptance criteria

- [ ] `npm run dev` starts a local dev server without errors
- [ ] `npm run build` produces a static build without errors
- [ ] A placeholder homepage renders at `/` in the browser (local + Cloudflare Pages)
- [ ] Pushing to `main` triggers an automatic Cloudflare Pages deploy
- [ ] Header and footer components exist and are included in the base layout
- [ ] TypeScript is configured and `astro check` passes with no errors

---

## Phase 2: Content Schema + Seed Data

**User stories**: 25 (typed content collections with build-time errors)

### What to build

Define the full Zod schemas for all three content collections (`products`, `blog`, `pages`) in Astro's content config. Add 3 sample products (one per category mix) and 1 blog post as Markdown files to give every subsequent phase real data to render. Write unit tests that confirm the schemas accept valid data and reject invalid shapes.

### Acceptance criteria

- [ ] `src/content/config.ts` defines Zod schemas for `products`, `blog`, and `pages` collections
- [ ] At least 3 sample product Markdown files exist covering different categories
- [ ] At least 1 sample blog post Markdown file exists
- [ ] `astro check` passes — TypeScript infers correct types from content collections
- [ ] Vitest: schema accepts a fully valid product; rejects a product missing `title`; rejects an invalid `category` value
- [ ] Vitest: schema accepts a valid blog post; rejects a post with a missing `publishedAt`

---

## Phase 3: Product Catalog Tracer Bullet (Baskets Category)

**User stories**: 2 (product grid in category), 3 (individual product page), 13 (clear CTA on every product)

### What to build

Deliver the complete end-to-end path for one category: `/baskets` lists all basket products as a grid of cards, each card links to `/product/[slug]` which shows the full product detail (images, description, price if set, in-stock status) with an inquiry CTA button. This is the vertical tracer through the entire content → page → component → UI stack. All other categories are extensions of this same pattern.

### Acceptance criteria

- [ ] `/baskets` renders a grid of product cards from the `products` content collection, filtered to `category: baskets`
- [ ] Each product card shows title, primary image, and price (if set)
- [ ] Clicking a card navigates to `/product/[slug]`
- [ ] The product detail page shows all images, full description, price, in-stock badge, and an inquiry CTA button
- [ ] Pages render correctly in a browser with no layout breakage
- [ ] `astro build` completes without errors after adding these pages

---

## Phase 4: All Categories + Homepage + 404

**User stories**: 1 (browse all categories from nav), 14 (404 page)

### What to build

Extend the category pattern from Phase 3 to the remaining three categories (`/trade`, `/design`, `/boxes`). Build the homepage showing featured products (those with `featured: true`) and the primary navigation linking to all four categories. Add a custom 404 page that includes the nav so users can find their way back.

### Acceptance criteria

- [ ] `/trade`, `/design`, `/boxes` each render their respective product grids
- [ ] Homepage shows a featured products section populated from `featured: true` products
- [ ] Header navigation links to all four category pages and is present on every page
- [ ] Unknown routes return a custom 404 page with navigation
- [ ] Navigation is responsive: collapses to a mobile menu on narrow viewports
- [ ] All four category pages and the homepage render without errors in `astro build`

---

## Phase 5: Blog

**User stories**: 7 (read blog posts), 8 (browse blog by category)

### What to build

A blog listing page at `/blog` showing all published posts (where `draft: false`) sorted by `publishedAt` descending, with visible category labels for filtering context. Individual blog post pages at `/blog/[slug]` render the full Markdown body, cover image, category, and date. Draft posts are excluded from the build.

### Acceptance criteria

- [ ] `/blog` lists all non-draft posts with title, cover image, excerpt, date, and category
- [ ] `/blog/[slug]` renders the full blog post (cover image, title, date, category, body)
- [ ] Posts with `draft: true` do not appear on the listing page or generate routes
- [ ] Posts are sorted newest-first on the listing page
- [ ] Blog is linked from the main navigation
- [ ] `astro build` includes all non-draft posts and excludes drafts

---

## Phase 6: Order Form + Cloudflare Worker → Telegram

**User stories**: 5 (inquiry form), 6 (confirmation after submit), 32 (owner receives Telegram message), 33 (message includes product context)

### What to build

A reusable `OrderForm` component (name, phone, email, optional message) with client-side validation. A pure validation module (`formValidation.ts`) tested in isolation. A Cloudflare Worker at `/api/order` that receives the form POST, validates server-side, and sends a formatted Telegram message via the Bot API. The form shows a success state or inline error on response. The worker is tested with mocked fetch — no real Telegram token needed in CI.

### Acceptance criteria

- [ ] Vitest: `validateName`, `validateEmail`, `validatePhone` each reject empty/malformed input and accept valid input
- [ ] Vitest (Worker): valid POST → returns 200, calls Telegram API with correct payload
- [ ] Vitest (Worker): POST with missing `name` → returns 400, does not call Telegram
- [ ] Vitest (Worker): Telegram API returns error → Worker returns 500, does not throw unhandled
- [ ] `OrderForm` component shows field-level error messages without submitting if validation fails
- [ ] Successful submission shows a confirmation message; the form does not re-submit on refresh
- [ ] Telegram message includes: customer name, phone, email, and product slug (if submitted from a product page)
- [ ] `OrderForm` is embedded on the `/contacts` page and on individual product detail pages

---

## Phase 7: Static Pages + Design Polish

**User stories**: 9 (Payment & Delivery page), 10 (About Us page), 11 (fast on mobile), 12 (Cyrillic fonts render correctly), 4 (zoom in on product photos)

### What to build

Build the About and Delivery static pages driven by the `pages` content collection (so editors can update them via CMS later). Apply the full design system: Montserrat font (Cyrillic subset), CSS custom properties, mobile-first responsive layout at 768px breakpoint. Add a lightweight product image gallery with zoom capability (CSS-native `object-fit` + lightbox, or minimal vanilla JS — no external library). Migrate brand assets (logo, favicon) from the old site.

### Acceptance criteria

- [ ] `/about` and `/delivery` render content from the `pages` collection with correct Markdown-to-HTML rendering
- [ ] Montserrat font loads for Cyrillic text across all pages
- [ ] CSS custom properties (`--color-primary`, `--color-accent`, `--color-hover`, `--font-primary`) are defined and applied globally
- [ ] All pages are usable on a 375px-wide viewport without horizontal scroll
- [ ] Product image gallery on detail pages supports viewing multiple images; clicking/tapping an image zooms it
- [ ] Logo and favicon match UralBasket branding
- [ ] Lighthouse mobile performance score ≥ 85 on the homepage

---

## Phase 8: Decap CMS

**User stories**: 15 (admin login), 16–18 (add/edit/delete products), 19–22 (write/publish/draft blog posts with images), 23 (mark product as featured), 24 (changes go live automatically)

### What to build

Configure Decap CMS (`public/admin/config.yml`) with collections that exactly match the Zod schemas from Phase 2. Set up GitHub OAuth as the auth backend (Decap built-in) so editors log in with their GitHub account. Products and blog posts are editable via a rich browser UI; saving commits back to git and triggers an automatic Cloudflare Pages deploy. Image uploads are supported for product photos and blog cover images.

### Acceptance criteria

- [ ] Navigating to `/admin` presents a login screen (GitHub OAuth)
- [ ] After login, the editor sees "Products" and "Blog" collections
- [ ] Creating a new product via CMS UI commits a valid Markdown file to `src/content/products/` and triggers a deploy
- [ ] Editing a product updates the existing file; the change is live after the deploy completes
- [ ] Creating a blog post with `draft: true` does not publish it to the live site
- [ ] Publishing a draft post (setting `draft: false`) makes it appear on `/blog` after deploy
- [ ] Image upload works for product `images[]` field and blog `coverImage` field
- [ ] The `featured` toggle on products controls homepage appearance
- [ ] CMS field labels and widgets match the Zod schema types (e.g. `category` is a dropdown, `inStock` is a boolean toggle)

---

## Phase 9: E2E Smoke Tests

**User stories**: 26 (unit tests for form validation — already in Phase 6), 27 (smoke tests for all routes), 28 (Worker tested in isolation — already in Phase 6)

### What to build

Playwright smoke tests that boot the production build and GET every static and dynamic route, asserting HTTP 200 and no browser console errors. The test suite discovers dynamic routes (`/product/[slug]`, `/blog/[slug]`, category pages) from the built output rather than hardcoding URLs, so adding new content automatically expands test coverage. `npm test` runs Vitest (unit) and `npm run test:e2e` runs Playwright (E2E, requires built site).

### Acceptance criteria

- [ ] `npm test` runs all Vitest unit tests (from Phases 2, 6) and exits 0
- [ ] `npm run test:e2e` boots the built site and tests all routes
- [ ] Every static route returns HTTP 200 with no console errors
- [ ] Every dynamic product route (`/product/*`) returns HTTP 200
- [ ] Every dynamic blog route (`/blog/*`) returns HTTP 200
- [ ] Every category route (`/baskets`, `/trade`, `/design`, `/boxes`) returns HTTP 200
- [ ] The CI pipeline runs `npm test` on every pull request
