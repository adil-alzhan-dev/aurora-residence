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
refresh token is an httpOnly cookie limited to `/api/auth`. Every access token
belongs to a session row in the database, and admin routes check that session
on each request, so logout signs the device out at once.

Sign-in limits are stored in PostgreSQL and work across restarts and several
API instances: 5 failed attempts for one email (from any IP) pause sign-in for
that email for 15 minutes, and 20 failed attempts from one IP (for any emails)
pause that IP for 15 minutes. A wrong email and a wrong password get the same
answer.

A residence is reserved only with `POST /admin/residences/:number/reserve` and
an enquiry about that residence. `PATCH /admin/residences/:number` accepts the
status `AVAILABLE` or `SOLD`: from Reserved it releases or closes the
reservation. Every change is written to the residence history. Reservations
last 7 days and are released automatically by a job that runs every minute.

## HTTP and HTTPS

`HTTPS_ENABLED` in `.env` switches on everything that needs https: the `Secure`
flag on the refresh cookie and the HSTS header. It is `false` by default, so the
production build works on http://localhost, for example when showing the
project from a laptop. Set it to `true` only when the site is served over https,
otherwise browsers drop the cookie and the session cannot be refreshed. For a
public server follow the Deploy section: never publish the admin over plain
http.

## Deploy

The stack runs on any VPS with Docker. TLS ends at the nginx container, the
API and the web app stay on the internal Compose network.

1. Point the domain (for example `aurora.example.com`) to the server and open
   ports 80 and 443.
2. Get a Let's Encrypt certificate with certbot on the host while port 80 is
   free:

   ```bash
   docker compose stop nginx
   sudo certbot certonly --standalone -d aurora.example.com
   ```

3. Next to `docker-compose.yml` create `docker-compose.https.yml` and
   `nginx/https.conf` (they are server specific and not in the repository):

   ```yaml
   services:
     nginx:
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx/https.conf:/etc/nginx/conf.d/default.conf:ro
         - /etc/letsencrypt:/etc/letsencrypt:ro
   ```

   `nginx/https.conf` is `nginx/default.conf` with these changes: the port 80
   server only redirects, and the existing `location` blocks move to a 443
   server.

   ```nginx
   server {
       listen 80;
       server_name aurora.example.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       http2 on;
       server_name aurora.example.com;
       ssl_certificate     /etc/letsencrypt/live/aurora.example.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/aurora.example.com/privkey.pem;
       ssl_protocols TLSv1.2 TLSv1.3;
       # proxy settings and location blocks from nginx/default.conf
   }
   ```

4. In `.env` set `HTTPS_ENABLED=true`, `WS_ALLOWED_ORIGINS` to the site address
   (for example `https://aurora.example.com`) and strong values for every
   secret, then start:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.https.yml up -d --build
   ```

5. Check: `curl -I http://aurora.example.com` answers 301 to https, and
   `curl -I https://aurora.example.com/api/health` has a
   `Strict-Transport-Security` header. The refresh cookie must have `Secure`.
6. Renewal: certificates live 90 days. Add a cron job on the host:

   ```bash
   certbot renew --quiet \
     --pre-hook "docker compose -f /path/to/docker-compose.yml stop nginx" \
     --post-hook "docker compose -f /path/to/docker-compose.yml -f /path/to/docker-compose.https.yml up -d nginx"
   ```

The API trusts exactly one proxy hop (nginx) for the client IP used by the
sign-in limits. If another proxy or a CDN is put in front of nginx, change
`trust proxy` in `apps/api/src/app.setup.ts` to match, otherwise all visitors
share one IP limit.

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

## Tests

```bash
pnpm --filter api test
```

One command, only Docker is needed: it starts a throwaway PostgreSQL from
`docker-compose.test.yml` (in memory, on `127.0.0.1:5443`), applies the
migrations, runs the unit and end-to-end tests and removes the database, also
when tests fail. It does not touch the main stack or its data. `pnpm test` in
the root runs the same for the API. If port 5443 is taken:
`TEST_POSTGRES_PORT=5444 pnpm --filter api test`.

To run the tests against a database you already have, set `TEST_DATABASE_URL`
(the name must end with `_test`) and run `pnpm --filter api test:run`.

## Checks

Across the workspace:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

New database changes go through migrations: edit
`apps/api/prisma/schema.prisma`, then run `pnpm --filter api db:migrate`.
