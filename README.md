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

◦ Tools used for project management (GitHub Issues, Trello, etc.).
◦ Communication channels used (Discord, Slack, etc.).

---

## 🛠 Tech Stack

| Layer            | Technology                                    |
| ---------------- | --------------------------------------------- |
| Frontend         | TypeScript SPA (Vanilla / framework)          |
| Auth             | OAuth2 (42 API), JWT, 2FA (TOTP)              |
| Backend services | Node.js / TypeScript                          |
| Database         | PostgreSQL (users), Redis (sessions)          |
| Blockchain       | Solidity, Hardhat, Ethereum                   |
| DevOps           | Docker, Docker Compose, Nginx, GitHub Actions |
| Code quality     | ESLint, Prettier, Husky, Commitlint           |

---

## Database Schema:

◦ Visual representation or description of the database structure.
◦ Tables/collections and their relationships.
◦ Key fields and data types.

## Features List:

◦ Complete list of implemented features.
◦ Which team member(s) worked on each feature.
◦ Brief description of each feature’s functionality.

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
