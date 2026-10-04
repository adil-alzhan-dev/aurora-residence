#!/bin/sh
# Starts a throwaway PostgreSQL in Docker, runs every API test against it and
# removes the container afterwards, even when tests fail.
set -eu

api_dir="$(cd "$(dirname "$0")/.." && pwd)"
compose_file="$api_dir/../../docker-compose.test.yml"
port="${TEST_POSTGRES_PORT:-5443}"

stop_db() {
  docker compose -f "$compose_file" down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap stop_db EXIT INT TERM

echo "Starting test PostgreSQL on 127.0.0.1:$port"
TEST_POSTGRES_PORT="$port" docker compose -f "$compose_file" up -d --wait

# Local throwaway credentials from docker-compose.test.yml, not a secret.
export TEST_DATABASE_URL="postgresql://aurora_test:aurora_test@localhost:$port/aurora_test?schema=public"

cd "$api_dir"
pnpm run test:run "$@"
