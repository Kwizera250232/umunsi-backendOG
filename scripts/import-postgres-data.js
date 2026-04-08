const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

function chunk(arr, size = 500) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

async function insertMany(prisma, model, rows) {
  if (!rows || rows.length === 0) return;
  for (const part of chunk(rows)) {
    await prisma[model].createMany({ data: part, skipDuplicates: true });
  }
}

async function main() {
  const inArg = process.argv[2];
  if (!inArg) {
    throw new Error('Usage: node scripts/import-postgres-data.js <input-json-path>');
  }

  const inPath = path.resolve(process.cwd(), inArg);
  const data = JSON.parse(fs.readFileSync(inPath, 'utf8'));

  const prisma = new PrismaClient();
  try {
    await insertMany(prisma, 'user', data.user);
    await insertMany(prisma, 'category', data.category);
    await insertMany(prisma, 'news', data.news);
    await insertMany(prisma, 'mediaFile', data.mediaFile);
    await insertMany(prisma, 'post', data.post);
    await insertMany(prisma, 'supportPayment', data.supportPayment);
    await insertMany(prisma, 'premiumPostAccess', data.premiumPostAccess);
    await insertMany(prisma, 'classifiedAd', data.classifiedAd);
    await insertMany(prisma, 'classifiedBroadcast', data.classifiedBroadcast);

    const counts = {
      u: await prisma.user.count(),
      po: await prisma.post.count(),
      c: await prisma.category.count(),
      n: await prisma.news.count(),
      m: await prisma.mediaFile.count(),
      sp: await prisma.supportPayment.count(),
      pa: await prisma.premiumPostAccess.count(),
      ca: await prisma.classifiedAd.count(),
      cb: await prisma.classifiedBroadcast.count(),
    };

    console.log(`POSTGRES_COUNTS=${JSON.stringify(counts)}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('IMPORT_ERR', err.message);
  process.exit(1);
});
