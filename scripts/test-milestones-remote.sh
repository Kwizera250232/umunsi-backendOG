#!/bin/sh
set -e

if [ -f /home/umunsi/backend-api/src/index.js ]; then
  APP_DIR=/home/umunsi/backend-api
elif [ -f /home/umunsi/htdocs/umunsi.com/src/index.js ]; then
  APP_DIR=/home/umunsi/htdocs/umunsi.com
else
  echo "APP_DIR_NOT_FOUND"
  exit 1
fi

cd "$APP_DIR"
echo "APP_DIR=$APP_DIR"

# Ensure test milestones are active.
if grep -q '^POST_VIEW_MILESTONES=' .env; then
  sed -i 's/^POST_VIEW_MILESTONES=.*/POST_VIEW_MILESTONES=100,200,500,1000,2000,5000,10000/' .env
else
  echo 'POST_VIEW_MILESTONES=100,200,500,1000,2000,5000,10000' >> .env
fi
if grep -q '^ENABLE_POST_VIEW_MILESTONE_EMAILS=' .env; then
  sed -i 's/^ENABLE_POST_VIEW_MILESTONE_EMAILS=.*/ENABLE_POST_VIEW_MILESTONE_EMAILS=true/' .env
else
  echo 'ENABLE_POST_VIEW_MILESTONE_EMAILS=true' >> .env
fi

PM2_HOME=/home/umunsi/.pm2 pm2 restart umunsi-backend --update-env >/dev/null
PM2_HOME=/home/umunsi/.pm2 pm2 save >/dev/null

POST_META=$(node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const post = await prisma.post.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, slug: true, title: true, viewCount: true }
  });
  await prisma.$disconnect();
  if (!post) {
    console.log('NO_POST');
    process.exit(0);
  }
  const safeTitle = String(post.title || '').replace(/\|/g, '/');
  console.log(`${post.id}|${post.slug}|${post.viewCount}|${safeTitle}`);
})();
NODE
)

if [ "$POST_META" = "NO_POST" ]; then
  echo "NO_PUBLISHED_POSTS"
  exit 1
fi

POST_ID=$(echo "$POST_META" | cut -d '|' -f 1)
POST_SLUG=$(echo "$POST_META" | cut -d '|' -f 2)
POST_VIEWS_BEFORE=$(echo "$POST_META" | cut -d '|' -f 3)
POST_TITLE=$(echo "$POST_META" | cut -d '|' -f 4-)
export TEST_POST_ID="$POST_ID"
export TEST_POST_SLUG="$POST_SLUG"

echo "TEST_POST_ID=$POST_ID"
echo "TEST_POST_SLUG=$POST_SLUG"
echo "TEST_POST_VIEWS_BEFORE=$POST_VIEWS_BEFORE"
echo "TEST_POST_TITLE=$POST_TITLE"

node - <<'NODE'
const fs = require('fs');
const path = require('path');
const postId = process.env.TEST_POST_ID;
const filePath = path.join(process.cwd(), 'data/post-view-milestones.json');
if (fs.existsSync(filePath)) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw || '{}');
  if (data.posts && data.posts[postId]) {
    delete data.posts[postId];
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }
}
NODE

# Hit 100
node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  await prisma.post.update({ where: { id: process.env.TEST_POST_ID }, data: { viewCount: 99 } });
  await prisma.$disconnect();
})();
NODE
curl -s "https://umunsi.com/api/posts/$POST_SLUG" >/dev/null || true

# Hit 200
node - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  await prisma.post.update({ where: { id: process.env.TEST_POST_ID }, data: { viewCount: 199 } });
  await prisma.$disconnect();
})();
NODE
curl -s "https://umunsi.com/api/posts/$POST_SLUG" >/dev/null || true

LAST_MILESTONE=$(node - <<'NODE'
const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'data/post-view-milestones.json');
const postId = process.env.TEST_POST_ID;
if (!fs.existsSync(filePath)) {
  console.log('NONE');
  process.exit(0);
}
const data = JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}');
const value = data.posts && data.posts[postId] ? data.posts[postId].lastMilestone : null;
console.log(value == null ? 'NONE' : String(value));
NODE
)

echo "MILESTONE_RECORDED=$LAST_MILESTONE"
PM2_HOME=/home/umunsi/.pm2 pm2 logs umunsi-backend --lines 40 --nostream | tail -n 40 || true
