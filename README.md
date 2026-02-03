# PlaySense

**Privacy-First Parental Gaming Insights Platform**

> *"Insight, not intrusion."*

[![Website](https://img.shields.io/badge/Website-playsense.co.in-blue)](https://playsense.co.in)
[![License](https://img.shields.io/badge/License-Private-red)]()

---

## Overview

PlaySense helps parents understand their children's gaming habits through non-invasive monitoring and intelligent insights. Unlike surveillance tools, PlaySense focuses on **conversation starters** rather than control - empowering families to have meaningful discussions about healthy gaming.

### Key Principles
- 🔒 **Privacy-First** - Data stays local; only summaries sync to cloud
- 💬 **Conversation, Not Control** - Insights to start discussions, not restrict access
- 📊 **Data-Driven** - Real metrics on gaming time, patterns, and habits
- 🎮 **Game-Aware** - Categorizes games by type (competitive, creative, casual, social)

---

## Features

### 📱 Web Dashboard (Parent Portal)

| Feature | Description |
|---------|-------------|
| **Health Score** | Overall gaming health score (0-100) based on patterns |
| **Today's Activity** | Real-time view of today's gaming sessions |
| **Weekly Overview** | 7-day chart with daily gaming hours |
| **Category Breakdown** | Pie chart: Competitive vs Creative vs Casual vs Social |
| **Game Dominance** | Alerts if one game takes >70% of gaming time |
| **Late Night Gaming** | Tracks sessions after 10 PM |
| **Burnout Risk** | Assessment based on session length and frequency |
| **Weekday vs Weekend** | Compare gaming patterns across the week |

### 🎯 Advanced Insights

| Feature | Description |
|---------|-------------|
| **Achievements System** | Gamification for healthy gaming habits |
| **Session Notes** | Parents can annotate gaming sessions for context |
| **Social Comparison** | Anonymous comparison with age-group averages |
| **Conversation Guidance** | AI-suggested talking points for parent-child discussions |

### 🎁 Rewards System

| Feature | Description |
|---------|-------------|
| **Points Balance** | Children earn points for healthy gaming |
| **Custom Rewards** | Parents define rewards (screen time, treats, etc.) |
| **Redemption Requests** | Child requests reward → Parent approves |
| **Welcome Bonus** | 50 points on first setup |

### 💻 Desktop Companion App (Windows)

| Feature | Description |
|---------|-------------|
| **Background Monitoring** | Runs silently in system tray |
| **Game Detection** | Auto-detects 20+ popular games |
| **Session Tracking** | Records start/end times and duration |
| **Real-Time Sync** | Instantly syncs sessions to cloud |
| **Tamper Protection** | Prevents unauthorized termination |
| **Admin Password** | Required to uninstall or close |

### 📧 Weekly Email Digests

Automated weekly summaries sent to parents:
- Total gaming time
- Most played games
- Health score trends
- Action items

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **Desktop** | Electron, better-sqlite3, Node.js |
| **Deployment** | Vercel (Web), S3 (Desktop installer) |
| **CI/CD** | GitHub Actions |

---

## Project Structure

```
Play-Sense-Cursor/
├── packages/
│   ├── web/                 # Next.js web dashboard
│   │   ├── src/
│   │   │   ├── app/         # App router pages
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── lib/         # Utilities
│   │   └── package.json
│   │
│   ├── desktop/             # Electron companion app
│   │   ├── electron/        # Main process
│   │   ├── src/             # Renderer (React)
│   │   └── package.json
│   │
│   └── shared/              # Shared types & constants
│
├── supabase/
│   ├── functions/           # Edge Functions
│   └── migrations/          # Database migrations
│
├── .github/
│   └── workflows/
│       └── ci.yml           # CI/CD pipeline
│
└── package.json             # Monorepo root
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/playsense.git
cd playsense

# Install dependencies
npm install

# Start web app
npm run dev:web

# Start desktop app (separate terminal)
npm run dev:desktop
```

### Environment Variables

**Web App** (`packages/web/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_COMPANION_APP_URL=your-s3-download-url
```

**Desktop App** (`packages/desktop/.env`):
```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CHILD_ID=child-uuid
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Start web app (localhost:3000) |
| `npm run dev:desktop` | Start desktop app |
| `npm run build:web` | Build web for production |
| `npm run build:desktop` | Build Windows installer |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |
| `npm run type-check` | TypeScript check |

---

## Deployment

### Web App → Vercel
1. Connect GitHub repo to Vercel
2. Set root directory: `packages/web`
3. Add environment variables
4. Deploy

### Desktop App → S3
1. Build: `npm run build:desktop`
2. Upload `.exe` to S3
3. Set public read permission
4. Update `NEXT_PUBLIC_COMPANION_APP_URL`

---

## Security

- **Row-Level Security (RLS)** on all Supabase tables
- **Security Headers** (X-Frame-Options, CSP, etc.)
- **ESLint Security Plugin** for code scanning
- **npm audit** in CI pipeline
- **Service Role Key** never exposed to client

---

## Domain

**Website**: [playsense.co.in](https://playsense.co.in)

---

## License

Private - All rights reserved.

---

## Contributing

This is a private project. Please contact the maintainer for access.

---

*Built with ❤️ for mindful parenting in the digital age.*
