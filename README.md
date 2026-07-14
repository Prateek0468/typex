# TypeX

TypeX is a typing practice and racing app. The MVP lets users practice with random passages, play as a guest, create private race rooms, join a global race room, see live racer progress, and save signed-in race results to a leaderboard.

## MVP Features

- Practice mode with live WPM, accuracy, and word progress.
- Global racing room at `/room/global`.
- Server-created private racing rooms with shareable room codes.
- WebSocket-based room snapshots for joins, refreshes, progress, race starts, resets, finishes, and disconnects.
- Timer-based races that end when the room timer expires.
- Guest session stats shown in the header.
- Local leaderboard for signed-in completed races.
- Light and dark theme support.
- Go backend for auth, text generation, stat updates, and WebSocket broadcasting.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn-style UI components.
- Backend: Go, net/http, Gorilla WebSocket, PostgreSQL-ready repositories.
- Monorepo: pnpm workspaces and Turborepo.

## Project Structure

```txt
apps/web      Next.js frontend
apps/server   Go API and WebSocket server
packages/ui   Shared UI package from the starter
```

## Run Locally

Install dependencies:

```sh
pnpm install
```

Start the frontend:

```sh
pnpm --filter web dev
```

Start the backend:

```sh
cd apps/server
go run ./cmd/api
```

The frontend expects the backend at `http://localhost:8080` by default.

Optional frontend environment variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

Backend environment variables:

```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB_NAME
JWT_SECRET=replace_me
```

## How Racing Works

Rooms are created by the Go server and kept in an in-memory room store for the MVP. The same room store is shared by the HTTP room handlers and the WebSocket hub.

The room flow:

1. The client calls `POST /rooms` to create a private room.
2. The client opens `/room/{ROOM_ID}` or `/room/global`.
3. The browser joins the WebSocket room with a stable guest or user id.
4. The server sends a full room snapshot so refreshes and late joiners see the same racers.
5. Starting a race sets a server `startedAt`, `endsAt`, and text for the whole room.
6. The race ends when the timer expires, not when the fastest user finishes.
7. Private rooms are deleted automatically after they expire or stay inactive.

Supported WebSocket message types:

- `join`: a racer entered the room.
- `start`: a racer started the room countdown with the current text.
- `progress`: a racer updated progress, WPM, and accuracy.
- `finish`: a racer completed the race.
- `reset`: a racer loaded a new text for the room.
- `expire`: the client asks the server to close a race whose timer has ended.

## Current MVP Limits

- Private rooms are stored in memory, so they reset when the Go server restarts.
- The leaderboard is stored in browser local storage for signed-in users.
- The global room is a single public lobby.
- Server-side anti-cheat and winner validation are still basic.

## Post-MVP Roadmap

- Move room state and leaderboard results to PostgreSQL with ranked queries and pagination.
- Add Redis pub/sub or a managed realtime service for multi-instance deployment.
- Add OAuth login and public user profiles with best WPM, average accuracy, streaks, and race history.
- Add anti-cheat checks using expected text, elapsed time, impossible WPM thresholds, and server timestamps.
- Add matchmaking queues for global races instead of one shared global lobby.
- Add end-to-end tests for practice, room creation, joining, race start, progress sync, and leaderboard updates.
- Add deployment docs with Docker Compose for Next.js, Go, PostgreSQL, and Redis.
- Add analytics dashboards showing improvement over time.
- Add custom text packs, difficulty levels, and programming-language snippets.
