set -e
export PATH=/home/umunsi/.nvm/versions/node/v22.22.2/bin:$PATH
cd /home/umunsi/backend-api
NODE_BIN=/home/umunsi/.nvm/versions/node/v22.22.2/bin/node
PM2_BIN=/home/umunsi/.nvm/versions/node/v22.22.2/bin/pm2
OUT=/tmp/run-notify-test-result.txt
{
  POST_META=$($NODE_BIN - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const post = await prisma.post.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { updatedAt: 'desc' }, select: { id: true, slug: true, title: true } });
  await prisma.$disconnect();
  if (!post) return console.log('NO_POST');
  console.log([post.id, post.slug, String(post.title || '').replace(/\|/g,'/')].join('|'));
})();
NODE
)
  echo POST_META=$POST_META
  TEST_POST_ID=$(echo "$POST_META" | cut -d '|' -f 1)
  TEST_POST_SLUG=$(echo "$POST_META" | cut -d '|' -f 2)
  export TEST_POST_ID
  $NODE_BIN - <<'NODE'
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const postId = process.env.TEST_POST_ID;
  await prisma.post.update({ where: { id: postId }, data: { viewCount: 99 } });
  await prisma.$disconnect();
  const filePath = path.join(process.cwd(), 'data/post-view-milestones.json');
  let data = { posts: {}, updatedAt: new Date().toISOString() };
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}');
    if (!data.posts) data.posts = {};
    delete data.posts[postId];
    data.updatedAt = new Date().toISOString();
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
})();
NODE
  curl -s http://127.0.0.1:3000/api/posts/$TEST_POST_SLUG >/dev/null || true
  LAST=$($NODE_BIN - <<'NODE'
const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'data/post-view-milestones.json');
const postId = process.env.TEST_POST_ID;
if (!fs.existsSync(filePath)) { console.log('NONE'); process.exit(0); }
const data = JSON.parse(fs.readFileSync(filePath, 'utf8') || '{}');
console.log(data.posts && data.posts[postId] ? String(data.posts[postId].lastMilestone || 'NONE') : 'NONE');
NODE
)
  echo RECORDED=$LAST
  echo RECENT_LOGS
  PM2_HOME=/home/umunsi/.pm2 $PM2_BIN logs umunsi-backend --lines 50 --nostream | tail -n 50 || true
} > "$OUT" 2>&1
cat "$OUT"
