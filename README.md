# 🌴 Vacations — Full Stack Project

A vacation-tagging system: registered users browse vacations, like them and filter them;
the admin adds, edits and deletes vacations and follows their popularity in reports.
Includes an AI trip-recommendation page and an AI assistant that answers questions about the data through an **MCP server**.

**GitHub:** https://github.com/josigmx/vacations-project

Developer: **Yusef Abusalah** · Full Stack Developer AI course (FS45800), John Bryce · 2026

---

## Run with Docker (recommended)

```bash
cp Backend/.env.example Backend/.env      # then set JWT_SECRET and GEMINI_API_KEY
docker compose up -d --build
```

| | Address |
|---|---|
| Website | http://localhost:8080 |
| Server (direct, for Postman) | http://localhost:3001 |

The first start fills the empty database (14 vacations, users, likes, photos).
Reset the data: `docker compose exec api npm run seed` · Stop: `docker compose down` (add `-v` to delete the data too).

Containers: **client** (React built and served by nginx, which forwards `/api` to the server) · **api** (Node.js + Express) · **mongodb** (MongoDB 7).
Volumes keep the database and the uploaded photos.

## Run locally (development)

Needs Node.js 22+ and MongoDB on `localhost:27017`.

```bash
cd Backend
cp .env.example .env        # set JWT_SECRET and GEMINI_API_KEY
npm install
npm run seed                # starting data + photos
npm run dev                 # http://localhost:3001

cd ../Frontend
npm install
npm run dev                 # http://localhost:5173
```

## Test accounts

| Role | Email | Password |
|---|---|---|
| Admin | admin@vacations.com | admin1234 |
| User | dana@test.com (also avi@, noa@, omer@, maya@, yoni@test.com) | 1234 |

## Features

| Who | What |
|---|---|
| Guest | Register · Login · About |
| User | Vacation cards sorted by start date · Like / unlike · 9 per page · filters: my likes, active now, not started yet, all |
| Admin | Add / edit / delete vacations (photo upload, all validations) · likes report chart · CSV download |
| Every logged-in user | **AI Advisor** — a trip recommendation for any destination (Google Gemini) · **MCP Assistant** — questions about the data, answered through the MCP server |

Validation runs twice: in the browser (JavaScript) and on the server.
Passwords are hashed with bcrypt; every protected request needs a JWT token; admin-only routes are checked on the server.

## Technologies

- **Frontend:** React 19, TypeScript, Vite, React Router, Recharts
- **Backend:** Node.js, Express 5, TypeScript, Mongoose, JWT, bcrypt, multer
- **Database:** MongoDB (Mongoose models: users, vacations, likes)
- **AI:** Google Gemini (`@google/genai`) · **MCP:** `@modelcontextprotocol/sdk`
- **Docker:** docker compose — nginx, Node, MongoDB

## The MCP server

`Backend/src/mcp/vacationsMcpServer.ts` — an MCP server with 3 read-only tools:

| Tool | Answers questions like |
|---|---|
| `get_vacations_summary` | How many vacations are active now? What is the average price? |
| `list_vacations` (status: all / active / upcoming / ended) | Which future vacations are in European countries? |
| `get_most_liked_vacations` (limit) | Which vacation has the most likes? |

How a question is answered (`Backend/src/services/mcpChatService.ts`): an MCP client connects to the MCP server and lists its tools →
Gemini gets the question and the tool descriptions and asks for a tool → the MCP client calls it and gets the real data →
Gemini writes the answer. The same server is also open over HTTP at `POST /mcp` (MCP Streamable HTTP, needs the login token),
so any MCP client can connect to it.

The AI calls stop waiting after 25 seconds and switch to the backup Gemini models, in order, when the main one is busy (`GEMINI_MODEL` / `GEMINI_FALLBACK_MODEL` in `.env`, a comma-separated list).

## API

| Method | Route | Who |
|---|---|---|
| POST | `/users/register` · `/users/login` | everyone |
| GET | `/vacations?filter=all\|liked\|active\|upcoming&page=1` | logged in |
| POST · DELETE | `/vacations/:id/like` | user |
| GET · PUT · DELETE | `/vacations/:id` | admin |
| POST | `/vacations` (multipart form with `image`) | admin |
| GET | `/reports/likes` · `/reports/csv` | admin |
| POST | `/ai/recommendation` · `/ai/ask` | logged in |
| POST | `/mcp` (the MCP server, JSON-RPC) | logged in |
| GET | `/images/<file name>` | everyone |

**Postman:** `Backend/Vacations-API.postman_collection.json` — 56 requests with tests, in order.
Run it from the `Backend` folder (the upload requests use `seed-images/*.jpg`):
`npx newman run Vacations-API.postman_collection.json`

## Folders

```
Database/   MongoDB export (users, vacations, likes) + import instructions
Backend/    Express server (src/), seed photos (seed-images/), Postman collection, Dockerfile
Frontend/   React app (src/), Dockerfile + nginx.conf
docker-compose.yml
```

Photo credits: `Backend/seed-images/CREDITS.md` (Wikimedia Commons, free licenses).
