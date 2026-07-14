# TypeX

TypeX is a typing practice and racing app. The MVP lets users practice with random passages, create private race rooms, join a global race room, see live racer progress, and save completed race results to a local leaderboard.

## MVP Features

- Practice mode with live WPM, accuracy, and word progress.
- Global racing room at `/room/global`.
- Private racing rooms with shareable room codes.
- WebSocket-based race start, reset, progress, and finish messages.
- Local leaderboard for completed races.
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

The MVP uses the existing Go WebSocket hub as a broadcast server. The frontend sends JSON messages with a `roomId`, so each browser only processes messages for the room it joined.

Supported client message types:

- `join`: a racer entered the room.
- `start`: a racer started the countdown with the current text.
- `progress`: a racer updated progress, WPM, and accuracy.
- `finish`: a racer completed the race.
- `reset`: a racer loaded a new text for the room.

## Current MVP Limits

- The leaderboard is stored in browser local storage, not yet in PostgreSQL.
- Private room codes are generated on the client.
- The WebSocket hub broadcasts to all connected users, and the frontend filters by `roomId`.
- There is no reconnect recovery or server-side winner validation yet.

## Post-MVP Roadmap for CV Impact

- Add persistent global leaderboards backed by PostgreSQL with ranked queries and pagination.
- Add server-side room state so rooms survive refreshes and late joiners receive current race data.
- Add Redis pub/sub or a managed realtime service for multi-instance deployment.
- Add OAuth login and public user profiles with best WPM, average accuracy, streaks, and race history.
- Add anti-cheat checks using expected text, elapsed time, impossible WPM thresholds, and server timestamps.
- Add matchmaking queues for global races instead of one shared global lobby.
- Add end-to-end tests for practice, room creation, joining, race start, progress sync, and leaderboard updates.
- Add deployment docs with Docker Compose for Next.js, Go, PostgreSQL, and Redis.
- Add analytics dashboards showing improvement over time.
- Add custom text packs, difficulty levels, and programming-language snippets.
