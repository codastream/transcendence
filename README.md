This project has been created as part of the 42 curriculum by lisambet, fpetit, rcaillie, jhervoch, npolack.

## Description

> A full-stack multiplayer Pong web application.  
> Built as a microservices SPA with real-time gameplay, tournament system, OAuth2 auth, 2FA, an AI opponent, and blockchain score storage. It covers a wide range of concepts including real-time communication, modern authentication flows, containerized deployment, and blockchain integration.

![CI Status](https://github.com/codastream/transcendence/actions/workflows/ci.yml/badge.svg)
![User Service Coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/codastream/13a5ca1442b77566f5c439d203084db2/raw/coverage-users.json)

```
srcs/
├── auth/           # Authentication service — OAuth2 (42 API), JWT, 2FA
├── users/          # User management service — profiles, stats, friends
├── game/           # Game logic & WebSocket server — real-time Pong engine
├── pong-ai/        # AI opponent service
├── gateway/        # API gateway — routes requests between services
├── blockchain/     # Smart contract — stores match scores on-chain
├── redis/          # Session cache & pub/sub
├── nginx/          # Reverse proxy & HTTPS termination
├── shared/         # Shared types/utilities across services
└── tests/          # Integration & end-to-end test suite
```

## Instructions

```bash
# 1. Clone the repository
git clone https://github.com/codastream/transcendence.git
cd transcendence

# 2. Set up environment variables
cp srcs/.env.example            srcs/.env
cp srcs/.env.auth.example       srcs/.env.auth
cp srcs/.env.gateway.example    srcs/.env.gateway
cp srcs/.env.blockchain.example srcs/.env.blockchain
cp srcs/.env.um.example         srcs/.env.um
# → Fill in your 42 OAuth2 credentials in srcs/.env.auth

# 3. Build and launch all services
make

# 4. Stop all services
make down


# 5. Build AI opponent service separately (optional)

make ai

# 6. Run tests

make test
```

The app will be available at: **https://localhost:4430**

## Ressources

> See also our [project wiki](https://github.com/codastream/transcendence/wiki) for in-depth articles on each tool.

| Tool                                                 | Wiki Link                                                             | Related Module                       | Interested People       | Status |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------ | ----------------------- | ------ |
| [Fastify](https://fastify.dev/docs/latest/)          | [Wiki](https://github.com/codastream/transcendence/wiki/Fastify)      | Web - Backend (Minor)                |                         |        |
| [React](https://react.dev/)                          | [Wiki](https://github.com/codastream/transcendence/wiki/React)        | Web - Frontend (Major)               |                         | 👷     |
| [Tailwind CSS](https://tailwindcss.com/docs)         | [Wiki](https://github.com/codastream/transcendence/wiki/Tailwind-CSS) | Web - Frontend                       |                         | 👷     |
| [SQLite](https://github.com/WiseLibs/better-sqlite3) | [Wiki](https://github.com/codastream/transcendence/wiki/SQLite)       | -                                    |                         |        |
| [Prisma](https://www.prisma.io/docs/)                | [Wiki](https://github.com/codastream/transcendence/wiki/Prisma)       | Database - ORM (Minor)               |                         | 👷     |
| [WebSockets](https://github.com/websockets/ws)       | [Wiki](https://github.com/codastream/transcendence/wiki/WebSockets)   | Real-time / User Interaction (Major) | @codastream             |        |
| [ELK](https://www.elastic.co/guide/index.html)       | [Wiki](https://github.com/codastream/transcendence/wiki/ELK)          | DevOps - ELK (Major)                 |                         | 👷     |
| [Prometheus](https://prometheus.io/docs/)            | [Wiki](https://github.com/codastream/transcendence/wiki/Prometheus)   | DevOps - Monitoring (Major)          | @codastream             |        |
| [Grafana](https://grafana.com/docs/)                 | [Wiki](https://github.com/codastream/transcendence/wiki/Grafana)      | DevOps - Monitoring (Major)          | @codastream             |        |
| [Solidity](https://docs.soliditylang.org/)           | [Wiki](https://github.com/codastream/transcendence/wiki/Solidity)     | Blockchain (Major)                   | @codastream             |        |
| [Hardhat](https://hardhat.org/docs)                  | [Wiki](https://github.com/codastream/transcendence/wiki/Hardhat)      | Blockchain (Major)                   | @codastream             |        |
| [Docker](https://docs.docker.com/)                   | [Wiki](https://github.com/codastream/transcendence/wiki/Docker)       | -                                    | @codastream (dev setup) |        |
| [Vitest](https://vitest.dev/)                        | [Wiki](https://github.com/codastream/transcendence/wiki/Vitest)       | -                                    |                         | 👷     |
| [ESLint](https://eslint.org/)                        | [Wiki](https://github.com/codastream/transcendence/wiki/ESLint)       | -                                    |                         |        |
| [TypeScript](https://www.typescriptlang.org/docs/)   | [Wiki](https://github.com/codastream/transcendence/wiki/TypeScript)   | -                                    |                         | 👷     |
| [Zod](https://zod.dev/)                              | [Wiki](https://github.com/codastream/transcendence/wiki/Zod)          | -                                    |                         | 👷     |

How AI was used: we asked for explanation on how different libraries and tools work. We also used AI for debugging purposes and in case of blocking on a certain problem.

---

## Team Information

| Login                                   | Role(s)         | Responsibilities                                     |
| --------------------------------------- | --------------- | ---------------------------------------------------- |
| [lisambet](https://github.com/lisambet) | _Product Owner_ | _AI Opponent_                                        |
| [fpetit](https://github.com/fpetit)     | _Tech Lead_     | _User Service_                                       |
| [rcaillie](https://github.com/rcaillie) | _Developer_     | _Auth Service_                                       |
| [jhervoch](https://github.com/jhervoch) | _Tech Lead_     | _e.g. Blockchain integration, Tournament management_ |
| [npolack](https://github.com/npolack)   | _Scrum Master_  | _Game Engine_                                        |

> **\*Roles reference:**
>
> - **Product Owner:** Vision, priorities, feature validation
> - **Scrum Master:** Coordination, tracking, sprint planning, communication
> - **Tech Lead:** Architecture decisions, code quality standards, technical guidance
> - **Developer:** Implementation, code reviews, testing, documentation

---

## Project Management

◦ How the team organized the work ?

We used GitHub Issues to track tasks and features. We held regular meetings to discuss progress and blockers.

◦ Tools used for project management:

- GitHub Issues

◦ Communication channels used:

- Discord
- GitHub Code Reviews

---

## 🛠 Tech Stack

| Layer            | Technology                                    |
| ---------------- | --------------------------------------------- |
| Frontend         | TypeScript, React                             |
| Auth             | OAuth2 (42 API), JWT, 2FA (TOTP)              |
| Backend services | Node.js / TypeScript                          |
| Database         | SQLite (users), Redis (sessions)              |
| Blockchain       | Solidity, Hardhat, Ethereum                   |
| DevOps           | Docker, Docker Compose, Nginx, GitHub Actions |
| Code quality     | ESLint, Prettier, Husky, Commitlint           |

---

## Database Schema:

◦ Visual representation or description of the database structure.

Two decoupled SQLite databases — one per service. `authId` in the Users DB is a soft reference
to `users.id` in the Auth DB, resolved at runtime via inter-service API calls.

┌─────────────────────────────────────┐ ┌─────────────────────────────────────┐
│ AUTH SERVICE (SQLite) │ │ USERS SERVICE (Prisma) │
│ │ │ │
│ users │ │ UserProfile │
│ ├── id INTEGER PK │────▶│ ├── authId Int UNIQUE │
│ ├── username TEXT UNIQUE │ │ ├── username String UNIQUE │
│ ├── email TEXT UNIQUE │ │ ├── email String? UNIQUE │
│ ├── password TEXT │ │ ├── avatarUrl String? │
│ ├── role TEXT │ │ └── createdAt DateTime │
│ ├── is_2fa_enabled INTEGER │ │ │
│ ├── totp_secret TEXT? │ │ Friendship │
│ ├── google_id TEXT? UNIQUE │ │ ├── id Int PK │
│ ├── school42_id TEXT? UNIQUE │ │ ├── requesterId Int → authId │
│ └── created_at DATETIME │ │ ├── receiverId Int → authId │
│ │ │ ├── status String │
│ login_tokens │ │ └── nickname[Requester|Receiver] │
│ ├── token TEXT PK │ │ │
│ ├── user_id INT → users.id │ │ UNIQUE(requesterId, receiverId) │
│ └── expires_at DATETIME │ └─────────────────────────────────────┘
│ │
│ totp_setup_secrets │ ┌─────────────────────────────────────┐
│ ├── token TEXT PK │ │ REDIS (session store) │
│ ├── user_id INT → users.id │ │ │
│ ├── secret TEXT │ │ online:{userId} → status + TTL │
│ └── expires_at DATETIME │ │ session:{token} → JWT payload │
└─────────────────────────────────────┘ └─────────────────────────────────────┘

◦ Tables/collections and their relationships.

Auth DB Users DB
────────────────────────────── ──────────────────────────────
users (id) ──────────────────→ UserProfile (authId)
└── login_tokens └── Friendship (requesterId / receiverId)
└── totp_setup_secrets

◦ Key fields and data types.

Auth Service — users table

| Field          | Type     | Notes                             |
| -------------- | -------- | --------------------------------- |
| id             | INTEGER  | Primary key, auto-increment       |
| username       | TEXT     | Unique, used for login            |
| email          | TEXT     | Unique, nullable                  |
| password       | TEXT     | Bcrypt hash                       |
| role           | TEXT     | 'user', 'moderator', 'admin'      |
| is_2fa_enabled | INTEGER  | 0 or 1 (SQLite boolean)           |
| totp_secret    | TEXT     | Nullable, set when 2FA activated  |
| google_id      | TEXT     | Nullable, unique OAuth identifier |
| school42_id    | TEXT     | Nullable, unique OAuth identifier |
| created_at     | DATETIME | Auto, CURRENT_TIMESTAMP           |

Auth Service — token tables

| Field      | Type     | Notes                              |
| ---------- | -------- | ---------------------------------- |
| token      | TEXT     | 32-byte hex string (crypto-random) |
| expires_at | DATETIME | ISO string, checked on every use   |
| attempts   | INTEGER  | Brute-force protection counter     |

Users Service — UserProfile (Prisma)

| Field     | Type     | Notes                                  |
| --------- | -------- | -------------------------------------- |
| authId    | Int      | Unique — mirrors users.id from Auth DB |
| username  | String   | Unique display name                    |
| email     | String?  | Optional, unique                       |
| avatarUrl | String?  | URL to profile picture                 |
| createdAt | DateTime | Auto, Prisma now()                     |

Users Service — Friendship (Prisma)

| Field             | Type    | Notes                                   |
| ----------------- | ------- | --------------------------------------- |
| requesterId       | Int     | FK → UserProfile.authId, CASCADE delete |
| receiverId        | Int     | FK → UserProfile.authId, CASCADE delete |
| status            | String  | 'pending', 'accepted', 'blocked'        |
| nicknameRequester | String? | Custom alias set by requester           |
| nicknameReceiver  | String? | Custom alias set by receiver            |

Redis Keys

| Key pattern     | Value type | Notes                          |
| --------------- | ---------- | ------------------------------ |
| online:{userId} | String     | Online status with TTL expiry  |
| session:{token} | String     | JWT payload for session lookup |

## Features List:

◦ Complete list of implemented features.

Authentication (rcaillie)

    Local registration & login (username/email + password)

    OAuth2 login via 42 School and Google

    JWT-based session management (HttpOnly cookies)

    Token verification endpoint (/verify)

    Account deletion by the user

Two-Factor Authentication (rcaillie)

    TOTP setup — generates a QR code secret

    TOTP setup verification — confirms secret before activating

    TOTP login verification — required on each login when enabled

    Disable 2FA

    Check 2FA status

User Profiles (fpetit)

    Create profile (linked to authId from auth service)

    Get profile by username

    Search profiles by username query (min 2 chars)

    Update avatar (multipart upload)

    Delete profile by username or user ID

Friends System (fpetit and lisambet)

    Send friend request

    List all friends

    Remove a friend

    Update friendship status (accept / block)

    Set a custom nickname per friend (for both sides independently)

Game (npolack, jhervoch, lisambet)

    Create a game session

    List active game sessions

    Delete a session

    Real-time gameplay via WebSocket (/ws/:sessionId)

    Configurable game settings

    Match history

    Player stats

Tournaments (jhervoch)

    Create a tournament

    Join a tournament

    List all tournaments

    View tournament details

    Get current match to play

    Tournament stats

Admin Panel (fpetit)

    Admin role: update any user, delete any user

    Moderator role: list all users, force-disable any user's 2FA

Infrastructure (rcaillie, jhervoch)

    Online presence tracking via heartbeat + Redis TTL

    Check if a specific user is online

    Rate limiting on all sensitive endpoints (login, register, 2FA, OAuth, delete)

    mTLS between services (client certificate required)

    Automatic cleanup of expired tokens and TOTP secrets

## Modules:

◦ List of all chosen modules (Major and Minor).
◦ Point calculation (Major = 2pts, Minor = 1pt).
◦ Justification for each module choice, especially for custom "Modules of
choice".
◦ How each module was implemented.
◦ Which team member(s) worked on each module.

## Individual Contributions:

◦ Detailed breakdown of what each team member contributed.
◦ Specific features, modules, or components implemented by each person.
◦ Any challenges faced and how they were overcome.
