#!/bin/bash
set -e

# Real milestone verification using the live /api/posts/:slug route.
BASE_URL="${BASE_URL:-http://localhost:3000}"
TARGET_VIEWS="${TARGET_VIEWS:-99}"
NODE_BIN="${NODE_BIN:-node}"

POST_META=$($NODE_BIN - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const post = await prisma.post.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, slug: true, title: true }
  });
  await prisma.$disconnect();
  if (!post) {
    console.log('NO_POST');
    return;
  }
  console.log([post.id, post.slug, String(post.title || '').replace(/\|/g, '/')].join('|'));
})();
NODE
)

if [ "$POST_META" = "NO_POST" ]; then
  echo "No published post found to test."
  exit 1
fi

POST_ID=$(echo "$POST_META" | cut -d '|' -f 1)
POST_SLUG=$(echo "$POST_META" | cut -d '|' -f 2)
export TEST_POST_ID="$POST_ID"

echo "Using post: $POST_META"

echo "=== Resetting view count to $TARGET_VIEWS and clearing previous milestone state ==="
$NODE_BIN - <<'NODE'
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const postId = process.env.TEST_POST_ID;
  await prisma.post.update({ where: { id: postId }, data: { viewCount: Number(process.env.TARGET_VIEWS || 99) } });
  await prisma.$disconnect();

  const filePath = path.join(process.cwd(), 'data/post-view-milestones.json');
  let data = { posts: {}, updatedAt: new Date().toISOString() };
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}');
    if (!data.posts) data.posts = {};
    delete data.posts[postId];
  }
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
})();
NODE

echo "=== Opening the article once to cross the milestone ==="
curl -s "$BASE_URL/api/posts/$POST_SLUG" >/dev/null

echo "=== Reading stored milestone state ==="
$NODE_BIN - <<'NODE'
const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'data/post-view-milestones.json');
const postId = process.env.TEST_POST_ID;
if (!fs.existsSync(filePath)) {
  console.log('RECORDED=NONE');
  process.exit(0);
}
const data = JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}');
console.log('RECORDED=' + (data.posts && data.posts[postId] ? String(data.posts[postId].lastMilestone || 'NONE') : 'NONE'));
NODE

echo "=== Done ==="
echo "If RECORDED is 100 or higher, the milestone trigger is working."
