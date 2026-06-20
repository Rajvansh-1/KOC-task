# Kingdom of Chess (KOC) Arena

An elite, full-stack real-time chess matchmaking and tournament platform. Built with a focus on high concurrency, clean architecture, and a premium "glassmorphism" user experience.

## 🚀 One-Command Setup (For Reviewers)

To guarantee a zero-friction review experience, the entire application (Database + Backend + Frontend) is orchestrated via Docker Compose.

**Prerequisites:**
- Docker Desktop installed and running.
- Port `3000`, `3001`, and `5432` available.

1. Clone the repository and navigate into it.
2. Run the following command:

```bash
docker compose up -d --build
```

**What this does automatically:**
1. Spins up a PostgreSQL 16 database.
2. Builds the **NestJS Backend**, automatically runs `drizzle-kit` schema migrations, and seeds test accounts.
3. Builds the **Next.js Frontend** (in standalone mode for a lightweight image).
4. Links them all together on a shared bridge network.

### 🌐 Endpoints
- **Frontend (Web App):** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## 🔑 Test Credentials (Auto-Seeded)

The system automatically seeds the following accounts so you can test immediately:

| Role | Name | Email | Password |
|---|---|---|---|
| **Coach** | Coach Carter | `coach@koc.com` | `Coach@123` |
| **Student** | Alice | `alice@koc.com` | `Student@123` |
| **Student** | Bob | `bob@koc.com` | `Student@123` |
| **Student** | Charlie | `charlie@koc.com` | `Student@123` |
| **Student** | Diana | `diana@koc.com` | `Student@123` |
111
### Recommended Testing Flow:
1. **Coach:** Open a normal browser window, log in as `coach@koc.com`. Create a new Tournament (e.g., "Grand Arena").
2. **Student 1:** Open an **Incognito** window, log in as `alice@koc.com`. Navigate to the Tournament, click "Join", then "Find Match".
3. **Student 2:** Open a **second Incognito** window (or different browser), log in as `bob@koc.com`. Join the same tournament, click "Find Match".
4. **Match:** The system will pair them. Play some moves. The clock ticks down automatically.
5. **Leaderboard:** Finish the match (e.g., resign or play to checkmate). Go back to the tournament to see the updated Buchholz leaderboard.

---

## 🏗️ Architecture & Technology Stack

The project follows a strict Monorepo structure managed by `pnpm workspaces`.

### Backend (`/backend`)1
- **Framework:** NestJS (Express under the hood)
- **Database:** PostgreSQL accessed via Drizzle ORM
- **Auth:** Stateless JWT (`jose` and `passport-jwt`) issued via `httpOnly` secure cookies to prevent XSS.
- **Real-Time:** Socket.IO Gateway handling concurrent rooms, strict FEN/PGN move validation (using `chess.js`), and matchmaking queues.

### Frontend (`/frontend`)
- **Framework:** Next.js 15 (App Router, React 19)
- **Styling:** Tailwind CSS v4 + `shadcn/ui` components
- **State Management:** Zustand (for Auth and Live Match stores) + TanStack React Query (for data fetching/caching)
- **Real-Time UI:** `react-chessboard` dynamically controlled via Socket.IO events.
- **Aesthetic:** Deep violet/slate dark mode with dynamic gradient backgrounds, glassmorphism overlays, and micro-animations.

---

## 📡 Socket.IO Real-Time Architecture

The real-time engine relies on the `MatchmakingGateway`. Here's the event flow:

1. **`matchmaking:join`** (Client → Server)
   - Verifies JWT cookie via `WsJwtGuard`.
   - Ensures user is enrolled in the tournament.
   - Pushes player into the memory queue.

2. **`match:ready`** (Server → Client)
   - When the matchmaking loop finds two queued players, it creates a `Match` record in DB.
   - It fires `match:ready` with `matchId` telling clients to redirect to the board page.

3. **`match:join`** (Client → Server)
   - Client enters the unique Socket.IO room (the `matchId`).
   - Server responds with **`match:state`** containing FEN, clocks, and player info.

4. **`match:move`** (Client → Server)
   - Client proposes a move.
   - Server validates the move legally via `chess.js`.
   - If valid, broadcasts **`match:move_played`** and ticks the internal server clock.

5. **`match:ended`** (Server → Client)
   - Emitted on Checkmate, Resignation, or Timeout. Updates leaderboard DB, ends the game loop.

---

## 🛡️ Decisions & Trade-Offs

- **Stateless WebSockets:** WebSockets are authenticated automatically using the same `httpOnly` cookie as the REST API, avoiding the need to manually pass tokens in socket handshakes, which dramatically increases security.
- **Server-Side Game State:** The ultimate source of truth for the chess game is `chess.js` running in the NestJS Gateway. Clients only send the move intent (`{ from: 'e2', to: 'e4' }`); the server computes the new FEN. This prevents cheating.
- **Next.js Edge Middleware:** Protects authenticated routes directly at the edge using the `jose` library (since standard `jsonwebtoken` relies on Node APIs not available in Vercel Edge).
- **PostgreSQL vs Supabase:** While Supabase was considered, raw Dockerized Postgres was chosen to guarantee a 100% offline, self-contained reviewer experience without requiring third-party API keys or internet dependencies.
