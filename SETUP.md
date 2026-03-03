# Tahir GPT — Complete Setup Guide

## 🏗️ Project Overview

Tahir GPT is a full-stack AI chat application featuring:
- **Nano Mode** (fast GPT-4o-mini) and **Pro Mode** (GPT-4o + Gemini 1.5 Pro)
- Intelligent AI router between OpenAI and Gemini
- Image generation (DALL-E 3)
- Build Mode — structured code + project generation
- Supabase auth (email OTP) + PostgreSQL
- Stripe subscription billing
- Full PWA support (installable on iOS/Android)

---

## 📁 Folder Structure

```
tahir-gpt/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          ← Streaming AI chat endpoint
│   │   ├── image/route.ts         ← DALL-E 3 image generation
│   │   ├── build/route.ts         ← Build mode (GPT-4 + Gemini)
│   │   └── stripe/
│   │       ├── checkout/route.ts  ← Create Stripe checkout session
│   │       └── webhook/route.ts   ← Handle Stripe events
│   ├── chat/page.tsx              ← Main chat interface
│   ├── image/page.tsx             ← Image generation UI
│   ├── build/page.tsx             ← Build Mode UI
│   ├── dashboard/page.tsx         ← Account + billing
│   ├── login/page.tsx             ← OTP login
│   ├── offline/page.tsx           ← PWA offline fallback
│   ├── layout.tsx                 ← Root layout
│   ├── page.tsx                   ← Redirect to /chat or /login
│   └── globals.css                ← Design system
├── lib/
│   ├── ai-router.ts               ← Smart AI model selector
│   ├── rate-limiter.ts            ← Per-user rate limiting
│   ├── supabase.ts                ← Supabase client helpers
│   └── usage.ts                   ← Usage tracking
├── public/
│   ├── manifest.json              ← PWA manifest
│   ├── sw.js                      ← Service worker
│   └── icons/                     ← App icons (add your own)
├── supabase/
│   └── migrations/001_schema.sql  ← Full DB schema
├── .env.example
├── netlify.toml
└── next.config.js
```

---

## 🚀 Step 1: Prerequisites

- Node.js 18+
- npm or yarn
- Accounts: Supabase, OpenAI, Google AI Studio, Stripe, Netlify

---

## 🗄️ Step 2: Supabase Setup

1. Go to https://supabase.com → Create new project
2. Go to **SQL Editor** → paste contents of `supabase/migrations/001_schema.sql` → Run
3. Go to **Authentication → Settings**:
   - Enable "Email OTP" (disable email confirmation)
   - Set OTP expiry to 3600 seconds
4. Copy your project URL and keys from **Settings → API**

---

## 🔑 Step 3: API Keys

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create a new API key

### Google Gemini
1. Go to https://aistudio.google.com/app/apikey
2. Create a new API key

### Stripe
1. Go to https://dashboard.stripe.com
2. Create a product: "Tahir GPT Pro" — set price (e.g., $19/month)
3. Copy the Price ID (starts with `price_`)
4. Get your Secret Key and Publishable Key

---

## ⚙️ Step 4: Local Setup

```bash
# Clone / navigate to project
cd tahir-gpt

# Install dependencies
npm install --legacy-peer-deps

# Copy env file
cp .env.example .env.local

# Fill in your .env.local:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Start dev server
npm run dev
```

---

## 🌐 Step 5: Deploy to Netlify

1. Push your code to GitHub
2. Go to https://netlify.com → "Import from Git"
3. Select your repo
4. Build settings are auto-configured via `netlify.toml`
5. Go to **Site Settings → Environment Variables** → add all vars from `.env.example`
6. Install the Netlify Next.js plugin: `npm install @netlify/plugin-nextjs`
7. Deploy!

---

## 💳 Step 6: Stripe Webhooks

1. In Stripe Dashboard → **Webhooks → Add endpoint**
2. URL: `https://your-site.netlify.app/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copy the webhook signing secret → add to `STRIPE_WEBHOOK_SECRET`

---

## 🍎 Step 7: iOS PWA Setup

Add these icons to `public/icons/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `apple-touch-icon.png` (180×180)

Then on iOS: Safari → Share → "Add to Home Screen"

---

## 🔧 Step 8: Add App Icons (Quick)

You can generate icons at https://favicon.io or use your own.
Place them in `/public/icons/` with the exact filenames above.

---

## 💰 Monetization Configuration

### Free Tier (default for all new users):
- 10 messages/hour
- Nano mode only (GPT-4o-mini)
- 3 Build Mode requests/day
- 7-day history

### Pro Tier ($19/month):
- 100 messages/hour
- Full Pro mode (GPT-4o + Gemini 1.5 Pro)
- Unlimited image generation
- Unlimited Build Mode
- Permanent history

To change prices, update `STRIPE_PRO_PRICE_ID` and the Stripe product.
To change limits, edit `/lib/rate-limiter.ts`.

---

## 🛡️ Security Notes

- All API keys stored server-side only (never in frontend)
- Supabase RLS ensures users only see their own data
- Rate limiting on all API routes
- Auth required for all chat/image/build endpoints
- Stripe webhook signature verification enabled

---

## 📞 Need Help?

- Supabase Docs: https://supabase.com/docs
- OpenAI Docs: https://platform.openai.com/docs
- Gemini Docs: https://ai.google.dev/docs
- Stripe Docs: https://stripe.com/docs
- Netlify Docs: https://docs.netlify.com
