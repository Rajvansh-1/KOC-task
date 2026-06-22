<div align="center">
  <img src="./frontend/public/complete-logo.webp" width="200" alt="KOC Arena Logo" />
  <h1>♚ Kingdom of Chess (KOC) Arena ♚</h1>
  <p><strong>A Full-Stack, Real-Time, Server-Authoritative Multiplayer Chess Platform</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
  [![Socket.IO](https://img.shields.io/badge/Socket.IO-Real%20Time-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
  [![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
</div>

---

## 📖 Table of Contents
1. [🌟 Core Features](#-core-features)
2. [🛠️ Tech Stack](#️-tech-stack)
3. [🏗️ System Architecture](#️-system-architecture)
4. [📂 Codebase Structure](#-codebase-structure)
5. [🚀 Quickstart: From Clone to Play](#-quickstart-from-clone-to-play)
6. [📸 Demo Screenshots](#-demo-screenshots)
7. [📡 WebSockets Dictionary](#-websockets-dictionary)
8. [⚖️ Engineering Decisions & Trade-offs](#️-engineering-decisions--trade-offs)

---

## 🌟 Core Features

| Feature | Description |
|---|---|
| **Real-Time Gameplay** | Instant move syncing between players using WebSockets. |
| **Cheat-Proof Engine** | The backend verifies every move. Players cannot hack the browser to cheat. |
| **Auto Matchmaking** | Students wait in a queue and are automatically paired together. |
| **Smart Reconnections** | If your browser refreshes, you jump right back into your game safely. |
| **Live Leaderboards** | Points (Win = 1, Draw = 0.5) automatically update tournament rankings. |
| **Role Security** | Secure JWT accounts keep Coaches (Admins) and Students separate. |

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
|---|---|
| **Frontend UI** | Next.js 15, React 19, TailwindCSS v4, shadcn/ui |
| **Backend API** | NestJS 11, TypeScript |
| **Real-Time Sync** | Socket.IO |
| **Database** | PostgreSQL, Drizzle ORM |
| **Game Logic** | `chess.js` |

---

## 🏗️ System Architecture

The project maintains a strict separation of concerns. The Next.js frontend handles UI/UX and optimistic rendering, while the NestJS backend handles all state mutation, validation, and real-time broadcasting.

### Component Relationship
```mermaid
graph TD
    subgraph Frontend [Next.js Client]
        UI[React 19 Components]
        Store[Zustand State]
        SocketC[Socket.IO Client]
        Board[react-chessboard]
    end

    subgraph Backend [NestJS Server]
        REST[REST Controllers]
        Gateway[WebSocket Gateway]
        Engine[Headless chess.js]
        MatchSvc[Matches Service]
    end

    subgraph Database [PostgreSQL]
        DB[(KOC Database)]
    end

    UI -->|REST APIs| REST
    UI <-->|Socket Events| SocketC
    SocketC <-->|Bi-directional Sync| Gateway
    Gateway -->|Validates moves| Engine
    Gateway -->|Records Results| MatchSvc
    REST --> DB
    MatchSvc --> DB
```

### Matchmaking & Core Loop Flow
```mermaid
sequenceDiagram
    autonumber
    actor Alice (Student)
    actor Bob (Student)
    participant Server as Matchmaking Gateway
    participant DB as Postgres
    
    Alice->>Server: match:join (Tournament Queue)
    Bob->>Server: match:join (Tournament Queue)
    Note over Server: Server pairs Alice & Bob
    Server->>DB: createMatch()
    Server-->>Alice: match:ready (Redirects to Board)
    Server-->>Bob: match:ready (Redirects to Board)
    
    Note over Alice,Bob: Live Match Commences
    Alice->>Server: move:make (e2 -> e4)
    Server->>Server: Validate move & deduct elapsed time
    Server->>DB: persistMove()
    Server-->>Alice: move:made (Updates timers)
    Server-->>Bob: move:made (Updates board & timers)
```

---

## 📂 Codebase Structure

The repository is built as a highly scalable monorepo-style structure, housing both discrete services:

```text
KOC-task/
├── backend/                  # NestJS Application
│   ├── src/
│   │   ├── auth/             # JWT Authentication & Role Guards
│   │   ├── users/            # User Management & Seeders
│   │   ├── tournaments/      # Tournament CRUD operations
│   │   ├── matches/          # Database persistence for live matches
│   │   ├── matchmaking/      # THE CORE: Socket.IO Gateway & Live State
│   │   └── leaderboard/      # Ranking calculations
│   └── drizzle/              # DB Schema & Migrations
│
├── frontend/                 # Next.js Application
│   ├── src/
│   │   ├── app/              # App Router Pages (Login, Matches, etc)
│   │   ├── components/       # Reusable UI Components (shadcn)
│   │   ├── hooks/            # Custom Hooks (useSocket)
│   │   └── store/            # Zustand Stores (useMatchStore)
│   └── public/               # Static Assets
│
└── docker-compose.yml        # Orchestrates Postgres, Backend, and Frontend
```

---

## 🚀 Quickstart: From Clone to Play

We have containerized the entire stack for an absolutely frictionless reviewing experience. No need to install Postgres locally or juggle node versions!

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd KOC-task
```

### Step 2: Ensure Docker is Running
Make sure you have **Docker Desktop** installed and running on your machine.

### Step 3: Spin Up the Stack
Just run this one simple command from the root of the project! It will automatically start the database, backend, and frontend for you. No manual environment configuration is needed.
```bash
docker compose up --build -d
```

### Step 4: Verify the Services
The application is now live!
- **Frontend UI:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

### Step 5: Test the Application (The Live Match)
The database has already been seeded with dummy accounts. Here is exactly how to test the real-time matchmaking and gameplay:

**1. Create & Start a Tournament (As a Coach)**
1. Open a browser tab to `http://localhost:3000`.
2. Log in using the Coach credentials:
   - **Email:** `coach@koc.com`
   - **Password:** `Coach@123`
3. Click **Create Tournament**, give it a name, and hit Save.
4. On the tournament's details page, click the **Start Tournament** button. The status will change from `DRAFT` to `OPEN`.

**2. Join the Matchmaking Queue (As Students)**
1. Open a brand new **Incognito/Private** window.
2. Log in as Student 1:
   - **Email:** `alice@koc.com`
   - **Password:** `Student@123`
3. Navigate to the tournament you just created, hit **Join**, and then click **Find Match**. Alice is now waiting in the queue.
4. Open a *second*, completely separate **Incognito/Private** window.
5. Log in as Student 2:
   - **Email:** `bob@koc.com`
   - **Password:** `Student@123`
6. Navigate to the same tournament, hit **Join**, and click **Find Match**.

**3. Play the Game!**
1. The server will instantly detect two eligible players, pair them, generate a game, and seamlessly route both browsers to the live 3D chessboard.
2. The user assigned **White** goes first. Drag and drop a piece!
3. Watch the clocks automatically sync and count down in real time, and watch the move instantly replicate onto the opponent's screen via WebSockets.
4. Test out the **Resign** button to immediately end the match and declare a winner!

---

## 📸 Demo Screenshots
<div align="center">
  <img src="./frontend/public/screenshots/demo-1.png" width="800" alt="Demo 1" />
  <br/><br/>
  <img src="./frontend/public/screenshots/demo-2.png" width="800" alt="Demo 2" />
  <br/><br/>
  <img src="./frontend/public/screenshots/demo-3.png" width="800" alt="Demo 3" />
  <br/><br/>
  <img src="./frontend/public/screenshots/demo-4.png" width="800" alt="Demo 4" />
  <br/><br/>
  <img src="./frontend/public/screenshots/demo-5.png" width="800" alt="Demo 5" />
  <br/><br/>
  <img src="./frontend/public/screenshots/demo-6.png" width="800" alt="Demo 6" />
  <br/><br/>
  <img src="./frontend/public/screenshots/demo-7.png" width="800" alt="Demo 7" />
</div>

---

### Seeded Credentials Cheat Sheet
If you want to test further, the following accounts exist in the database:
| Role | Name | Email | Password |
|:---:|:---|:---|:---|
| 👑 **Coach** | Admin Coach | `coach@koc.com` | `Coach@123` |
| ♟️ **Student** | Alice Sharma | `alice@koc.com` | `Student@123` |
| ♟️ **Student** | Bob Verma | `bob@koc.com` | `Student@123` |
| ♟️ **Student** | Charlie King | `charlie@koc.com` | `Student@123` |
| ♟️ **Student** | Diana Queen | `diana@koc.com` | `Student@123` |

---

## 📡 WebSockets Dictionary

The entire live-play feature operates on a single Socket.IO connection. Below is the documentation for all custom events emitted and received.

| Event Name | Direction | Payload Example | Purpose |
|---|---|---|---|
| `matchmaking:join` | **C → S** | `{ tournamentId: "uuid" }` | Pushes player into the FIFO waiting queue. |
| `match:ready` | **S → C** | `{ matchId: "uuid", color: "white" }` | Notifies paired clients to redirect to match room. |
| `match:join` | **C → S** | `{ matchId: "uuid" }` | Connects socket to the specific match room ID. |
| `match:state` | **S → C** | `{ fen: "rnb...", turn: "white", ... }` | Emits current server-authoritative board state. |
| `move:make` | **C → S** | `{ matchId: "uuid", from: "e2", to: "e4" }` | Attempts to make a move. Server validates. |
| `move:made` | **S → C** | `{ fen: "...", turn: "black" }` | Broadcasts validated move to both players. |
| `clock:tick` | **S → C** | `{ whiteTimeMs: 290000 }` | Fired dynamically to sync countdowns. |
| `game:resign` | **C → S** | `{ matchId: "uuid" }` | Player requests to forfeit. |
| `game:over` | **S → C** | `{ result: "white_wins" }` | Match has ended (mate, draw, resign, timeout). |

---

## ⚖️ Engineering Decisions & Trade-offs

| Decision | Why we did it | The Trade-off |
|---|---|---|
| **Separating Frontend & Backend** | Keeps the code clean. Frontend handles UI, Backend handles heavy game logic. | Requires running two separate servers. |
| **Using Socket.IO** | Automatically handles dropped connections and WiFi flickers. | Slightly heavier than raw WebSockets. |
| **Server-Side Move Validation** | 100% security against cheating. We don't trust the browser. | Uses slightly more backend server memory. |
| **Using Drizzle ORM** | Extremely fast and generates very lightweight SQL queries. | Requires writing more explicit database schemas. |

---

<div align="center">
  <b>Designed & Developed by <a href="https://github.com/Rajvansh-1">Rajvansh-1</a></b>
</div>
