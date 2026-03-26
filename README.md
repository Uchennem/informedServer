# Informed

Informed is an Astro + Svelte frontend with an Express + Better Auth API.

Astro renders the application pages and Express serves the API. Better Auth is mounted on the Express server under `/api/auth/*`.

## Runtime Architecture

- Astro owns page rendering and static assets.
- Express owns `/api/*` endpoints.
- Better Auth owns `/api/auth/*`.
- Protected application APIs live under `/api/users`, `/api/groups`, and `/api/posts`.

## Local Development

Install dependencies:

```sh
npm install
```

Run frontend + API together:

```sh
npm run dev
```

- Frontend (Astro): `http://localhost:4321`
- API (Express): `http://localhost:3000`

Astro proxies `/api/*` requests to Express during development.

## Build Commands

- `npm run build` — default build (Node adapter)
- `npm run build:node` — explicit Node adapter build
- `npm run build:netlify` — Netlify adapter build
- `npm run start:api` — run Express API server

## Deploy Strategy (Netlify + Render)

### 1) Deploy API on Render

This repo includes [render.yaml](render.yaml) for the API service.

Set these Render environment variables:

- `MONGODB_URI`
- `BETTER_AUTH_SECRET`
- `FRONTEND_URL` (your Netlify site URL)
- `CORS_ORIGIN` (same Netlify URL; comma-separate if multiple)

Render uses:

- Build: `npm install`
- Start: `npm run start:api`

### 2) Deploy Frontend on Netlify

This repo includes [netlify.toml](netlify.toml).

Set these Netlify environment variables:

- `PUBLIC_API_BASE_URL` = your Render API base URL

Netlify uses:

- Build command: `npm run build:netlify`
- Publish directory: `dist`

## Environment Variables

Recommended local `.env` values:

```env
MONGODB_URI=...
BETTER_AUTH_SECRET=...
PUBLIC_API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4321
CORS_ORIGIN=http://localhost:4321
```

For production, set `PUBLIC_API_BASE_URL` to your Render API URL and set `FRONTEND_URL`/`CORS_ORIGIN` to your Netlify URL.

## Auth and Profile Flow

1. Browser auth requests use the Better Auth client from `src/lib/authClient.ts`.
2. Registration creates the Better Auth account first.
3. Registration then saves app profile fields to `/api/users/profile`.
4. Protected APIs resolve the session through Better Auth middleware before responding.
