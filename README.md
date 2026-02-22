# TrickleUp 🚀

**Minimalistic, Realtime, Enterprise-Ready SaaS Platform**

A full-stack project management SaaS built with NestJS, React, PostgreSQL, Redis, and Socket.io — inspired by ClickUp.

## ✨ Features

- 🔐 **JWT Auth** — Secure access + refresh tokens with HttpOnly cookies
- 🏢 **Multi-tenant** — Organizations with RBAC (Owner, Admin, Member, Viewer)
- 📋 **Kanban Board** — Drag-and-drop task management across projects
- ⚡ **Realtime** — Socket.io WebSocket gateway with Redis adapter
- 🔔 **Notifications** — In-app notifications with realtime push
- 📁 **File Storage** — S3-compatible upload with signed URLs
- 📊 **Analytics** — Dashboard stats, task charts, activity feeds
- 🐳 **Docker Ready** — One-command full stack deployment

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand, TanStack Query |
| Backend | NestJS, TypeScript, Prisma |
| Database | PostgreSQL 15 |
| Cache/Realtime | Redis 7, Socket.io |
| Auth | JWT (argon2), HttpOnly cookies |
| DevOps | Docker, GitHub Actions |

## 📁 Project Structure

```
trickleup/
├── apps/
│   ├── api/             # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/  # auth, users, orgs, projects, tasks, notifications, files, analytics
│   │   │   ├── realtime/ # Socket.io gateway
│   │   │   ├── prisma/   # DB service
│   │   │   └── common/   # guards, interceptors, filters, decorators
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── web/             # React frontend
│       └── src/
│           ├── pages/    # auth, dashboard, projects, notifications, settings
│           ├── components/layout/
│           ├── store/    # Zustand stores
│           └── lib/      # api, socket, queryClient
└── packages/
    └── shared/          # Shared TypeScript types
```

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- pnpm 8+ (`npm install -g pnpm`)
- Docker Desktop (for PostgreSQL + Redis)

### 1. Clone & Install

```bash
git clone <repo-url>
cd trickleup
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your values (defaults work for local dev)
```

### 3. Start Database + Redis

```bash
docker-compose up -d postgres redis
```

### 4. Setup Database

```bash
pnpm db:migrate    # Run migrations
pnpm db:generate   # Generate Prisma client
pnpm db:seed       # Seed with demo data
```

### 5. Start Development Servers

```bash
# Start both API + Web in parallel
pnpm dev

# Or individually:
pnpm dev:api   # http://localhost:3000
pnpm dev:web   # http://localhost:5173
```

### 6. Access the App

| URL | Description |
|-----|-------------|
| http://localhost:5173 | React Frontend |
| http://localhost:3000/api/docs | Swagger API Docs |
| http://localhost:3000/api/v1/analytics/health | Health Check |

**Demo credentials:**
- Email: `admin@trickleup.io`
- Password: `Admin123!`

## 🐳 Docker Full Stack

```bash
# Build and run everything
docker-compose up --build

# Frontend: http://localhost:80
# Backend API: http://localhost:3000
```

## 🗄️ Database Commands

```bash
pnpm db:migrate   # Run pending migrations
pnpm db:generate  # Regenerate Prisma client
pnpm db:seed      # Seed demo data
pnpm db:studio    # Open Prisma Studio (DB GUI)
pnpm db:reset     # Reset DB + re-seed (dev only!)
```

## 🔌 API Overview

All endpoints are prefixed with `/api/v1`. Use `x-org-id` header for tenant scoping.

| Module | Endpoints |
|--------|-----------|
| Auth | POST /auth/register, /login, /refresh, /logout; GET /auth/me |
| Organizations | CRUD /organizations, member management |
| Projects | CRUD /projects |
| Tasks | CRUD /projects/:id/tasks, PATCH /move |
| Notifications | GET, PATCH read /notifications |
| Files | POST upload-url, confirm; GET, DELETE /files |
| Analytics | GET dashboard, by-status, by-priority, activity |

## ⚡ Realtime Events (Socket.io)

```
Client → Server:  room:join, room:leave
Server → Client:  task:created, task:updated, task:deleted
                  notification:new, presence:update
```

## 🔐 Security

- Argon2 password hashing
- JWT access tokens (15min) + refresh tokens (7 days)
- HttpOnly cookies for refresh tokens
- Helmet.js security headers
- Rate limiting (20 req/sec, 300 req/min, 5000 req/hour)
- RBAC with granular permissions per organization

## 📋 Roadmap

- [ ] Phase 2: SSO (Google, GitHub), 2FA, advanced automations
- [ ] Phase 2: File versioning, virus scanning queue
- [ ] Phase 3: White-label support, API marketplace
- [ ] Phase 3: Mobile app (React Native)

---

Built with ❤️ by the TrickleUp team
