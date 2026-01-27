import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

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
  await prisma.plan.upsert({
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
  console.log('   Admin: admin@gofit.com / admin123');
  console.log('   Profesional: entrenador@gofit.com / pro123');
  console.log('   Cliente: cliente@gofit.com / cliente123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
