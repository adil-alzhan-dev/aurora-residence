# Aurora Residence

Portfolio project: the website of Aurora Residence, a fictional residential
complex by Meridian Group. Visitors pick a residence on an interactive facade,
floor plan or grid and send an enquiry; the sales team works with residences
and enquiries in an admin panel. Status and price changes reach every open
page in real time.

The building has 11 residential floors with 6 residences each (66 in total):
studios, one-, two- and three-bedroom residences and two penthouses with
terraces on the top floor.

## Stack

- Web: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- API: NestJS 11, TypeScript, Prisma 7 with the `pg` driver adapter
- Database: PostgreSQL 16
- Runtime: Docker Compose with nginx as the single entry point

## Structure

```
apps/
  api/            NestJS API
    prisma/       schema, migrations and the demo seed
    src/          application modules
  web/            Next.js site and admin panel
nginx/            reverse proxy config
docker-compose.yml
```

nginx routes `/` to the web app, `/api` to the API and `/socket` to the API
with WebSocket upgrade headers.

## Run with Docker

```bash
cp .env.example .env
# fill in every value, secrets can be generated with: openssl rand -hex 48
docker compose up -d --build
```

Open http://localhost. API health check: http://localhost/api/health.

On start the API container applies migrations and seeds the demo data if the
database is empty.

## API

All routes are under `/api`. Public: `GET /residences`, `GET /residences/:number`,
`GET /floors`, `GET /floors/:n`, `GET /rates`, `POST /enquiries`. Sign-in:
`POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
Admin (Bearer access token): `/admin/dashboard`, `/admin/residences`,
`/admin/residences/:number/reserve|release`, `/admin/enquiries`.

The access token lives 15 minutes and is sent as `Authorization: Bearer`; the
refresh token is an httpOnly cookie limited to `/api/auth`. After 5 wrong
passwords sign-in pauses for 15 minutes for that email and IP. Reservations
last 7 days and are released automatically by a job that runs every minute.

## Demo login

- Email: `maya.collins@aurora-residence.com` (the `ADMIN_EMAIL` value)
- Password: the `ADMIN_PASSWORD` value from `.env`

## Reset demo data

Demo dates are relative to the day of seeding (the mockups use Oct 4, 2026 as
"today"). To restore all demo residences, enquiries, reservations and history
with fresh dates:

```bash
docker compose exec api node dist/prisma/seed.js
```

The seed is idempotent: residences and the admin are upserted, enquiries,
reservations and the activity log are recreated in one transaction.

## Local development

Requirements: Node.js 20.19+ and pnpm 10 (`corepack enable`).

```bash
pnpm install

# PostgreSQL from Compose, published on localhost:5432
# (set POSTGRES_DEV_PORT in .env if that port is taken)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres

# API env: same values as .env, but DATABASE_URL points to localhost
cp .env apps/api/.env
# edit apps/api/.env: ...@localhost:5432/...

pnpm --filter api exec prisma migrate deploy
pnpm --filter api db:seed
pnpm --filter api start:dev    # http://localhost:4000/api/health
pnpm --filter web dev          # http://localhost:3000
```

`pnpm test` runs unit tests and API end-to-end tests against a separate
database: set `TEST_DATABASE_URL` in `apps/api/.env` (name ending in `_test`,
created and migrated automatically) and keep the dev PostgreSQL running.

Checks across the workspace:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

New database changes go through migrations: edit
`apps/api/prisma/schema.prisma`, then run `pnpm --filter api db:migrate`.
