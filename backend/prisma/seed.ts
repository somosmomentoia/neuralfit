import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ==================== EJERCICIOS GLOBALES ====================
  console.log('📦 Creating global exercises...');
  
  // Video de YouTube mock para demostración (video de ejercicios genérico)
  const MOCK_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  
  const globalExercises = [
    // PECHO (6 ejercicios)
    { name: 'Press de banca con barra', muscleGroup: 'Pecho', category: 'MUSCULACION' as const, difficulty: 3, description: 'Ejercicio compuesto para pecho, hombros y tríceps. Acostado en banco plano, bajar la barra al pecho y empujar hacia arriba.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Press de banca inclinado', muscleGroup: 'Pecho', category: 'MUSCULACION' as const, difficulty: 3, description: 'Variante del press de banca con banco inclinado a 30-45°. Enfatiza la parte superior del pecho.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Press de banca declinado', muscleGroup: 'Pecho', category: 'MUSCULACION' as const, difficulty: 3, description: 'Variante del press de banca con banco declinado. Enfatiza la parte inferior del pecho.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Aperturas con mancuernas', muscleGroup: 'Pecho', category: 'MUSCULACION' as const, difficulty: 2, description: 'Ejercicio de aislamiento para pecho. Acostado en banco, abrir los brazos en arco y juntar las mancuernas arriba.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Fondos en paralelas', muscleGroup: 'Pecho', category: 'MUSCULACION' as const, difficulty: 4, description: 'Ejercicio con peso corporal. Inclinarse hacia adelante para enfatizar pecho, bajar hasta 90° y empujar.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Pullover con mancuerna', muscleGroup: 'Pecho', category: 'MUSCULACION' as const, difficulty: 2, description: 'Acostado perpendicular al banco, bajar la mancuerna detrás de la cabeza y subir en arco.', videoUrl: MOCK_VIDEO_URL },
    
    // ESPALDA (6 ejercicios)
    { name: 'Dominadas', muscleGroup: 'Espalda', category: 'MUSCULACION' as const, difficulty: 4, description: 'Ejercicio con peso corporal. Colgarse de la barra y subir hasta que la barbilla pase la barra.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Remo con barra', muscleGroup: 'Espalda', category: 'MUSCULACION' as const, difficulty: 3, description: 'Inclinado hacia adelante, tirar la barra hacia el abdomen manteniendo la espalda recta.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Remo con mancuerna', muscleGroup: 'Espalda', category: 'MUSCULACION' as const, difficulty: 2, description: 'Apoyado en banco con una mano, tirar la mancuerna hacia la cadera con el otro brazo.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Jalón al pecho', muscleGroup: 'Espalda', category: 'MUSCULACION' as const, difficulty: 2, description: 'En máquina de polea alta, tirar la barra hacia el pecho con agarre amplio.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Remo en polea baja', muscleGroup: 'Espalda', category: 'MUSCULACION' as const, difficulty: 2, description: 'Sentado frente a la polea baja, tirar el agarre hacia el abdomen.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Peso muerto', muscleGroup: 'Espalda', category: 'MUSCULACION' as const, difficulty: 5, description: 'Ejercicio compuesto fundamental. Levantar la barra del suelo manteniendo la espalda recta.', videoUrl: MOCK_VIDEO_URL },
    
    // HOMBROS (5 ejercicios)
    { name: 'Press militar con barra', muscleGroup: 'Hombros', category: 'MUSCULACION' as const, difficulty: 3, description: 'De pie o sentado, empujar la barra desde los hombros hacia arriba.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Press Arnold', muscleGroup: 'Hombros', category: 'MUSCULACION' as const, difficulty: 3, description: 'Variante del press con mancuernas con rotación. Trabaja los tres deltoides.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Elevaciones laterales', muscleGroup: 'Hombros', category: 'MUSCULACION' as const, difficulty: 2, description: 'De pie, elevar las mancuernas hacia los lados hasta la altura de los hombros.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Elevaciones frontales', muscleGroup: 'Hombros', category: 'MUSCULACION' as const, difficulty: 2, description: 'De pie, elevar las mancuernas hacia el frente hasta la altura de los hombros.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Pájaros (rear delt fly)', muscleGroup: 'Hombros', category: 'MUSCULACION' as const, difficulty: 2, description: 'Inclinado hacia adelante, elevar las mancuernas hacia los lados. Trabaja deltoides posterior.', videoUrl: MOCK_VIDEO_URL },
    
    // BÍCEPS (4 ejercicios)
    { name: 'Curl con barra', muscleGroup: 'Bíceps', category: 'MUSCULACION' as const, difficulty: 2, description: 'De pie, flexionar los codos para subir la barra hacia los hombros.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Curl con mancuernas', muscleGroup: 'Bíceps', category: 'MUSCULACION' as const, difficulty: 2, description: 'De pie o sentado, flexionar los codos alternando o simultáneamente.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Curl martillo', muscleGroup: 'Bíceps', category: 'MUSCULACION' as const, difficulty: 2, description: 'Curl con agarre neutro (palmas enfrentadas). Trabaja bíceps y braquial.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Curl concentrado', muscleGroup: 'Bíceps', category: 'MUSCULACION' as const, difficulty: 2, description: 'Sentado, apoyar el codo en el muslo y hacer curl con una mancuerna.', videoUrl: MOCK_VIDEO_URL },
    
    // TRÍCEPS (4 ejercicios)
    { name: 'Press francés', muscleGroup: 'Tríceps', category: 'MUSCULACION' as const, difficulty: 3, description: 'Acostado, bajar la barra hacia la frente y extender los codos.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Extensiones en polea', muscleGroup: 'Tríceps', category: 'MUSCULACION' as const, difficulty: 2, description: 'En polea alta, extender los codos empujando hacia abajo.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Fondos en banco', muscleGroup: 'Tríceps', category: 'MUSCULACION' as const, difficulty: 2, description: 'Manos en banco detrás, bajar el cuerpo flexionando codos y subir.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Patada de tríceps', muscleGroup: 'Tríceps', category: 'MUSCULACION' as const, difficulty: 2, description: 'Inclinado, extender el codo hacia atrás manteniendo el brazo fijo.', videoUrl: MOCK_VIDEO_URL },
    
    // PIERNAS (7 ejercicios)
    { name: 'Sentadilla con barra', muscleGroup: 'Piernas', category: 'MUSCULACION' as const, difficulty: 4, description: 'Ejercicio compuesto fundamental. Barra en espalda, bajar hasta 90° y subir.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Prensa de piernas', muscleGroup: 'Piernas', category: 'MUSCULACION' as const, difficulty: 2, description: 'En máquina, empujar la plataforma con los pies.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Extensiones de cuádriceps', muscleGroup: 'Piernas', category: 'MUSCULACION' as const, difficulty: 1, description: 'En máquina, extender las rodillas para trabajar cuádriceps.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Curl de isquiotibiales', muscleGroup: 'Piernas', category: 'MUSCULACION' as const, difficulty: 1, description: 'En máquina, flexionar las rodillas para trabajar isquiotibiales.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Peso muerto rumano', muscleGroup: 'Piernas', category: 'MUSCULACION' as const, difficulty: 3, description: 'Con piernas casi rectas, bajar la barra manteniendo espalda recta. Trabaja isquiotibiales y glúteos.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Zancadas', muscleGroup: 'Piernas', category: 'MUSCULACION' as const, difficulty: 3, description: 'Dar un paso adelante y bajar hasta que ambas rodillas estén a 90°.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Elevación de gemelos', muscleGroup: 'Piernas', category: 'MUSCULACION' as const, difficulty: 1, description: 'De pie, elevar los talones para trabajar los gemelos.', videoUrl: MOCK_VIDEO_URL },
    
    // CORE/ABDOMINALES (4 ejercicios)
    { name: 'Crunch abdominal', muscleGroup: 'Abdominales', category: 'MUSCULACION' as const, difficulty: 1, description: 'Acostado, elevar los hombros del suelo contrayendo los abdominales.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Plancha', muscleGroup: 'Abdominales', category: 'MUSCULACION' as const, difficulty: 2, description: 'Mantener el cuerpo recto apoyado en antebrazos y puntas de pies.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Russian twist', muscleGroup: 'Abdominales', category: 'MUSCULACION' as const, difficulty: 2, description: 'Sentado con torso inclinado, rotar el tronco de lado a lado.', videoUrl: MOCK_VIDEO_URL },
    { name: 'Elevación de piernas', muscleGroup: 'Abdominales', category: 'MUSCULACION' as const, difficulty: 3, description: 'Colgado o acostado, elevar las piernas rectas hasta 90°.', videoUrl: MOCK_VIDEO_URL },
  ];

  for (const exercise of globalExercises) {
    await prisma.exercise.upsert({
      where: { id: `global-${exercise.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `global-${exercise.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        category: exercise.category,
        difficulty: exercise.difficulty,
        description: exercise.description,
        videoUrl: exercise.videoUrl,
        isGlobal: true,
        status: 'APPROVED',
      },
    });
  }

  console.log('✅ Global exercises created:', globalExercises.length);

  // ==================== GYM DE DEMO ====================
  // Create default gym
  const gym = await prisma.gym.upsert({
    where: { slug: 'gofit-demo' },
    update: {},
    create: {
      name: 'GoFit Gimnasio',
      slug: 'gofit-demo',
      description: 'El mejor gimnasio de la ciudad con equipamiento de última generación.',
      isPublic: true,
    },
  });

  console.log('✅ Gym created:', gym.name);

  // ==================== SEGUNDO GYM (IRON FITNESS) ====================
  const gym2 = await prisma.gym.upsert({
    where: { slug: 'iron-fitness' },
    update: {},
    create: {
      name: 'Iron Fitness',
      slug: 'iron-fitness',
      description: 'Gimnasio especializado en entrenamiento de fuerza y crossfit.',
      isPublic: true,
    },
  });

  console.log('✅ Gym 2 created:', gym2.name);

  // Create admin for Iron Fitness
  const admin2Password = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@ironfitness.com' },
    update: {},
    create: {
      email: 'admin@ironfitness.com',
      passwordHash: admin2Password,
      firstName: 'Admin',
      lastName: 'Iron',
      role: 'ADMIN',
      gymId: gym2.id,
    },
  });

  // Create plans for Iron Fitness
  await prisma.plan.upsert({
    where: { id: 'iron-mensual' },
    update: {},
    create: {
      id: 'iron-mensual',
      name: 'Plan Básico',
      description: 'Acceso a sala de musculación',
      price: 12000,
      durationDays: 30,
      gymId: gym2.id,
    },
  });

  await prisma.plan.upsert({
    where: { id: 'iron-premium' },
    update: {},
    create: {
      id: 'iron-premium',
      name: 'Plan Premium',
      description: 'Acceso completo + clases de crossfit',
      price: 25000,
      durationDays: 30,
      gymId: gym2.id,
    },
  });

  console.log('✅ Iron Fitness plans created');

  // ==================== TERCER GYM (POWER GYM) ====================
  const gym3 = await prisma.gym.upsert({
    where: { slug: 'power-gym' },
    update: {},
    create: {
      name: 'Power Gym',
      slug: 'power-gym',
      description: 'Tu gimnasio de barrio con la mejor onda.',
      isPublic: true,
    },
  });

  console.log('✅ Gym 3 created:', gym3.name);

  // Create admin for Power Gym
  const admin3Password = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@powergym.com' },
    update: {},
    create: {
      email: 'admin@powergym.com',
      passwordHash: admin3Password,
      firstName: 'Admin',
      lastName: 'Power',
      role: 'ADMIN',
      gymId: gym3.id,
    },
  });

  // Create plans for Power Gym
  await prisma.plan.upsert({
    where: { id: 'power-libre' },
    update: {},
    create: {
      id: 'power-libre',
      name: 'Pase Libre',
      description: 'Acceso ilimitado al gimnasio',
      price: 10000,
      durationDays: 30,
      gymId: gym3.id,
    },
  });

  await prisma.plan.upsert({
    where: { id: 'power-duo' },
    update: {},
    create: {
      id: 'power-duo',
      name: 'Plan Duo',
      description: 'Para vos y un acompañante',
      price: 18000,
      durationDays: 30,
      gymId: gym3.id,
    },
  });

  console.log('✅ Power Gym plans created');

  // ==================== CUARTO GYM (FLEX FITNESS) ====================
  const gym4 = await prisma.gym.upsert({
    where: { slug: 'flex-fitness' },
    update: {},
    create: {
      name: 'Flex Fitness',
      slug: 'flex-fitness',
      description: 'Gimnasio boutique con clases personalizadas y ambiente exclusivo.',
      isPublic: true,
      logo: 'https://ui-avatars.com/api/?name=FF&background=8B5CF6&color=fff&size=200',
    },
  });

  console.log('✅ Gym 4 created:', gym4.name);

  // Create admin for Flex Fitness
  await prisma.user.upsert({
    where: { email: 'admin@flexfitness.com' },
    update: {},
    create: {
      email: 'admin@flexfitness.com',
      passwordHash: await bcrypt.hash('admin123', 12),
      firstName: 'Admin',
      lastName: 'Flex',
      role: 'ADMIN',
      gymId: gym4.id,
    },
  });

  // Create plans for Flex Fitness
  await prisma.plan.upsert({
    where: { id: 'flex-basico' },
    update: {},
    create: {
      id: 'flex-basico',
      name: 'Plan Básico',
      description: 'Acceso a sala de musculación',
      price: 15000,
      durationDays: 30,
      gymId: gym4.id,
    },
  });

  await prisma.plan.upsert({
    where: { id: 'flex-full' },
    update: {},
    create: {
      id: 'flex-full',
      name: 'Plan Full',
      description: 'Musculación + todas las clases grupales',
      price: 22000,
      durationDays: 30,
      gymId: gym4.id,
    },
  });

  await prisma.plan.upsert({
    where: { id: 'flex-vip' },
    update: {},
    create: {
      id: 'flex-vip',
      name: 'Plan VIP',
      description: 'Todo incluido + entrenador personal',
      price: 45000,
      durationDays: 30,
      gymId: gym4.id,
    },
  });

  // Create branch for Flex Fitness
  await prisma.branch.upsert({
    where: { id: 'flex-palermo' },
    update: {},
    create: {
      id: 'flex-palermo',
      name: 'Flex Palermo',
      address: 'Av. Santa Fe 3200, Palermo',
      phone: '+54 11 5555-1234',
      gymId: gym4.id,
      openTime: '06:00',
      closeTime: '23:00',
      is24Hours: false,
    },
  });

  console.log('✅ Flex Fitness plans and branch created');

  // ==================== QUINTO GYM (MEGA GYM) ====================
  const gym5 = await prisma.gym.upsert({
    where: { slug: 'mega-gym' },
    update: {},
    create: {
      name: 'Mega Gym',
      slug: 'mega-gym',
      description: 'La cadena de gimnasios más grande del país con múltiples sedes.',
      isPublic: true,
      logo: 'https://ui-avatars.com/api/?name=MG&background=EF4444&color=fff&size=200',
    },
  });

  console.log('✅ Gym 5 created:', gym5.name);

  // Create admin for Mega Gym
  await prisma.user.upsert({
    where: { email: 'admin@megagym.com' },
    update: {},
    create: {
      email: 'admin@megagym.com',
      passwordHash: await bcrypt.hash('admin123', 12),
      firstName: 'Admin',
      lastName: 'Mega',
      role: 'ADMIN',
      gymId: gym5.id,
    },
  });

  // Create plans for Mega Gym
  await prisma.plan.upsert({
    where: { id: 'mega-standard' },
    update: {},
    create: {
      id: 'mega-standard',
      name: 'Standard',
      description: 'Acceso a una sede',
      price: 8000,
      durationDays: 30,
      gymId: gym5.id,
    },
  });

  await prisma.plan.upsert({
    where: { id: 'mega-multi' },
    update: {},
    create: {
      id: 'mega-multi',
      name: 'Multi Sede',
      description: 'Acceso a todas las sedes',
      price: 14000,
      durationDays: 30,
      gymId: gym5.id,
    },
  });

  // Create branches for Mega Gym
  await prisma.branch.upsert({
    where: { id: 'mega-centro' },
    update: {},
    create: {
      id: 'mega-centro',
      name: 'Mega Centro',
      address: 'Av. Corrientes 1500, Centro',
      phone: '+54 11 4444-0001',
      gymId: gym5.id,
      is24Hours: true,
    },
  });

  await prisma.branch.upsert({
    where: { id: 'mega-belgrano' },
    update: {},
    create: {
      id: 'mega-belgrano',
      name: 'Mega Belgrano',
      address: 'Av. Cabildo 2000, Belgrano',
      phone: '+54 11 4444-0002',
      gymId: gym5.id,
      openTime: '06:00',
      closeTime: '00:00',
    },
  });

  await prisma.branch.upsert({
    where: { id: 'mega-caballito' },
    update: {},
    create: {
      id: 'mega-caballito',
      name: 'Mega Caballito',
      address: 'Av. Rivadavia 5500, Caballito',
      phone: '+54 11 4444-0003',
      gymId: gym5.id,
      openTime: '07:00',
      closeTime: '23:00',
    },
  });

  console.log('✅ Mega Gym plans and branches created');

  // ==================== SEXTO GYM (CROSSFIT BOX) ====================
  const gym6 = await prisma.gym.upsert({
    where: { slug: 'crossfit-box' },
    update: {},
    create: {
      name: 'CrossFit Box',
      slug: 'crossfit-box',
      description: 'Box de CrossFit afiliado con coaches certificados.',
      isPublic: true,
      logo: 'https://ui-avatars.com/api/?name=CF&background=F59E0B&color=fff&size=200',
    },
  });

  console.log('✅ Gym 6 created:', gym6.name);

  // Create admin for CrossFit Box
  await prisma.user.upsert({
    where: { email: 'admin@crossfitbox.com' },
    update: {},
    create: {
      email: 'admin@crossfitbox.com',
      passwordHash: await bcrypt.hash('admin123', 12),
      firstName: 'Admin',
      lastName: 'CrossFit',
      role: 'ADMIN',
      gymId: gym6.id,
    },
  });

  // Create plans for CrossFit Box
  await prisma.plan.upsert({
    where: { id: 'cf-3x' },
    update: {},
    create: {
      id: 'cf-3x',
      name: '3 veces por semana',
      description: '12 clases mensuales',
      price: 20000,
      durationDays: 30,
      gymId: gym6.id,
    },
  });

  await prisma.plan.upsert({
    where: { id: 'cf-unlimited' },
    update: {},
    create: {
      id: 'cf-unlimited',
      name: 'Ilimitado',
      description: 'Clases ilimitadas + Open Gym',
      price: 32000,
      durationDays: 30,
      gymId: gym6.id,
    },
  });

  // Create branch for CrossFit Box
  await prisma.branch.upsert({
    where: { id: 'cf-nunez' },
    update: {},
    create: {
      id: 'cf-nunez',
      name: 'CrossFit Box Núñez',
      address: 'Av. del Libertador 7500, Núñez',
      phone: '+54 11 6666-1234',
      gymId: gym6.id,
      openTime: '06:30',
      closeTime: '21:00',
    },
  });

  console.log('✅ CrossFit Box plans and branch created');

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

  // NOTE: Subscription will be created after plans are created (see below)

  // ==================== USUARIO SIN SUSCRIPCIÓN ====================
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
      gymId: null, // Sin gym asignado
    },
  });

  // Create client profile for free user (sin suscripción)
  await prisma.clientProfile.upsert({
    where: { userId: freeUser.id },
    update: {},
    create: {
      userId: freeUser.id,
      subscriptionStatus: 'EXPIRED',
    },
  });

  console.log('✅ Free user created:', freeUser.email);

  // ==================== SEGUNDO USUARIO LIBRE (para probar flujo de compra) ====================
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
      gymId: null, // Sin gym - puede explorar y comprar suscripción
    },
  });

  // Create client profile for new user (sin suscripción)
  await prisma.clientProfile.upsert({
    where: { userId: pendingUser.id },
    update: {},
    create: {
      userId: pendingUser.id,
      subscriptionStatus: 'EXPIRED',
    },
  });

  console.log('✅ New user created:', pendingUser.email);

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

  // Create plan features (beneficios típicos de gimnasios)
  const planFeatures = [
    { name: 'Acceso a musculación', icon: 'dumbbell', description: 'Uso de sala de pesas y máquinas' },
    { name: 'Clases grupales', icon: 'users', description: 'Spinning, yoga, funcional, etc.' },
    { name: 'Acceso a pileta', icon: 'waves', description: 'Natación libre y aquagym' },
    { name: 'Spa y sauna', icon: 'sparkles', description: 'Área de relajación' },
    { name: 'Estacionamiento', icon: 'car', description: 'Estacionamiento gratuito' },
    { name: 'Toallas', icon: 'shirt', description: 'Servicio de toallas incluido' },
    { name: 'Casilleros', icon: 'lock', description: 'Casillero personal' },
    { name: 'Nutricionista', icon: 'apple', description: 'Consulta con nutricionista' },
    { name: 'Entrenador personal', icon: 'user-check', description: 'Sesiones con entrenador' },
    { name: 'Acceso 24hs', icon: 'clock', description: 'Acceso las 24 horas' },
    { name: 'Todas las sedes', icon: 'building', description: 'Acceso a todas las sucursales' },
    { name: 'Invitados', icon: 'user-plus', description: 'Pases para invitados' },
  ];

  const createdFeatures: { id: string; name: string }[] = [];
  for (const feature of planFeatures) {
    const created = await prisma.planFeature.upsert({
      where: { gymId_name: { gymId: gym.id, name: feature.name } },
      update: {},
      create: {
        name: feature.name,
        icon: feature.icon,
        description: feature.description,
        gymId: gym.id,
      },
    });
    createdFeatures.push({ id: created.id, name: created.name });
  }

  console.log('✅ Plan features created:', planFeatures.length);

  // Create plans with features
  const planMensual = await prisma.plan.upsert({
    where: { id: 'plan-mensual' },
    update: {},
    create: {
      id: 'plan-mensual',
      name: 'Plan Mensual',
      description: 'Acceso básico al gimnasio',
      price: 15000,
      durationDays: 30,
      gymId: gym.id,
    },
  });

  const planTrimestral = await prisma.plan.upsert({
    where: { id: 'plan-trimestral' },
    update: {},
    create: {
      id: 'plan-trimestral',
      name: 'Plan Trimestral',
      description: 'Acceso completo con beneficios extra',
      price: 40000,
      durationDays: 90,
      gymId: gym.id,
    },
  });

  const planAnual = await prisma.plan.upsert({
    where: { id: 'plan-anual' },
    update: {},
    create: {
      id: 'plan-anual',
      name: 'Plan Anual',
      description: 'Acceso premium con todos los beneficios',
      price: 120000,
      durationDays: 365,
      gymId: gym.id,
    },
  });

  // Assign features to plans
  const basicFeatures = ['Acceso a musculación', 'Casilleros'];
  const trimestralFeatures = ['Acceso a musculación', 'Clases grupales', 'Casilleros', 'Toallas'];
  const anualFeatures = ['Acceso a musculación', 'Clases grupales', 'Acceso a pileta', 'Spa y sauna', 'Casilleros', 'Toallas', 'Todas las sedes', 'Acceso 24hs'];

  for (const featureName of basicFeatures) {
    const feature = createdFeatures.find(f => f.name === featureName);
    if (feature) {
      await prisma.planFeatureAssignment.upsert({
        where: { planId_featureId: { planId: planMensual.id, featureId: feature.id } },
        update: {},
        create: { planId: planMensual.id, featureId: feature.id },
      });
    }
  }

  for (const featureName of trimestralFeatures) {
    const feature = createdFeatures.find(f => f.name === featureName);
    if (feature) {
      await prisma.planFeatureAssignment.upsert({
        where: { planId_featureId: { planId: planTrimestral.id, featureId: feature.id } },
        update: {},
        create: { planId: planTrimestral.id, featureId: feature.id },
      });
    }
  }

  for (const featureName of anualFeatures) {
    const feature = createdFeatures.find(f => f.name === featureName);
    if (feature) {
      await prisma.planFeatureAssignment.upsert({
        where: { planId_featureId: { planId: planAnual.id, featureId: feature.id } },
        update: {},
        create: { planId: planAnual.id, featureId: feature.id },
      });
    }
  }

  console.log('✅ Plans created with features');

  // ==================== CREATE SUBSCRIPTION FOR CLIENT ====================
  // Now that plans exist, we can create the subscription
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // 30 days from now
  
  await prisma.subscription.upsert({
    where: { userId_gymId: { userId: client.id, gymId: gym.id } },
    update: {},
    create: {
      userId: client.id,
      gymId: gym.id,
      planId: planMensual.id,
      status: 'ACTIVE',
      type: 'MONTHLY',
      startDate: new Date(),
      endDate: endDate,
      autoRenew: true,
      mpSubscriptionId: 'mp_sub_demo_001',
      mpPayerId: 'mp_payer_demo_001',
    },
  });

  console.log('✅ Subscription created for client (GoFit)');

  // Crear suscripciones adicionales para cliente@gofit.com en otros gyms
  // Esto simula un usuario con múltiples membresías
  const endDate2 = new Date();
  endDate2.setDate(endDate2.getDate() + 25);
  
  await prisma.subscription.upsert({
    where: { userId_gymId: { userId: client.id, gymId: gym2.id } },
    update: {},
    create: {
      userId: client.id,
      gymId: gym2.id,
      planId: 'iron-premium',
      status: 'ACTIVE',
      type: 'MONTHLY',
      startDate: new Date(),
      endDate: endDate2,
      autoRenew: true,
      mpSubscriptionId: 'mp_sub_demo_002',
      mpPayerId: 'mp_payer_demo_001',
    },
  });

  console.log('✅ Subscription created for client (Iron Fitness)');

  // Suscripción a Power Gym (gym3)
  const endDatePower = new Date();
  endDatePower.setDate(endDatePower.getDate() + 18);
  
  await prisma.subscription.upsert({
    where: { userId_gymId: { userId: client.id, gymId: gym3.id } },
    update: {},
    create: {
      userId: client.id,
      gymId: gym3.id,
      planId: 'power-full',
      status: 'ACTIVE',
      type: 'MONTHLY',
      startDate: new Date(),
      endDate: endDatePower,
      autoRenew: true,
      mpSubscriptionId: 'mp_sub_demo_006',
      mpPayerId: 'mp_payer_demo_001',
    },
  });

  console.log('✅ Subscription created for client (Power Gym)');

  const endDate3 = new Date();
  endDate3.setDate(endDate3.getDate() + 15);
  
  await prisma.subscription.upsert({
    where: { userId_gymId: { userId: client.id, gymId: gym4.id } },
    update: {},
    create: {
      userId: client.id,
      gymId: gym4.id,
      planId: 'flex-full',
      status: 'ACTIVE',
      type: 'MONTHLY',
      startDate: new Date(),
      endDate: endDate3,
      autoRenew: true,
      mpSubscriptionId: 'mp_sub_demo_003',
      mpPayerId: 'mp_payer_demo_001',
    },
  });

  console.log('✅ Subscription created for client (Flex Fitness)');

  const endDate4 = new Date();
  endDate4.setDate(endDate4.getDate() + 20);
  
  await prisma.subscription.upsert({
    where: { userId_gymId: { userId: client.id, gymId: gym5.id } },
    update: {},
    create: {
      userId: client.id,
      gymId: gym5.id,
      planId: 'mega-multi',
      status: 'ACTIVE',
      type: 'MONTHLY',
      startDate: new Date(),
      endDate: endDate4,
      autoRenew: true,
      mpSubscriptionId: 'mp_sub_demo_004',
      mpPayerId: 'mp_payer_demo_001',
    },
  });

  console.log('✅ Subscription created for client (Mega Gym)');

  const endDate5 = new Date();
  endDate5.setDate(endDate5.getDate() + 10);
  
  await prisma.subscription.upsert({
    where: { userId_gymId: { userId: client.id, gymId: gym6.id } },
    update: {},
    create: {
      userId: client.id,
      gymId: gym6.id,
      planId: 'cf-unlimited',
      status: 'ACTIVE',
      type: 'MONTHLY',
      startDate: new Date(),
      endDate: endDate5,
      autoRenew: true,
      mpSubscriptionId: 'mp_sub_demo_005',
      mpPayerId: 'mp_payer_demo_001',
    },
  });

  console.log('✅ Subscription created for client (CrossFit Box)');
  console.log('✅ cliente@gofit.com now has 5 active subscriptions');

  // Nota: nuevo@gofit.com no tiene suscripción - puede usarse para probar el flujo de compra
  console.log('✅ nuevo@gofit.com ready for subscription flow testing');

  // Create branches (sucursales)
  const branches = [
    {
      name: 'Sucursal Centro',
      address: 'Av. Principal 450, Centro',
      phone: '+54 11 4444-5555',
      googleMapsUrl: 'https://maps.google.com/?q=-34.6037,-58.3816',
      googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3284.016887889523!2d-58.38381492342122!3d-34.60373887295424!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccacb8b3b1b1d%3A0x8b8b8b8b8b8b8b8b!2sObelisco!5e0!3m2!1ses!2sar!4v1234567890',
      openTime: '06:00',
      closeTime: '23:00',
      hasParking: true,
      is24Hours: false,
      hasContinuousSchedule: true,
      hasAirConditioning: true,
      hasShowers: true,
      hasLockers: true,
      hasWifi: true,
    },
    {
      name: 'Sucursal Norte',
      address: 'Calle Belgrano 1200, Zona Norte',
      phone: '+54 11 4444-6666',
      googleMapsUrl: 'https://maps.google.com/?q=-34.5500,-58.4500',
      googleMapsEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3284.016887889523!2d-58.45001492342122!3d-34.55003887295424!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb5e5e5e5e5e5%3A0x5e5e5e5e5e5e5e5e!2sZona%20Norte!5e0!3m2!1ses!2sar!4v1234567890',
      openTime: '07:00',
      closeTime: '22:00',
      hasParking: false,
      is24Hours: false,
      hasContinuousSchedule: false,
      hasAirConditioning: true,
      hasShowers: true,
      hasLockers: true,
      hasWifi: false,
    },
  ];

  for (const branch of branches) {
    await prisma.branch.create({
      data: {
        ...branch,
        gymId: gym.id,
      },
    });
  }

  console.log('✅ Branches created:', branches.length);

  // Limpiar beneficios duplicados antes de crear nuevos
  await prisma.benefit.deleteMany({});
  console.log('🗑️  Benefits cleared');

  // Create benefits for GoFit (gym principal)
  const gofitBenefits = [
    { name: 'Golden', description: 'Descuento en suplementos deportivos', discount: '25% OFF', websiteUrl: 'https://golden.com.ar' },
    { name: 'Farmalife', description: 'Descuento en vitaminas y suplementos', discount: '25% OFF', websiteUrl: 'https://farmalife.com.ar' },
    { name: 'SportClub', description: 'Descuento en indumentaria deportiva', discount: '20% OFF', websiteUrl: 'https://sportclub.com.ar' },
    { name: 'NutriCenter', description: 'Descuento en planes nutricionales', discount: '15% OFF', websiteUrl: 'https://nutricenter.com.ar' },
  ];

  for (const benefit of gofitBenefits) {
    await prisma.benefit.create({ data: { ...benefit, gymId: gym.id } });
  }
  console.log('✅ GoFit benefits created:', gofitBenefits.length);

  // Create benefits for Iron Fitness (gym2)
  const ironBenefits = [
    { name: 'ProteinShop', description: 'Proteínas y suplementos premium', discount: '30% OFF', websiteUrl: 'https://proteinshop.com.ar' },
    { name: 'FitWear', description: 'Ropa deportiva de alta gama', discount: '20% OFF', websiteUrl: 'https://fitwear.com.ar' },
  ];

  for (const benefit of ironBenefits) {
    await prisma.benefit.create({ data: { ...benefit, gymId: gym2.id } });
  }
  console.log('✅ Iron Fitness benefits created:', ironBenefits.length);

  // Create benefits for Power Gym (gym3)
  const powerBenefits = [
    { name: 'MuscleFood', description: 'Comidas preparadas para deportistas', discount: '15% OFF', websiteUrl: 'https://musclefood.com.ar' },
    { name: 'GymGear', description: 'Equipamiento y accesorios de gym', discount: '25% OFF', websiteUrl: 'https://gymgear.com.ar' },
    { name: 'RecoverySpa', description: 'Masajes deportivos y recuperación', discount: '20% OFF', websiteUrl: 'https://recoveryspa.com.ar' },
  ];

  for (const benefit of powerBenefits) {
    await prisma.benefit.create({ data: { ...benefit, gymId: gym3.id } });
  }
  console.log('✅ Power Gym benefits created:', powerBenefits.length);

  // Create benefits for Flex Fitness (gym4)
  const flexBenefits = [
    { name: 'YogaMat Pro', description: 'Mats y accesorios de yoga premium', discount: '30% OFF', websiteUrl: 'https://yogamatpro.com.ar' },
    { name: 'Wellness Center', description: 'Tratamientos de bienestar', discount: '15% OFF', websiteUrl: 'https://wellnesscenter.com.ar' },
  ];

  for (const benefit of flexBenefits) {
    await prisma.benefit.create({ data: { ...benefit, gymId: gym4.id } });
  }
  console.log('✅ Flex Fitness benefits created:', flexBenefits.length);

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

  // Limpiar sesiones de workout antiguas
  await prisma.workoutSession.deleteMany({});
  console.log('🗑️  Workout sessions cleared');

  // Obtener el perfil del cliente
  const clientProfile = await prisma.clientProfile.findFirst({
    where: { userId: client.id },
  });

  // Obtener ejercicios existentes
  const exercises = await prisma.exercise.findMany({
    where: { gymId: gym.id },
    take: 4,
  });

  // Obtener rutina existente
  const routine = await prisma.routine.findFirst({
    where: { gymId: gym.id },
  });

  if (clientProfile && exercises.length > 0 && routine) {
    // Crear sesiones de entrenamiento mock con datos de peso
    const mockSessions = [
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Hace 7 días
        dayOfWeek: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getDay(),
        durationMinutes: 45,
        completed: true,
        exercisesCompleted: [
          {
            exerciseId: exercises[0]?.id,
            sets: 3,
            reps: '12',
            seriesData: [
              { setNumber: 1, reps: 12, weight: 15 },
              { setNumber: 2, reps: 12, weight: 17.5 },
              { setNumber: 3, reps: 10, weight: 20 },
            ],
            completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            exerciseId: exercises[1]?.id,
            sets: 3,
            reps: '10',
            seriesData: [
              { setNumber: 1, reps: 10, weight: 30 },
              { setNumber: 2, reps: 10, weight: 32.5 },
              { setNumber: 3, reps: 8, weight: 35 },
            ],
            completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        routineIds: [routine.id],
      },
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Hace 5 días
        dayOfWeek: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).getDay(),
        durationMinutes: 52,
        completed: true,
        exercisesCompleted: [
          {
            exerciseId: exercises[0]?.id,
            sets: 3,
            reps: '12',
            seriesData: [
              { setNumber: 1, reps: 12, weight: 17.5 },
              { setNumber: 2, reps: 12, weight: 20 },
              { setNumber: 3, reps: 10, weight: 22.5 },
            ],
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            exerciseId: exercises[1]?.id,
            sets: 3,
            reps: '10',
            seriesData: [
              { setNumber: 1, reps: 10, weight: 32.5 },
              { setNumber: 2, reps: 10, weight: 35 },
              { setNumber: 3, reps: 8, weight: 37.5 },
            ],
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        routineIds: [routine.id],
      },
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
        dayOfWeek: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).getDay(),
        durationMinutes: 48,
        completed: true,
        exercisesCompleted: [
          {
            exerciseId: exercises[0]?.id,
            sets: 3,
            reps: '12',
            seriesData: [
              { setNumber: 1, reps: 12, weight: 20 },
              { setNumber: 2, reps: 12, weight: 22.5 },
              { setNumber: 3, reps: 10, weight: 25 },
            ],
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            exerciseId: exercises[1]?.id,
            sets: 3,
            reps: '10',
            seriesData: [
              { setNumber: 1, reps: 10, weight: 35 },
              { setNumber: 2, reps: 10, weight: 37.5 },
              { setNumber: 3, reps: 8, weight: 40 },
            ],
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        routineIds: [routine.id],
      },
    ];

    for (const sessionData of mockSessions) {
      await prisma.workoutSession.create({
        data: {
          ...sessionData,
          clientProfileId: clientProfile.id,
        },
      });
    }

    console.log('✅ Mock workout sessions created with weight tracking:', mockSessions.length);
  }

  console.log('');
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('📧 Usuarios de prueba:');
  console.log('');
  console.log('   🏢 GoFit Gimnasio:');
  console.log('      Admin: admin@gofit.com / admin123');
  console.log('      Profesional: entrenador@gofit.com / pro123');
  console.log('      Cliente (con suscripción): cliente@gofit.com / cliente123');
  console.log('');
  console.log('   🏢 Iron Fitness:');
  console.log('      Admin: admin@ironfitness.com / admin123');
  console.log('');
  console.log('   🏢 Power Gym:');
  console.log('      Admin: admin@powergym.com / admin123');
  console.log('');
  console.log('   🆓 Usuario sin suscripción:');
  console.log('      libre@gofit.com / libre123');
  console.log('');
  console.log('   🆕 Usuario nuevo (para probar compra):');
  console.log('      nuevo@gofit.com / nuevo123');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
