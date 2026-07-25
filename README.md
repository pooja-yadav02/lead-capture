# Lead Capture

A small lead-capture product: a public landing page with a validated lead form,
and a password-protected `/admin` view for triaging submissions.

- **Frontend**: plain HTML / CSS / JS (no framework, no build step)
- **Backend**: Node.js + Express
- **Database**: MongoDB (via Mongoose)

## Features

- **Public landing page** (`/`) — name, email, budget range, message
  - Client-side validation (instant feedback, no round trip)
  - Server-side validation (Express route re-validates everything — the client
    can never be trusted, since it's easy to bypass with devtools or curl)
  - Rate-limited (20 submissions / 15 min per IP) to deter spam
- **Admin view** (`/admin`) — protected by HTTP Basic Auth
  - Lists all leads, newest first
  - Search box (matches name, email, or message — debounced, hits the server)
  - Status filter dropdown (New / Contacted / Closed)
  - Status toggle per row that updates MongoDB immediately
  - Summary counts (total / new / contacted / closed)

## Project structure

```
lead-capture/
├── server.js              # Express app entry point
├── models/Lead.js          # Mongoose schema + validation rules
├── routes/leads.js         # POST/GET/PATCH /api/leads
├── middleware/adminAuth.js # HTTP Basic Auth for /admin
├── public/
│   ├── index.html           # Landing page
│   ├── admin.html            # Admin page
│   ├── style.css              # Shared styles
│   ├── script.js               # Landing page form logic + validation
│   └── admin.js                 # Admin page: fetch, search, status updates
├── .env.example
└── package.json
```

## Local setup

### 1. Prerequisites
- Node.js 18+
- A MongoDB database — either:
  - **Local**: install MongoDB Community Server and run `mongod`, or
  - **Hosted (recommended)**: create a free cluster at
    [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register), create a
    database user, and copy the connection string.

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
Then edit `.env`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/lead-capture
PORT=3000
ADMIN_USER=admin
ADMIN_PASSWORD=pick-a-real-password
```

### 4. Run it
```bash
npm start
# or, for auto-restart on file changes:
npm run dev
```

- Landing page: http://localhost:3000
- Admin: http://localhost:3000/admin (prompts for `ADMIN_USER` / `ADMIN_PASSWORD`)

## API

| Method | Route             | Auth        | Purpose                          |
|--------|--------------------|-------------|-----------------------------------|
| POST   | `/api/leads`        | Public      | Submit a new lead                 |
| GET    | `/api/leads`         | Basic Auth  | List leads (`?search=&status=`)   |
| PATCH  | `/api/leads/:id`      | Basic Auth  | Update a lead's status            |

**POST /api/leads** body:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "budgetRange": "$5,000 - $15,000",
  "message": "We need a marketing site rebuilt by Q3."
}
```
Validation rules (enforced on both client and server):
- `name`: 2–100 characters
- `email`: must be a valid email format
- `budgetRange`: must be one of the five predefined ranges
- `message`: 10–2000 characters

Failed validation returns `400` with an `errors` object keyed by field name.

## Deploying

Any Node host works. **Render** or **Railway** are the simplest for a plain
Express app (both have free tiers, auto-deploy from GitHub, and a UI for
setting environment variables).

### Render (example)
1. Push this repo to GitHub.
2. In Render: **New → Web Service** → connect the repo.
3. Build command: `npm install` — Start command: `npm start`.
4. Add environment variables: `MONGODB_URI`, `ADMIN_USER`, `ADMIN_PASSWORD`.
   (Don't set `PORT` — Render provides it automatically.)
5. Deploy. Your landing page is at the root URL Render gives you; admin is
   `<that-url>/admin`.

### MongoDB Atlas network access
If using Atlas, add `0.0.0.0/0` to the cluster's IP access list (or your
host's specific egress IPs) so your deployed server can connect.

## Notes on the admin auth

`/admin` and the admin-only API calls (`GET`/`PATCH /api/leads`) are behind
HTTP Basic Auth via `ADMIN_USER` / `ADMIN_PASSWORD`. This is intentionally
simple — good enough for a small internal tool, not a full login system. If
you need per-user accounts, sessions, or roles later, swap
`middleware/adminAuth.js` for something like Passport or a JWT-based flow;
nothing else in the app needs to change.
