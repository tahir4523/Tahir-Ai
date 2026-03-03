# 🚀 Tahir GPT — Complete Setup & Deployment Guide

A production-ready, multi-AI web application with streaming chat, image generation, build mode, authentication, and Stripe monetization.

---

## 📁 Project Structure

```
tahir-gpt/
├── app/
│   ├── api/
│   │   ├── chat/route.ts           # AI chat with streaming
│   │   ├── image-gen/route.ts      # DALL-E image generation
│   │   ├── conversations/route.ts  # Conversation CRUD
│   │   ├── stripe/checkout/route.ts
│   │   └── webhooks/stripe/route.ts
│   ├── auth/page.tsx               # OTP login
│   ├── chat/
│   │   ├── page.tsx                # New chat
│   │   └── [id]/page.tsx           # Existing conversation
│   ├── image/page.tsx              # Image generation UI
│   ├── build/page.tsx              # Build mode UI
│   ├── dashboard/page.tsx          # Usage dashboard
│   ├── settings/page.tsx           # Settings + upgrade
│   ├── offline/page.tsx            # PWA offline fallback
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   └── globals.css
├── components/
│   └── chat/
│       ├── ChatSidebar.tsx
│       ├── ChatMessage.tsx
│       ├── ChatInput.tsx
│       └── ModeSelector.tsx
├── lib/
│   ├── ai/router.ts                # Smart AI model router
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   └── rate-limit.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── public/
│   ├── manifest.json               # PWA manifest
│   └── icons/                      # App icons
├── middleware.ts                    # Auth guard
├── netlify.toml
├── next.config.js
├── tailwind.config.js
└── .env.example
```

---

## ⚡ Quick Start (5 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Go to **SQL Editor** → paste content from `supabase/migrations/001_initial_schema.sql` → Run
3. Go to **Authentication** → **Email** → Enable "Email OTP"
4. Copy your project URL and anon key

### Step 3: Set Up Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

### Step 5: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Init and deploy
netlify init
netlify deploy --prod
```

---

## 🗄️ Supabase Setup Details

### Email OTP Configuration
1. Supabase Dashboard → Authentication → Providers → Email
2. Enable **"Confirm email"** = OFF (for OTP flow)
3. Enable **"Secure email change"** = ON

### Environment Variables in Netlify
1. Netlify Dashboard → Site → Environment variables
2. Add all variables from `.env.example`

---

## 💳 Stripe Setup

### Create Products
1. Go to [stripe.com](https://stripe.com) → Products
2. Create product "Tahir GPT Pro" — $9/month recurring
3. Copy the **Price ID** → `STRIPE_PRO_PRICE_ID`

### Webhooks
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-site.netlify.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

### Test Mode
For development, use test mode keys (prefix `sk_test_`, `pk_test_`)

---

## 📱 PWA / iOS Setup

### Generate App Icons
Use a tool like [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator):
```bash
npx pwa-asset-generator logo.png public/icons
```

### iOS Installation
Users can tap **Share → Add to Home Screen** in Safari to install as a native app.

---

## 🔑 Getting API Keys

### OpenAI
1. Go to [platform.openai.com](https://platform.openai.com)
2. API Keys → Create new key
3. Add to `OPENAI_API_KEY`

### Gemini
1. Go to [makersuite.google.com](https://makersuite.google.com)
2. Get API Key
3. Add to `GEMINI_API_KEY`

---

## 🏗️ AI Routing Logic

The smart router in `lib/ai/router.ts` works like this:

| User Mode | Query Type | Model Used |
|-----------|-----------|------------|
| Auto | Simple (<200 chars) | GPT-4o-mini (Nano) |
| Auto | Complex / Code / Long | GPT-4o (Pro) |
| Nano | Any | GPT-4o-mini |
| Pro | Any | GPT-4o or Gemini 1.5 Pro |
| Build Mode | Auto-detected | GPT-4o (Pro, temp=0.3) |

---

## 📊 Rate Limits

| Tier | Messages/Day | Images/Month |
|------|-------------|--------------|
| Free | 20 | 5 |
| Pro | 500 | 100 |

Adjust in `.env.local`:
```env
FREE_TIER_DAILY_MESSAGES=20
FREE_TIER_MONTHLY_IMAGES=5
PRO_TIER_DAILY_MESSAGES=500
PRO_TIER_MONTHLY_IMAGES=100
```

---

## 🔒 Security Features

- ✅ All API keys server-side only
- ✅ Supabase Row Level Security
- ✅ Auth middleware on all protected routes
- ✅ Rate limiting per user
- ✅ Input validation
- ✅ Stripe webhook signature verification
- ✅ CORS headers via Netlify

---

## 🚀 Production Checklist

- [ ] Set all environment variables in Netlify
- [ ] Run Supabase SQL migration
- [ ] Configure Stripe products and webhooks
- [ ] Generate PWA icons
- [ ] Set `NEXT_PUBLIC_APP_URL` to your live URL
- [ ] Test OTP email flow
- [ ] Test payment flow with Stripe test mode
- [ ] Enable Stripe live mode when ready

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 App Router + TypeScript
- **Styling**: Tailwind CSS
- **Auth**: Supabase (Email OTP)
- **Database**: Supabase Postgres + RLS
- **AI**: OpenAI GPT-4o/mini + Google Gemini
- **Images**: DALL-E 3
- **Payments**: Stripe
- **Deployment**: Netlify
- **PWA**: next-pwa

---

Built with ❤️ — Tahir GPT
