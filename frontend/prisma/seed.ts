import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  console.log('🌱 Seeding database...');

  const superadminPassword = await bcrypt.hash('superadmin123', 12);
  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@gofit.com' },
    update: {},
    create: {
      email: 'superadmin@gofit.com',
      passwordHash: superadminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPERADMIN',
      gymId: null,
    },
  } as any);

  console.log('✅ Superadmin created:', superadmin.email);

  // Create default gym
  const gym = await prisma.gym.upsert({
    where: { slug: 'gofit-demo' },
    update: {},
    create: {
      name: 'GoFit Demo',
      slug: 'gofit-demo',
    },
  });

  console.log('✅ Gym created:', gym.name);

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gofit.com' },
    update: {},
    create: {
      email: 'admin@gofit.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'GoFit',
      role: 'ADMIN',
      gymId: gym.id,
    },
  });

  console.log('✅ Admin created:', admin.email);

  // Create professional user
  const proPassword = await bcrypt.hash('pro123', 12);
  const professional = await prisma.user.upsert({
    where: { email: 'entrenador@gofit.com' },
    update: {},
    create: {
      email: 'entrenador@gofit.com',
      passwordHash: proPassword,
      firstName: 'Carlos',
      lastName: 'Trainer',
      role: 'PROFESSIONAL',
      gymId: gym.id,
    },
  });

  // Create professional profile
  await prisma.professionalProfile.upsert({
    where: { userId: professional.id },
    update: {},
    create: {
      userId: professional.id,
      specialty: 'Musculación y Fuerza',
      bio: 'Entrenador certificado con 5 años de experiencia',
    },
  });

  console.log('✅ Professional created:', professional.email);

  // Create client user
  const clientPassword = await bcrypt.hash('cliente123', 12);
  const client = await prisma.user.upsert({
    where: { email: 'cliente@gofit.com' },
    update: {},
    create: {
      email: 'cliente@gofit.com',
      passwordHash: clientPassword,
      firstName: 'Juan',
      lastName: 'Cliente',
      role: 'CLIENT',
      gymId: gym.id,
    },
  });

  // Get professional profile for assignment
  const proProfile = await prisma.professionalProfile.findUnique({
    where: { userId: professional.id },
  });

  await (prisma as any).gym.update({
    where: { id: gym.id },
    data: { defaultClientAttributionUserId: admin.id },
  });

  // Create client profile
  await prisma.clientProfile.upsert({
    where: { userId: client.id },
    update: {},
    create: {
      userId: client.id,
      assignedProfessionalId: proProfile?.id,
      subscriptionStatus: 'ACTIVE',
    },
  });

  console.log('✅ Client created:', client.email);

  const freeUserPassword = await bcrypt.hash('libre123', 12);
  const freeUser = await prisma.user.upsert({
    where: { email: 'libre@gofit.com' },
    update: {},
    create: {
      email: 'libre@gofit.com',
      passwordHash: freeUserPassword,
      firstName: 'María',
      lastName: 'Libre',
      role: 'CLIENT',
      gymId: null,
    },
  } as any);

  await (prisma as any).clientProfile.upsert({
    where: { userId: freeUser.id },
    update: {},
    create: {
      userId: freeUser.id,
      subscriptionStatus: 'EXPIRED',
    },
  });

  const pendingUserPassword = await bcrypt.hash('nuevo123', 12);
  const pendingUser = await prisma.user.upsert({
    where: { email: 'nuevo@gofit.com' },
    update: {},
    create: {
      email: 'nuevo@gofit.com',
      passwordHash: pendingUserPassword,
      firstName: 'Carlos',
      lastName: 'Nuevo',
      role: 'CLIENT',
      gymId: null,
    },
  } as any);

  await (prisma as any).clientProfile.upsert({
    where: { userId: pendingUser.id },
    update: {},
    create: {
      userId: pendingUser.id,
      subscriptionStatus: 'EXPIRED',
    },
  });

  const adminCreatedClientPassword = await bcrypt.hash('manual123', 12);
  const adminCreatedClient = await prisma.user.upsert({
    where: { email: 'manual@gofit.com' },
    update: {},
    create: {
      email: 'manual@gofit.com',
      passwordHash: adminCreatedClientPassword,
      firstName: 'Lucía',
      lastName: 'Manual',
      documentNumber: '30111222',
      role: 'CLIENT',
      gymId: gym.id,
    },
  } as any);

  await (prisma as any).clientProfile.upsert({
    where: { userId: adminCreatedClient.id },
    update: {
      createdByUserId: admin.id,
      createdByGymId: gym.id,
      assignedProfessionalId: proProfile?.id,
      subscriptionStatus: 'ACTIVE',
    },
    create: {
      userId: adminCreatedClient.id,
      createdByUserId: admin.id,
      createdByGymId: gym.id,
      assignedProfessionalId: proProfile?.id,
      subscriptionStatus: 'ACTIVE',
    },
  });

  const professionalCreatedClientPassword = await bcrypt.hash('manualpro123', 12);
  const professionalCreatedClient = await prisma.user.upsert({
    where: { email: 'alumno.pro@gofit.com' },
    update: {},
    create: {
      email: 'alumno.pro@gofit.com',
      passwordHash: professionalCreatedClientPassword,
      firstName: 'Mateo',
      lastName: 'Asignado',
      documentNumber: '33444555',
      role: 'CLIENT',
      gymId: gym.id,
    },
  } as any);

  await (prisma as any).clientProfile.upsert({
    where: { userId: professionalCreatedClient.id },
    update: {
      createdByUserId: professional.id,
      createdByGymId: gym.id,
      assignedProfessionalId: proProfile?.id,
      subscriptionStatus: 'ACTIVE',
    },
    create: {
      userId: professionalCreatedClient.id,
      createdByUserId: professional.id,
      createdByGymId: gym.id,
      assignedProfessionalId: proProfile?.id,
      subscriptionStatus: 'ACTIVE',
    },
  });

  // Create some sports
  const sports = [
    'Fútbol', 'Pádel', 'Básquet', 'Boxeo', 'Rugby', 
    'Tenis', 'Vóley', 'Remo', 'Hockey', 'Handball',
    'Cross Training', 'Atletismo', 'Natación', 
    'Artes Marciales', 'Ciclismo', 'Triatlón'
  ];

  for (const sportName of sports) {
    await prisma.sport.upsert({
      where: { gymId_name: { gymId: gym.id, name: sportName } },
      update: {},
      create: {
        name: sportName,
        gymId: gym.id,
      },
    });
  }

  console.log('✅ Sports created:', sports.length);

  // Create a plan
  const planMensual = await prisma.plan.upsert({
    where: { id: 'plan-mensual' },
    update: {},
    create: {
      id: 'plan-mensual',
      name: 'Plan Mensual',
      description: 'Acceso completo al gimnasio por 30 días',
      price: 15000,
      durationDays: 30,
      gymId: gym.id,
    },
  });

  console.log('✅ Plan created');

  await (prisma as any).subscriptionPriceOption.upsert({
    where: { id: 'gofit-standard' },
    update: {
      name: 'Mensual estándar',
      description: 'Precio base publicado para el gym demo.',
      monthlyPrice: 15000,
      isActive: true,
      isPublic: true,
      isDefault: true,
      gymId: gym.id,
      planId: planMensual.id,
    },
    create: {
      id: 'gofit-standard',
      name: 'Mensual estándar',
      description: 'Precio base publicado para el gym demo.',
      monthlyPrice: 15000,
      isActive: true,
      isPublic: true,
      isDefault: true,
      gymId: gym.id,
      planId: planMensual.id,
    },
  });

  await (prisma as any).subscriptionPriceOption.upsert({
    where: { id: 'gofit-student' },
    update: {
      name: 'Promo estudiante',
      description: 'Precio promocional para altas manuales de prueba.',
      monthlyPrice: 12900,
      isActive: true,
      isPublic: true,
      isDefault: false,
      gymId: gym.id,
      planId: planMensual.id,
    },
    create: {
      id: 'gofit-student',
      name: 'Promo estudiante',
      description: 'Precio promocional para altas manuales de prueba.',
      monthlyPrice: 12900,
      isActive: true,
      isPublic: true,
      isDefault: false,
      gymId: gym.id,
      planId: planMensual.id,
    },
  });

  const subscriptions = [
    {
      userId: client.id,
      gymId: gym.id,
      planId: planMensual.id,
      priceOptionId: 'gofit-standard',
      status: 'ACTIVE' as const,
      type: 'MONTHLY' as const,
      source: 'PLATFORM_PURCHASE' as const,
      monthsCount: 1,
      monthlyPriceSnapshot: 15000,
      totalPriceSnapshot: 15000,
      priceOptionNameSnapshot: 'Mensual estándar',
      startDate: new Date(),
      endDate: addDays(30),
      autoRenew: true,
      attributedToUserId: admin.id,
      assignedProfessionalId: proProfile?.id,
    },
    {
      userId: adminCreatedClient.id,
      gymId: gym.id,
      planId: planMensual.id,
      priceOptionId: 'gofit-student',
      status: 'ACTIVE' as const,
      type: 'MONTHLY' as const,
      source: 'ADMIN_GRANTED' as const,
      monthsCount: 2,
      monthlyPriceSnapshot: 12900,
      totalPriceSnapshot: 25800,
      priceOptionNameSnapshot: 'Promo estudiante',
      startDate: new Date(),
      endDate: addDays(60),
      autoRenew: false,
      createdByUserId: admin.id,
      attributedToUserId: admin.id,
      assignedProfessionalId: proProfile?.id,
    },
    {
      userId: professionalCreatedClient.id,
      gymId: gym.id,
      planId: planMensual.id,
      priceOptionId: 'gofit-student',
      status: 'ACTIVE' as const,
      type: 'MONTHLY' as const,
      source: 'ADMIN_GRANTED' as const,
      monthsCount: 1,
      monthlyPriceSnapshot: 12900,
      totalPriceSnapshot: 12900,
      priceOptionNameSnapshot: 'Promo estudiante',
      startDate: new Date(),
      endDate: addDays(30),
      autoRenew: false,
      createdByUserId: professional.id,
      attributedToUserId: professional.id,
      assignedProfessionalId: proProfile?.id,
    },
  ];

  for (const subscription of subscriptions) {
    await (prisma as any).subscription.upsert({
      where: { userId_gymId: { userId: subscription.userId, gymId: subscription.gymId } },
      update: subscription,
      create: subscription,
    });
  }

  // Create expense categories
  const categories = ['Alquiler', 'Servicios', 'Equipamiento', 'Sueldos', 'Marketing', 'Otros'];
  
  for (const catName of categories) {
    await prisma.expenseCategory.upsert({
      where: { gymId_name: { gymId: gym.id, name: catName } },
      update: {},
      create: {
        name: catName,
        gymId: gym.id,
      },
    });
  }

  console.log('✅ Expense categories created');

  console.log('');
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('📧 Usuarios de prueba:');
  console.log('   Superadmin: superadmin@gofit.com / superadmin123');
  console.log('   Admin: admin@gofit.com / admin123');
  console.log('   Profesional: entrenador@gofit.com / pro123');
  console.log('   Cliente: cliente@gofit.com / cliente123');
  console.log('   Cliente manual admin: manual@gofit.com / manual123');
  console.log('   Cliente manual profesional: alumno.pro@gofit.com / manualpro123');
  console.log('   Usuario libre: libre@gofit.com / libre123');
  console.log('   Usuario nuevo: nuevo@gofit.com / nuevo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
