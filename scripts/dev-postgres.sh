#!/usr/bin/env bash
set -euo pipefail

# Simple helper to start/stop a local Postgres instance via docker compose.
# Usage:
#   ./scripts/dev-postgres.sh up   # start (detached)
#   ./scripts/dev-postgres.sh down # stop and remove container
#
# Environment overrides:
#   POSTGRES_USER (default: ainur)
#   POSTGRES_PASSWORD (default: ainur)
#   POSTGRES_DB (default: ainur)
#   POSTGRES_PORT (default: 5432)

ACTION="${1:-up}"
COMPOSE_FILE="$(dirname "$0")/../docker-compose.postgres.yml"
HOST_PORT="${POSTGRES_PORT:-5432}"
CONN_STR="postgresql://${POSTGRES_USER:-ainur}:${POSTGRES_PASSWORD:-ainur}@localhost:${HOST_PORT}/${POSTGRES_DB:-ainur}"

case "$ACTION" in
  up)
    docker compose -f "$COMPOSE_FILE" up -d
    echo "Postgres started (port ${HOST_PORT}). Connection string:"
    echo "  ${CONN_STR}"
    # Cheap health probe via psql inside the container to surface start issues early.
    if docker compose -f "$COMPOSE_FILE" exec -T postgres psql -U "${POSTGRES_USER:-ainur}" -d "${POSTGRES_DB:-ainur}" -c "select 1;" >/dev/null 2>&1; then
      echo "Health check: ok"
    else
      echo "Health check: failed (psql). Check container logs: docker compose -f \"$COMPOSE_FILE\" logs postgres"
    fi
    ;;
  down)
    docker compose -f "$COMPOSE_FILE" down
    ;;
  *)
    echo "Unknown action: $ACTION"
    echo "Usage: $0 [up|down]"
    exit 1
    ;;
esac
