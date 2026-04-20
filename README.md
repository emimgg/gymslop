# gymslop

A full-stack gamified gym tracking app built with Next.js 14, Prisma, Neon PostgreSQL, and NextAuth.

## Features

- **Dashboard** — Daily summary (workout/meals/weight/feels done?), active streaks, XP/level bar, weight trend sparkline, motivational quote
- **Routines** — Build routines with exercises per day of week. Active workout session with PR detection, rest timer, set logging
- **Meals** — Log food with macro tracking (calories/protein/carbs/fat). Preloaded food dataset + custom foods
- **Weight** — Daily weigh-in, 7-day rolling average, goal weight, neon line chart
- **Feels** — Daily check-in (sleep, performance, hunger, energy, stress, mood 1–5). Weekly habit grid + correlation insights
- **Progress** — PR trophy wall (auto-populated from workout history), body measurements log
- **Trophies** — Achievement gallery with 28 trophies across 5 categories. Unlocked = neon glow, locked = greyed out

## Gamification

- XP awarded for: workouts (+100), PRs (+50 each), meal logging (+20), weight logging (+15), daily check-in (+25)
- Level system with exponential XP curve
- Active streaks tracked across all activities
- 28 unlockable trophies with XP rewards

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Neon (serverless PostgreSQL)
- **ORM**: Prisma
- **Auth**: NextAuth.js v4 (Google + GitHub OAuth)
- **Styling**: Tailwind CSS (dark neon theme)
- **Charts**: Recharts
- **State**: TanStack Query (server state) + Zustand (client state)
- **UI**: Custom components with neon aesthetics

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd gymtracker
npm install
```

### 2. Neon Database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project (e.g. `gymtracker`)
3. Copy the connection string from the dashboard
4. You need two variants:
   - `DATABASE_URL` — pooled connection (with `?pgbouncer=true&connection_limit=1` appended for Prisma)
   - `DIRECT_URL` — direct connection (without pgbouncer) for migrations

### 3. Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an **OAuth 2.0 Client ID** (type: Web application)
3. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
4. Copy the **Client ID** and **Client Secret**

### 4. GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps → New OAuth App
2. Set:
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
3. Copy the **Client ID** and generate a **Client Secret**

### 5. Environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Neon DB
DATABASE_URL="postgresql://user:pass@ep-xxxx.us-east-1.aws.neon.tech/neondb?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:pass@ep-xxxx.us-east-1.aws.neon.tech/neondb"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# GitHub OAuth
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 6. Push schema and seed

```bash
npx prisma db push
npm run db:seed
```

### 7. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploying to Vercel

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.local` to Vercel's Environment Variables settings
4. Update OAuth redirect URLs to your Vercel domain:
   - `https://your-app.vercel.app/api/auth/callback/google`
   - `https://your-app.vercel.app/api/auth/callback/github`
5. Update `NEXTAUTH_URL` to your Vercel URL
6. Deploy!

> **Note**: After deploying, run the seed script once via Vercel's CLI or by temporarily adding a seed API route.

---

## Database Commands

```bash
npm run db:push      # Push schema to DB (no migration files)
npm run db:migrate   # Create migration files and push
npm run db:seed      # Seed exercises, foods, trophies
npm run db:studio    # Open Prisma Studio (visual DB browser)
```

---

## Project Structure

```
app/
├── api/                    # API routes
│   ├── auth/[...nextauth]  # NextAuth handler
│   ├── dashboard/          # Dashboard summary
│   ├── exercises/          # Exercise CRUD
│   ├── routines/           # Routine CRUD
│   ├── workouts/           # Workout sessions
│   ├── foods/              # Food database
│   ├── meals/              # Meal logging
│   ├── weight/             # Weight logs
│   ├── feels/              # Daily check-ins
│   ├── progress/           # PRs + measurements
│   ├── trophies/           # Trophy gallery
│   └── user/               # User profile
├── (tabs)/                 # Protected tab pages
│   ├── dashboard/
│   ├── routines/
│   ├── meals/
│   ├── weight/
│   ├── feels/
│   ├── progress/
│   └── trophies/
components/
├── auth/                   # Login page
├── layout/                 # Navigation + header
├── ui/                     # Shared UI primitives
├── dashboard/
├── routines/
├── meals/
├── weight/
├── feels/
├── progress/
└── trophies/
lib/
├── auth.ts                 # NextAuth config
├── prisma.ts               # Prisma client singleton
├── utils.ts                # Helpers
├── xp.ts                   # XP/leveling logic
└── trophies.ts             # Trophy award logic
prisma/
├── schema.prisma           # Full DB schema
└── seed.ts                 # Exercise + food + trophy seeds
```
