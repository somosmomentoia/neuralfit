import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedWorkouts() {
  // Buscar usuario cliente@gofit.com específicamente
  const user = await prisma.user.findFirst({
    where: { 
      email: 'cliente@gofit.com',
      clientProfile: { isNot: null }
    },
    include: { clientProfile: true }
  });

  if (!user || !user.clientProfile) {
    console.log('No se encontró el usuario cliente@gofit.com');
    return;
  }

  console.log('Usuario encontrado:', user.email, 'ClientProfile ID:', user.clientProfile.id);

  // LIMPIAR entrenamientos existentes
  const deleted = await prisma.workoutSession.deleteMany({
    where: { clientProfileId: user.clientProfile.id }
  });
  console.log('🗑️  Eliminados', deleted.count, 'entrenamientos existentes');

  // Obtener ejercicios globales
  const exercises = await prisma.exercise.findMany({
    where: { isGlobal: true, status: 'APPROVED' },
    take: 20
  });

  console.log('Ejercicios encontrados:', exercises.length);

  if (exercises.length === 0) {
    console.log('No hay ejercicios globales aprobados');
    return;
  }

  // Crear entrenamientos realistas: 4 veces por semana desde agosto 2025 hasta enero 2026
  const workouts = [];
  
  // Días típicos de entrenamiento: Lunes, Miércoles, Viernes, Sábado
  const trainingDays = [1, 3, 5, 6]; // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  
  // Desde 1 de agosto 2025 hasta hoy (24 enero 2026)
  const startDate = new Date(2025, 7, 1); // Agosto 2025
  const endDate = new Date(2026, 0, 24); // 24 Enero 2026
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Solo entrenar en días de entrenamiento
    if (trainingDays.includes(dayOfWeek)) {
      // Pequeña probabilidad de saltarse un entrenamiento (10%)
      if (Math.random() > 0.1) {
        const date = new Date(currentDate);
        // Hora de entrenamiento: entre 7am y 8pm
        const hour = Math.random() > 0.5 
          ? Math.floor(Math.random() * 3) + 7  // Mañana: 7-9am
          : Math.floor(Math.random() * 3) + 18; // Tarde: 6-8pm
        date.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
        
        // Seleccionar 4-6 ejercicios
        const numExercises = Math.floor(Math.random() * 3) + 4;
        const shuffled = [...exercises].sort(() => 0.5 - Math.random());
        const selectedExercises = shuffled.slice(0, numExercises);
        
        const exercisesCompleted = selectedExercises.map(ex => {
          const sets = Math.floor(Math.random() * 2) + 3; // 3-4 sets
          const repsPerSet = Math.floor(Math.random() * 5) + 10; // 10-14 reps
          const seriesData = [];
          
          for (let s = 1; s <= sets; s++) {
            seriesData.push({
              setNumber: s,
              reps: repsPerSet + Math.floor(Math.random() * 3) - 1,
              weight: Math.floor(Math.random() * 30) + 15 // 15-45 kg
            });
          }
          
          return {
            exerciseId: ex.id,
            exerciseName: ex.name,
            sets,
            seriesData,
            completedAt: date.toISOString()
          };
        });
        
        // Calcular calorías realistas (150-350 kcal por sesión)
        const baseCalories = 150 + Math.floor(Math.random() * 200);
        const durationMinutes = Math.floor(Math.random() * 25) + 40; // 40-65 min
        
        // 70% rutinas, 30% entrenamientos libres
        const isFreeWorkout = Math.random() > 0.7;
        
        workouts.push({
          clientProfileId: user.clientProfile.id,
          date,
          dayOfWeek,
          durationMinutes,
          completed: true,
          isFreeWorkout,
          exercisesCompleted,
          routineIds: [],
          caloriesBurned: baseCalories
        });
      }
    }
    
    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Insertar entrenamientos
  for (const workout of workouts) {
    await prisma.workoutSession.create({ data: workout });
  }

  console.log('✅ Creados', workouts.length, 'entrenamientos (Ago 2025 - Ene 2026, ~4/semana)');
}

seedWorkouts()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
