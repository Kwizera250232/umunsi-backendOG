const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const outArg = process.argv[2];
  if (!outArg) {
    throw new Error('Usage: node scripts/export-sqlite-data.js <output-json-path>');
  }

  const outPath = path.resolve(process.cwd(), outArg);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const prisma = new PrismaClient();
  try {
    const data = {
      user: await prisma.user.findMany(),
      category: await prisma.category.findMany(),
      news: await prisma.news.findMany(),
      mediaFile: await prisma.mediaFile.findMany(),
      post: await prisma.post.findMany(),
      supportPayment: await prisma.supportPayment.findMany(),
      premiumPostAccess: await prisma.premiumPostAccess.findMany(),
      classifiedAd: await prisma.classifiedAd.findMany(),
      classifiedBroadcast: await prisma.classifiedBroadcast.findMany(),
    };

    fs.writeFileSync(outPath, JSON.stringify(data));
    const counts = {
      u: data.user.length,
      po: data.post.length,
      c: data.category.length,
      n: data.news.length,
      m: data.mediaFile.length,
      sp: data.supportPayment.length,
      pa: data.premiumPostAccess.length,
      ca: data.classifiedAd.length,
      cb: data.classifiedBroadcast.length,
    };

    console.log(`EXPORT_FILE=${outArg}`);
    console.log(`COUNTS=${JSON.stringify(counts)}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('EXPORT_ERR', err.message);
  process.exit(1);
});
