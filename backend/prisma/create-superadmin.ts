import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SUPERADMIN_EMAIL || 'superadmin@gofit.com').trim().toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD || 'superadmin123';
  const firstName = (process.env.SUPERADMIN_FIRST_NAME || 'Super').trim();
  const lastName = (process.env.SUPERADMIN_LAST_NAME || 'Admin').trim();

  if (password.length < 6) {
    throw new Error('SUPERADMIN_PASSWORD debe tener al menos 6 caracteres');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      passwordHash,
      role: 'SUPERADMIN',
      gymId: null,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'SUPERADMIN',
      gymId: null,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
    },
  } as any);

  console.log('✅ Superadmin listo:', user.email, `(${user.role})`);
}

main()
  .catch((error) => {
    console.error('❌ Error creating superadmin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
