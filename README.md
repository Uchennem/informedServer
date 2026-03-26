# Informed Server

Astro renders the application pages and Express serves the API. BetterAuth is mounted on the Express server under `/api/auth/*`.

## Runtime architecture

- Astro owns page rendering and static assets.
- Express owns `/api/*` endpoints.
- BetterAuth owns `/api/auth/*`.
- Protected application APIs live under `/api/users`, `/api/groups`, and `/api/posts`.

## Development

- `npm run dev` starts Astro and Express together.
- Astro runs on `http://localhost:4321`.
- Express runs on `http://localhost:3000` by default.
- Astro proxies `/api/*` requests to Express during development.

## Environment variables

- `MONGODB_URI` — MongoDB connection string for BetterAuth and app data.
- `BETTER_AUTH_SECRET` — BetterAuth signing secret.
- `PUBLIC_API_BASE_URL` — optional explicit API origin for environments where the frontend and API are not served from the same origin.

## Auth and profile flow

1. Browser auth requests use the BetterAuth client from [src/lib/authClient.ts](src/lib/authClient.ts).
2. Registration creates the BetterAuth account first.
3. Registration then saves app profile fields to `/api/users/profile`.
4. Protected APIs resolve the session through BetterAuth middleware before responding.
