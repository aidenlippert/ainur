#!/usr/bin/env sh
set -e

CONTAINER="${1:-ainur-network-postgres-1}"

docker exec "$CONTAINER" sh -c "printf 'local all all trust\nhost all all 127.0.0.1/32 trust\nhost all all 0.0.0.0/0 trust\nhost all all ::1/128 trust\nhost all all ::/0 trust\n' > /var/lib/postgresql/data/pg_hba.conf"
docker exec "$CONTAINER" psql -h localhost -U ainur -d ainur -c "select pg_reload_conf();"
echo "Updated pg_hba.conf and reloaded config for container: $CONTAINER"
