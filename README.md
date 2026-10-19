# VKS — Vue 3 + Vite Sneaker Store

A real **Vue 3 + Vite + JavaScript** sneaker storefront and admin dashboard for Cambodia.
No React, no Next.js, no TypeScript.

## Stack
- Vue 3 (`<script setup>` SFCs) · Vite 7 (`vite.config.js`) · Vue Router 4 · Pinia
- Tailwind CSS v4 (`@tailwindcss/vite`) with runtime-themeable CSS variables
- `qrcode` for KHQR rendering · zero-dependency Node REST API in `/server`

## Commands
| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Dev server → http://localhost:5173 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the build |
| `node server/index.js` | REST API on :4000 (optional) |

## Demo accounts
| Role | Email | Password |
|---|---|---|
| Admin | `admin@vks.store` | `admin123` |
| Customer | `demo@vks.store` | `demo123` |

The sign-in page has one-click **Demo customer** / **Demo admin** buttons.

## Design system
- **Font pairing:** *Outfit* (display/headings — geometric, athletic) + *Plus Jakarta Sans* (body — tall x-height, very legible at small sizes) + *Noto Sans Khmer* (Khmer, auto-applied via `:lang(km)` with looser line-height).
- **Colour:** neutral ink/canvas scale + a single configurable accent. Default **Flame `#f26b1d`**.
- **Corners: a uniform 5px everywhere**, enforced three ways in `src/styles/main.css`:
  1. all Tailwind `--radius-*` theme tokens set to `5px`;
  2. `.rounded` / `.rounded-full` overridden (Tailwind hardcodes `rounded-full` to infinity);
  3. an **unlayered** `[class*="rounded"]:not(.circle)` rule that catches every variant.
     It must sit outside `@layer` — Tailwind tree-shakes attribute selectors inside it.
     Use `.circle` to opt out (carousel dots only).
- **Runtime theming:** colours are CSS variables (`--c-primary`, `--c-canvas`, …) exposed to
  Tailwind via `@theme inline`. Dark mode and the admin's one-click colour change are both a
  variable swap — no rebuild, no duplicated `dark:` classes.

## Features
**Storefront** — hero carousel (auto-rotating, blurred neighbours, dots, swipe, play/pause);
category cards; shop with search, category/brand/size/gender/price/stock/sale filters, sort,
grid↔list toggle and pagination; product page with **left thumbnails · centre image · right
details**, read-more, specs and real reviews; cart drawer + cart page; checkout; receipt.

**Product detail reviews** are persisted and recompute the product's average rating.

**Checkout** — left: contact, delivery zone, address, **real OpenStreetMap** embed with
"use my location" (Geolocation API); right: summary + **real KHQR**.

**KHQR** (`src/services/khqr.js`) builds a genuine **EMVCo/Bakong** payload — correct TLV tags
(`00/01/29/52/53/54/58/59/60/62`) and a **CRC-16/CCITT-FALSE** checksum — rendered as a scannable
QR in the official red KHQR card. Merchant account, name, city and currency are admin-editable.

**Receipt** — printable, with a real **Code 39** barcode (`src/services/barcode.js`, ISO/IEC 16388)
drawn as SVG from the order number.

**Account** — left profile card (avatar upload, stats), right tabs for profile editing
(name/email/phone/password) and order history.

**Dashboard** — smoothly collapsible sidebar (width-animated, persisted); page header with a clean
bottom border; KPI cards with **count-up animated numbers**; animated SVG line chart (stroke-dash
draw-on) + category bar chart; day-range filter (today/7/30/90); **CSV export** on every table;
products with table↔card toggle, search/filter, inline stock editing and full CRUD; orders with
status workflow + expandable rows; customers; settings for **one-click website colour**, banner,
KHQR token and **bulk discount** across all products.

**i18n** — full English ⇄ ភាសាខ្មែរ with a smooth dropdown; **dark mode** toggle; real icon set
(outline UI icons + Google/Facebook/Instagram/TikTok/Telegram/YouTube brand glyphs).

## Structure
```
index.html  vite.config.js
src/main.js  src/App.vue  src/router/index.js
src/assets/      brand.js, theme.js (colour + banner presets)
src/i18n/        index.js, en.js, km.js
src/components/  header, footer, hero, cart drawer, search, KHQR, barcode, charts/…
src/layouts/     StoreLayout, AuthLayout (centred), DashboardLayout
src/pages/       Home, Shop, Product, Cart, Checkout, Receipt, Account, Login, Register, 404
src/pages/admin/ Overview, Products, Orders, Customers, Settings
src/stores/      auth, cart, ui (theme/locale/sidebar), settings, toast
src/services/    api, httpAdapter, localAdapter, domain, seed, khqr, barcode
src/styles/      main.css
server/index.js  REST API (JSON file DB, scrypt passwords)
```

## Data modes
1. **Browser storage (default)** — `localStorage`. Survives reloads, but is per-device and not
   shared between users. The footer and dashboard say so explicitly.
2. **REST API** — `node server/index.js`, then `VITE_API_URL=/api npm run dev`. Products, users,
   sessions, reviews, orders and settings live in `server/data/db.json`; prices and stock are
   validated server-side at checkout.

## Still required for production
- **Payment verification.** The KHQR code is a valid, scannable payload, but the app cannot confirm
  a transfer actually happened — "I have paid" is currently trusted. Integrate the **Bakong Open API**
  (`check_transaction_by_md5`) server-side before marking an order paid.
- **Real OAuth.** The Google/Facebook buttons run a *demo* flow that creates a local account.
  Real sign-in needs provider client IDs and a server-side token exchange.
- **Database** — swap `readDb`/`writeDb` for PostgreSQL/MongoDB.
- **Email** — order confirmations and the newsletter need a provider.
- **Deployment** — host `dist/` statically, deploy `server/` to Node, set `VITE_API_URL` at build
  time and `CORS_ORIGIN` on the server. Routing uses hash URLs because the build is a single file.
- **Template leftovers** (cannot be removed from inside this environment):
  `npm uninstall react react-dom @vitejs/plugin-react @types/react @types/react-dom typescript`
  and delete the unused `vite.config.ts`.
