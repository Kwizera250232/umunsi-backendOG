set -e
export PATH=/home/umunsi/.nvm/versions/node/v22.22.2/bin:$PATH
cd /home/umunsi/backend-api
NODE_BIN=/home/umunsi/.nvm/versions/node/v22.22.2/bin/node
PM2_BIN=/home/umunsi/.nvm/versions/node/v22.22.2/bin/pm2
OUT=/tmp/diagnose-notify-result.txt
{
  echo ENV_SET
  for v in ENABLE_POST_VIEW_MILESTONE_EMAILS MILESTONE_MAIL_PROVIDER SMTP_HOST SMTP_USER SMTP_FROM MAILTRAP_API_TOKEN MAILTRAP_SENDER_EMAIL MILESTONE_RECIPIENT_MODE MILESTONE_SUPPORT_EMAIL; do
    if grep -q "^${v}=" .env; then echo "$v=SET"; else echo "$v=MISSING"; fi
  done
  echo DB_CHECK
  $NODE_BIN - <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const post = await prisma.post.findFirst({ where: { status: 'PUBLISHED' }, orderBy: { updatedAt: 'desc' }, include: { author: { select: { email: true, isActive: true, firstName: true, lastName: true, username: true } } } });
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN', isActive: true }, select: { email: true } });
  console.log('POST_ID=' + post.id);
  console.log('POST_SLUG=' + post.slug);
  console.log('VIEWS=' + post.viewCount);
  console.log('AUTHOR_EMAIL=' + (post.author?.email || 'NONE'));
  console.log('AUTHOR_ACTIVE=' + String(post.author?.isActive));
  console.log('ADMIN_EMAILS=' + admins.map(a => a.email).filter(Boolean).length);
  await prisma.$disconnect();
})();
NODE
  echo LOG_GREP
  PM2_HOME=/home/umunsi/.pm2 $PM2_BIN logs umunsi-backend --lines 200 --nostream | grep -i 'milestone\|mailtrap\|smtp\|notification failed' | tail -n 80 || true
} > "$OUT" 2>&1
cat "$OUT"
