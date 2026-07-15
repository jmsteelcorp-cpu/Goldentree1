import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@golduae.xyz').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'change-me-now';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin account already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name: 'GoldUAE Admin',
      email,
      contactNo: '+971000000000',
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date()
    }
  });

  console.log(`Admin account created: ${email}`);
  console.log('Sign in at /admin/login with the ADMIN_EMAIL / ADMIN_PASSWORD from your .env');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
