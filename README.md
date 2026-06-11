# HobbyConnect

A social platform that connects people through shared hobbies and local activities — find events near you, build teams, and rate fellow participants.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?logo=tailwind-css)
![Google Maps](https://img.shields.io/badge/Google_Maps_API-Maps-4285F4?logo=google-maps)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker)

---

## Features

- **Interactive Activity Map** — browse open activities pinned on a Google Map with custom markers per category.
- **Activity Feed** — chronological list of upcoming activities with category filters.
- **Create Activities** — post geo-located events with title, description, category, schedule, capacity, and public/friends-only visibility.
- **Join & Leave Activities** — one-click participation management with automatic seat tracking.
- **Friends System** — send, accept, and reject friend requests; invite friends directly to activities.
- **Teams** — create hobby-based teams, invite members with captain/member roles, and manage invitations.
- **User Profiles** — public profiles with bio, city, avatar, and a reputation score calculated automatically from peer ratings.
- **Peer Ratings** — rate other participants (1–5 stars + comment) after a shared activity; scores update in real time via DB triggers.
- **Social Links** — attach WhatsApp, Telegram, Instagram, and other handles to your profile with per-link visibility controls (public / friends / private).
- **Notifications Bell** — in-app notifications for pending friend requests and activity invitations.
- **Authentication** — email/password sign-up and login via Supabase Auth; sessions managed with SSR-safe cookies.
- **Route Protection** — Next.js middleware guards all app routes and redirects unauthenticated users to `/login`.

---

## Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend framework | Next.js 14 (App Router) | Pages, routing, server components, server actions |
| Language | TypeScript 5 | Type safety across the entire codebase |
| Styling | Tailwind CSS 3 | Utility-first UI |
| Backend / DB | Supabase (PostgreSQL) | Database, Auth, Row-Level Security, real-time |
| Maps | `@vis.gl/react-google-maps` | Interactive activity map |
| Containerisation | Docker + Docker Compose | Dev environment with hot reload |

---

## Architecture

```
hobbyconnect/
├── app/
│   ├── (auth)/          # Login & Register pages (public routes)
│   ├── (app)/           # Protected routes (feed, map, profile, teams, …)
│   │   └── activity/    # Activity detail + creation
│   └── actions/         # Next.js Server Actions (auth, friends, teams)
├── components/
│   ├── Activity/        # ActivityCard, CategorySelect, CreateActivityModal
│   ├── Auth/            # LoginForm, RegisterForm
│   ├── Friends/         # FriendCard, AddFriendSearch, InviteToActivityModal
│   ├── Layout/          # Navbar
│   ├── Map/             # MapView, ActivityMarker, PlacesSearch
│   ├── Notifications/   # NotificationBell
│   ├── Profile/         # ProfileClient, EditProfileModal, RatingModal, SocialLinksEditor
│   └── Teams/           # TeamCard, CreateTeamModal, InviteToTeamModal
├── lib/supabase/        # Browser and server Supabase client helpers
├── supabase/migrations/ # Sequential SQL migrations (001–007)
├── middleware.ts        # Auth guard + session refresh
├── Dockerfile           # Multi-stage Node 20 Alpine image
└── docker-compose.yml
```

The app uses the **Next.js App Router** with a clear split between server components (data fetching) and client components (interactivity). All database access goes through **Supabase** with Row-Level Security enforced at the database level. Server Actions handle mutations (auth, friend requests, team management) without a separate API layer.

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Google Maps Platform](https://developers.google.com/maps) API key with the **Maps JavaScript API** and **Places API** enabled
- Docker & Docker Compose *(optional, for containerised dev)*

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd hobbyconnect

# 2. Install dependencies
npm install

# 3. Configure environment variables (see section below)
cp .env.local.example .env.local

# 4. Apply database migrations
#    Run each file inside supabase/migrations/ in order (001 → 007)
#    via the Supabase Dashboard SQL Editor.

# 5. Start the development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the project root with the following keys (**never commit real values**):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → `anon public` key |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Cloud Console → Credentials → API Key |

### Run with Docker

```bash
docker-compose up --build
```

The app will be available at `http://localhost:3000` with hot reload enabled.

---

## Screenshots

> TODO: Add screenshots here.

| Feed | Map | Profile |
|------|-----|---------|
| ![Feed](docs/screenshots/feed.png) | ![Map](docs/screenshots/map.png) | ![Profile](docs/screenshots/profile.png) |

---

## License

> TODO: Choose a license. MIT is suggested.
>
> ```
> MIT License — Copyright (c) 2026 <your name>
> ```
