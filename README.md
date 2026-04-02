# Informed

Informed is a campus community web app that helps students:

- discover events and announcements,
- RSVP to activities,
- join interest-based groups,
- find people with shared interests,
- and build a personal profile.

The project uses an Astro + Svelte frontend and an Express API with Better Auth for session-based authentication.

## Project Purpose

This project was built as a course deliverable to demonstrate full-stack integration between frontend islands/pages and a backend API. The implementation emphasizes:

- authenticated user flows,
- social interaction features (RSVP, group join, connect requests),
- and clear separation of frontend rendering and API responsibilities.

## Team Members

Contributors from git history:

- Ethan
- Andrew Steele
- Uche Oranye

Note: git history includes multiple aliases/emails for some contributors.

## Tech Stack

- Frontend: Astro, Svelte, Tailwind CSS
- Backend: Express
- Authentication: Better Auth
- Database: MongoDB
- Deployment: Netlify (frontend), Render (API)

## Architecture Overview

- Astro renders pages and mounts interactive Svelte islands.
- Express serves API endpoints under `/api/*`.
- Better Auth is mounted at `/api/auth/*`.
- Session-aware app APIs are mounted at:
	- `/api/users`
	- `/api/groups`
	- `/api/posts`

## Setup and Installation

### 1) Prerequisites

- Node.js 22.12.0+
- npm
- MongoDB instance (local or hosted)

### 2) Clone and install

```bash
git clone <your-repo-url>
cd informedServer
npm install
```

### 3) Configure environment variables

Create a `.env` file in the project root:

```env
MONGODB_URI=your_mongodb_uri
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000
PUBLIC_API_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4321
CORS_ORIGIN=http://localhost:4321
```

### 4) Run in development

```bash
npm run dev
```

Local URLs:

- Frontend: http://localhost:4321
- API: http://localhost:3000

### 5) Build for production

```bash
npm run build
```

Other useful scripts:

- `npm run build:node`
- `npm run build:netlify`
- `npm run start:api`

## API Documentation

Base URL (local): `http://localhost:3000`

Authentication is cookie/session based. Most app endpoints require an authenticated session (`credentials: include` on frontend fetch calls).

### Auth API (`/api/auth/*`)

Handled by Better Auth.

- `POST /api/auth/sign-up/email`
	- Creates a new account.
	- Body: `{ email, password, name }`
- `POST /api/auth/sign-in/email`
	- Signs in an existing user.
	- Body: `{ email, password }`
- `POST /api/auth/sign-out`
	- Signs out current session.

### Users API (`/api/users`)

All routes are protected by auth middleware.

- `GET /api/users`
	- Returns current authenticated user payload.
- `GET /api/users/me`
	- Returns current user with onboarding state.
- `GET /api/users/matches`
	- Returns users with shared interests.
- `POST /api/users/interests`
	- Saves user interests.
	- Body: `{ interests: string[] }`
- `PUT /api/users/profile`
	- Updates profile fields.
	- Body: `{ major, year }`
- `GET /api/users/:id`
	- Returns public profile data for a user.
- `POST /api/users/:id/connect`
	- Creates/toggles a pending connection request to target user.
- `DELETE /api/users/:id/connect`
	- Removes a pending connection request to target user.

### Groups API (`/api/groups`)

All routes are protected by auth middleware.

- `GET /api/groups`
	- Returns group catalog with membership info.
- `POST /api/groups/:groupId/join`
	- Joins the specified group.
- `DELETE /api/groups/:groupId/leave`
	- Leaves the specified group.

### Posts API (`/api/posts`)

- `GET /api/posts`
	- Returns posts.
	- Optional query params: `category`, `author`
- `POST /api/posts` (protected)
	- Creates a post.
	- Body: `{ title, body, category }`
- `PUT /api/posts/:id` (protected; author only)
	- Updates a post.
	- Body: any of `{ title, body, category }`
- `DELETE /api/posts/:id` (protected; author only)
	- Deletes a post.
- `POST /api/posts/:id/rsvp` (protected)
	- Toggles RSVP status for current user.
	- Returns `{ rsvpCount, isRsvped }`
- `POST /api/posts/:id/save` (protected)
	- Toggles save/unsave for current user.
- `GET /api/posts/saved` (protected)
	- Returns saved posts for current user.

### Health / Root API

- `GET /`
	- Returns API metadata/status payload from the Express root router.

## Frontend-Backend Integration Notes

The frontend uses the Fetch API (not external HTTP libraries) for app interactions:

- Create post: `POST /api/posts`
- RSVP toggle: `POST /api/posts/:id/rsvp`
- Group membership: `POST /api/groups/:id/join`, `DELETE /api/groups/:id/leave`
- Connect requests: `POST/DELETE /api/users/:id/connect`
- Auth forms: `POST /api/auth/sign-in/email`, `POST /api/auth/sign-up/email`

## Deployment Notes

### Render (API)

Use `render.yaml` and set:

- `MONGODB_URI`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `FRONTEND_URL`
- `CORS_ORIGIN`

Start command:

```bash
npm run start:api
```

### Netlify (Frontend)

Use `netlify.toml` and set:

- `PUBLIC_API_BASE_URL` = Render API URL

Build command:

```bash
npm run build:netlify
```

## Known Issues

- Connection requests are currently stored as pending records only; full accept/reject workflows are not yet implemented.
- Group catalog is currently seeded from in-code base group data and not yet fully database-managed.
- Error messaging is user-friendly but could be further standardized across all endpoints.
- There is limited automated test coverage in the current codebase.

## Future Improvements

- Add full connection management (accept, reject, cancel, and notifications).
- Add robust automated testing (unit, integration, and end-to-end).
- Move all group/post seed and metadata into dedicated DB admin tooling.
- Add role-based moderation for posts and groups.
- Add pagination and filtering improvements for feed and people discovery.
- Improve analytics and observability (request tracing, metrics, and structured logs).

## Course Deliverable Checklist

- Project description and purpose: complete
- Team member list: complete
- Setup and installation instructions: complete
- API endpoint documentation: complete
- Known issues and future improvements: complete
