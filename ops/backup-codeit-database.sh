#!/usr/bin/env bash
set -euo pipefail

backend_dir="/home/bitnami/CodeIt/packages/codeit-backend"
backup_dir="/home/bitnami/database-backups/daily"
stamp="$(date +%Y%m%d-%H%M%S)"
client_file="$(mktemp /tmp/codeit-db-backup.XXXXXX.cnf)"

cleanup() {
  rm -f "$client_file"
}
trap cleanup EXIT

mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
cd "$backend_dir"

node - "$client_file" <<'NODE'
require('dotenv').config();
const fs = require('fs');
const target = process.argv[2];
const quoted = value => JSON.stringify(String(value));
fs.writeFileSync(target, [
  '[client]',
  `host=${quoted(process.env.DB_HOST)}`,
  `port=${quoted(process.env.DB_PORT || 3306)}`,
  `user=${quoted(process.env.DB_USER)}`,
  `password=${quoted(process.env.DB_PASSWORD)}`,
  '',
].join('\n'), { mode: 0o600 });
NODE

db_name="$(node -e "require('dotenv').config(); process.stdout.write(process.env.DB_NAME)")"
output="$backup_dir/codeit-$stamp.sql.gz"

mysqldump \
  --defaults-extra-file="$client_file" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  "$db_name" | gzip -9 > "$output"

chmod 600 "$output"
find "$backup_dir" -type f -name 'codeit-*.sql.gz' -mtime +14 -delete
