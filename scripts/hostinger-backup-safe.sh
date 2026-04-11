#!/usr/bin/env bash
set -euo pipefail

# Safe backup script for Umunsi.com (website files + PostgreSQL database)
# Run on server as root or a user with sudo access to postgres.

SITE_DIR="${SITE_DIR:-/home/umunsi/htdocs/umunsi.com}"
BACKUP_ROOT="${BACKUP_ROOT:-/home/umunsi/backups}"
DB_NAME="${DB_NAME:-umunsi_db}"
DB_SUPERUSER="${DB_SUPERUSER:-postgres}"

STAMP="$(date +%F_%H%M%S)"
TARGET_DIR="${BACKUP_ROOT}/${STAMP}"
FILES_ARCHIVE="${TARGET_DIR}/website_files_${STAMP}.tar.gz"
DB_DUMP_CUSTOM="${TARGET_DIR}/db_${DB_NAME}_${STAMP}.dump"
DB_DUMP_SQL="${TARGET_DIR}/db_${DB_NAME}_${STAMP}.sql.gz"
META_FILE="${TARGET_DIR}/backup_meta_${STAMP}.txt"

mkdir -p "${TARGET_DIR}"

if [ ! -d "${SITE_DIR}" ]; then
  echo "ERROR: SITE_DIR does not exist: ${SITE_DIR}" >&2
  exit 1
fi

echo "[1/5] Writing metadata..."
{
  echo "timestamp=${STAMP}"
  echo "hostname=$(hostname)"
  echo "site_dir=${SITE_DIR}"
  echo "db_name=${DB_NAME}"
} > "${META_FILE}"

echo "[2/5] Creating website archive..."
# Exclude volatile/cache folders to keep archive smaller while preserving app data.
tar \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='logs/*.log' \
  --exclude='tmp' \
  -czf "${FILES_ARCHIVE}" \
  -C "${SITE_DIR}" .

echo "[3/5] Creating PostgreSQL custom dump..."
sudo -u "${DB_SUPERUSER}" pg_dump -Fc "${DB_NAME}" -f "${DB_DUMP_CUSTOM}"

echo "[4/5] Creating PostgreSQL SQL dump..."
sudo -u "${DB_SUPERUSER}" pg_dump "${DB_NAME}" | gzip -c > "${DB_DUMP_SQL}"

echo "[5/5] Generating checksums..."
(
  cd "${TARGET_DIR}"
  sha256sum "$(basename "${FILES_ARCHIVE}")" "$(basename "${DB_DUMP_CUSTOM}")" "$(basename "${DB_DUMP_SQL}")" > checksums.sha256
)

echo ""
echo "BACKUP_DONE=${TARGET_DIR}"
ls -lh "${TARGET_DIR}"
echo ""
echo "Verify checksums:"
echo "cd ${TARGET_DIR} && sha256sum -c checksums.sha256"
