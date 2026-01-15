# Steep ☕

Your LinkedIn posts, distilled into weekly intelligence.

## Quick Start

### 1. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Add environment variables (see below)
4. Deploy

### 2. Environment Variables

Add these in Vercel's dashboard (Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL=https://rdiwkyylgjghszvrlckt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
ANTHROPIC_API_KEY=your-claude-api-key
RESEND_API_KEY=your-resend-key
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
```

### 3. Configure Postmark Webhook

After deploying, update your Postmark inbound webhook URL to:
```
https://your-vercel-url.vercel.app/api/inbound
```

## How It Works

1. **Forward** - User forwards LinkedIn post to `username@in.steep.news`
2. **Parse** - Postmark receives email, sends to our webhook
3. **Extract** - Claude parses the email and extracts post content
4. **Store** - Content saved to Supabase
5. **Digest** - Weekly cron generates personalized digest
6. **Deliver** - Resend emails the digest to user

## API Endpoints

- `POST /api/inbound` - Receives forwarded emails from Postmark
- `POST /api/digest/generate` - Generates a digest for a user
- `GET /api/cron/send-digests` - Sends digests (called by Vercel Cron)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (Postgres)
- **AI**: Claude API (Anthropic)
- **Email In**: Postmark Inbound
- **Email Out**: Resend
- **Hosting**: Vercel

## Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your env vars
npm run dev
```

---

Built by [Syndesi](https://syndesi.co)
