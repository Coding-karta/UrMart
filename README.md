# UrMart — Curated Lifestyle & Design E-Commerce

UrMart is a modern, responsive e-commerce web application featuring a curated catalog of minimalist home decor, kitchenware, workspace goods, ambient lighting, and wellness essentials. Built with React 19 and Vite, it integrates Supabase for real-time authentication and cloud database persistence, alongside an intelligent AI shopping concierge powered by Google Gemini and a local catalog engine.

---

## 🌟 Key Features

- **Curated Catalog**: 32 handcrafted lifestyle items across Home Decor, Lighting, Kitchen, Workspace, Wellness, and Travel.
- **Dynamic Product Filtering & Search**: Instant category filtering, multi-field text search, wishlist toggling, and sort options (Featured, Price: Low to High, Price: High to Low, Customer Rating).
- **Cart & Bag Experience**: Interactive quantity controls, persistent local bag, and dynamic totals breakdown.
- **Authoritative Checkout**: Server-style price and quantity recalculation, promo code discounts (`WELCOME10`, `URMART20`, `FREESHIP`), and free express delivery on orders over ₹499.
- **Cloud Database & Auth with Supabase**: Real cross-device login, profile management, saved shipping addresses, and live order history backed by PostgreSQL.
- **Dual-Engine AI Shopping Concierge**:
  - *Gemini 1.5 Flash*: Open-ended cloud conversational shopping assistant with secure header-based authentication.
  - *Curated Catalog Rules Engine*: Lightning-fast offline shopping concierge providing product recommendations, cart analysis, coupon lookup, and order status updates.
- **Guest / Demo Mode**: Full preview capability for academic and evaluation purposes without storing passwords.
- **Responsive Dark/Light Theme**: Theme switcher adhering to system preferences and persisted across browser sessions.

---

## 🛡️ Security Architecture & Hardening

UrMart was comprehensively audited and hardened for production-readiness and technical evaluation:

1. **Supabase Cloud Authentication**:
   - Supabase Auth serves as the sole authentication mechanism for real user accounts.
   - All legacy plaintext password storage in `localStorage` or memory has been eliminated.
   - Demo guest testing is strictly separated (`isDemo: true`) with no passwords stored.

2. **Least-Privilege PostgreSQL Database & Row-Level Security (RLS)**:
   - RLS is enforced on `public.profiles` and `public.orders`.
   - Blanket `GRANT ALL` statements were removed. `anon` role has zero table access.
   - `authenticated` users can only read, insert, and update their own profile (`auth.uid() = id`), and read/insert their own orders (`auth.uid() = user_id`).
   - Customer `UPDATE` and `DELETE` on `orders` are blocked to guarantee immutable order records.
   - Check constraints enforce positive monetary values (`subtotal >= 0`, `discount >= 0`, `shipping >= 0`, `total >= 0`).

3. **Checkout & Order Integrity**:
   - Cart items are verified authoritatively against official catalog prices and stock rules before order confirmation.
   - Double-submission and order duplication protection is enforced with submit locks.
   - Order confirmation in Supabase is strictly awaited before displaying success states to users.
   - Payment methods are transparently labeled as academic simulated demonstrations.

4. **Gemini AI API Key Protection**:
   - Google Gemini API calls transmit keys securely via the `x-goog-api-key` HTTP header rather than exposing keys in URL query strings.
   - Client queries are sanitized and capped at 500 characters, protected by a 1.2-second anti-spam cooldown.
   - Responses transparently identify the active engine (`Gemini 1.5 Flash` vs `Curated Catalog Rules`).
   - A server-side Supabase Edge Function template (`supabase/functions/gemini-chat/index.ts`) is included for backend key isolation.

5. **Safe Real-Time Connection Probing**:
   - Supabase connection verification uses a live database probe rather than simulated timer delays.

---

## 🛠️ Technology Stack

- **Frontend**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 8 with `@vitejs/plugin-react`
- **Backend-as-a-Service**: Supabase (`@supabase/supabase-js` v2.118)
- **Database**: PostgreSQL with Row-Level Security & Triggers
- **AI / LLM**: Google Gemini 1.5 Flash REST API
- **Code Quality**: Oxlint & Node.js Native Test Runner (`node:test`, `node:assert`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended; v20+ supported)
- npm (v9 or higher)

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/urmart.git
cd urmart

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env.local` file in the project root (copied from `.env.example`):

```bash
cp .env.example .env.local
```

Populate with your project credentials:

```env
# Found in Supabase Dashboard -> Project Settings -> API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> **Security Note**: Never commit real `.env` or `.env.local` files to Git. The repository includes `.gitignore` rules that prevent environment files from being tracked.

---

## 🗄️ Supabase Database Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** → **New Query**.
3. Copy and run the contents of `supabase/migrations/20261024_security_hardening.sql` (or `supabase_schema.sql`).
4. To enable instant user registrations without email confirmation delays:
   - Go to **Authentication** → **Providers** → **Email**.
   - Toggle **OFF** `Confirm email`.
   - Click **Save**.

---

## 🧪 Testing and Verification

UrMart includes an automated security and integrity test suite verifying input validation, catalog pricing authority, coupon calculations, and address checks.

```bash
# Run automated security tests
npm test

# Run Oxlint code quality checks
npm run lint

# Build for production
npm run build

# Start local development server
npm run dev
```

---

## 📋 Academic / Demonstration Disclaimer

UrMart is designed as an educational and portfolio demonstration project. While authentication and database operations are fully functional against live Supabase projects, payment processing is simulated and no real financial charges or credit card transactions will occur.
