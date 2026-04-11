#!/bin/bash
set -euo pipefail

# Hostinger PostgreSQL recovery helper
# Purpose:
# 1) Keep Umunsi.com on umunsi_db
# 2) Check whether old Umunsimedia DB still exists
# 3) Restore old DB from backup if needed

NEW_DB="umunsi_db"
NEW_USER="umunsi_com_user"
CANDIDATE_OLD_DBS=("umunsi_db" "umunsimedia" "umunsimedia_db" "vop")
BACKUP_DIR="/home/umunsi/db_backups"

printf "\n[1/6] Listing current PostgreSQL databases...\n"
sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datistemplate=false ORDER BY datname;"

printf "\n[2/6] Ensuring isolated Umunsi DB exists: %s\n" "$NEW_DB"
exists_new=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${NEW_DB}'" | tr -d '[:space:]')
if [ "$exists_new" != "1" ]; then
  sudo -u postgres createdb "$NEW_DB"
fi

printf "\n[3/6] Applying grants for %s on %s\n" "$NEW_USER" "$NEW_DB"
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
GRANT CONNECT ON DATABASE ${NEW_DB} TO ${NEW_USER};
SQL

sudo -u postgres psql -d "$NEW_DB" -v ON_ERROR_STOP=1 <<SQL
GRANT USAGE ON SCHEMA public TO ${NEW_USER};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${NEW_USER};
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${NEW_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${NEW_USER};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO ${NEW_USER};
SQL

printf "\n[4/6] Checking if old Umunsimedia DB candidate names exist...\n"
for db in "${CANDIDATE_OLD_DBS[@]}"; do
  exists=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${db}'" | tr -d '[:space:]')
  if [ "$exists" = "1" ]; then
    echo "FOUND_OLD_DB=${db}"
    sudo -u postgres psql -d "$db" -tAc "SELECT 'users=' || COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='users';"
  fi
done

printf "\n[5/6] Searching backup files in %s\n" "$BACKUP_DIR"
if [ -d "$BACKUP_DIR" ]; then
  find "$BACKUP_DIR" -maxdepth 2 -type f \( -name "*.sql" -o -name "*.dump" -o -name "*.backup" \) | sort || true
else
  echo "NO_BACKUP_DIR"
fi

printf "\n[6/6] Done. If old DB is missing, restore manually with one of these commands:\n"
echo "sudo -u postgres createdb umunsimedia_restored"
echo "sudo -u postgres psql umunsimedia_restored < /path/to/backup.sql"
echo "# or for custom dump"
echo "sudo -u postgres pg_restore -d umunsimedia_restored /path/to/backup.dump"
