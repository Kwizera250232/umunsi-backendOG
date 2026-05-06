set -e
export PATH=/home/umunsi/.nvm/versions/node/v22.22.2/bin:$PATH
cd /home/umunsi/backend-api
node <<'NODE'
const fs = require('fs');
const path = '/home/umunsi/backend-api/src/controllers/authController.js';
let s = fs.readFileSync(path, 'utf8');

if (!s.includes('const authUserSelect = {')) {
  s = s.replace(
    "const generateVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));\n\nclass AuthController {\n",
    `const generateVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

const authUserSelect = {
  id: true,
  email: true,
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  avatar: true,
  createdAt: true,
  updatedAt: true
};

const profileUserSelect = {
  id: true,
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  avatar: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: { news: true }
  }
};

const mapSafeUserResponse = (user = {}) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  isPremium: user.isPremium ?? false,
  premiumSince: user.premiumSince ?? null,
  premiumUntil: user.premiumUntil ?? null,
  avatar: user.avatar ?? null,
  profileUrl: user.profileUrl ?? null,
  bio: user.bio ?? null,
  isActive: user.isActive,
  lastLogin: user.lastLogin ?? null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  _count: user._count
});

class AuthController {
`
  );
}

s = s.replace(
  /const user = await prisma\.user\.findUnique\(\{\s*where: \{ email: normalizedEmail \}\s*\}\);/m,
  `const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: authUserSelect
      });`
);

s = s.replace(
  /\/\/ Update last login[\s\S]*?\n\s*\}\);/m,
  `// Update last login, but do not block sign-in if that optional field
      // is unavailable on an older production schema.
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });
      } catch (lastLoginError) {
        console.warn('⚠️ Unable to update last login:', lastLoginError.message);
      }`
);

s = s.replace(
  /\/\/ Return user data \(excluding password\)[\s\S]*?const userData = \{[\s\S]*?\n\s*\};/m,
  `// Return user data (excluding password)
      const userData = mapSafeUserResponse(user);`
);

s = s.replace(
  /const user = await prisma\.user\.findUnique\(\{\s*where: \{ id: userId \},\s*select: \{[\s\S]*?_count: \{\s*select: \{ news: true \}\s*\}\s*\}\s*\}\);/m,
  `const user = await prisma.user.findUnique({
        where: { id: userId },
        select: profileUserSelect
      });`
);

s = s.replace(
  /res\.json\(\{\s*success: true,\s*user\s*\}\);/m,
  `res.json({
        success: true,
        user: mapSafeUserResponse(user)
      });`
);

fs.writeFileSync(path, s);
console.log('REMOTE_AUTH_PATCHED');
NODE
npx prisma generate
npx prisma db push --skip-generate
PM2_HOME=/home/umunsi/.pm2 pm2 restart umunsi-backend --update-env
PM2_HOME=/home/umunsi/.pm2 pm2 save
echo REMOTE_AUTH_RESTARTED
