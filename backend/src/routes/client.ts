import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('CLIENT'));

// GET /api/client/profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const profile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
      include: {
        plan: {
          include: {
            features: {
              include: { feature: true },
            },
          },
        },
        assignedRoutines: {
          include: {
            routine: {
              include: {
                _count: { select: { exercises: true } },
              },
            },
          },
        },
        assignedProfessional: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    return res.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/gyms/suggested - Gyms sugeridos para usuarios sin suscripción
router.get('/gyms/suggested', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    // Obtener IDs de gyms donde el usuario ya tiene suscripción
    const existingSubscriptions = await prisma.subscription.findMany({
      where: { 
        userId: req.user!.id,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      select: { gymId: true },
    });
    const subscribedGymIds = existingSubscriptions.map(s => s.gymId);

    // Obtener gyms públicos donde el usuario no tiene suscripción
    const gyms = await prisma.gym.findMany({
      where: { 
        isPublic: true,
        id: { notIn: subscribedGymIds },
      },
      include: {
        plans: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
          take: 1, // Solo el plan más barato para mostrar precio base
        },
        branches: {
          take: 1,
          select: {
            openTime: true,
            closeTime: true,
            is24Hours: true,
          },
        },
        _count: {
          select: { branches: true },
        },
      },
      take: 10,
    });

    // Formatear respuesta
    const suggestedGyms = gyms.map(gym => ({
      id: gym.id,
      name: gym.name,
      slug: gym.slug,
      logo: gym.logo,
      description: gym.description,
      basePrice: gym.plans[0]?.price || null,
      basePlanName: gym.plans[0]?.name || null,
      schedule: gym.branches[0] ? {
        openTime: gym.branches[0].openTime,
        closeTime: gym.branches[0].closeTime,
        is24Hours: gym.branches[0].is24Hours,
      } : null,
      branchCount: gym._count.branches,
    }));

    return res.json({ gyms: suggestedGyms });
  } catch (error) {
    console.error('Error fetching suggested gyms:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/routine/active
router.get('/routine/active', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const activeRoutine = await prisma.clientRoutine.findFirst({
      where: {
        clientProfileId: clientProfile.id,
        isActive: true,
      },
      include: {
        routine: {
          include: {
            exercises: {
              include: {
                exercise: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!activeRoutine) {
      return res.json({ routine: null });
    }

    return res.json({ routine: activeRoutine });
  } catch (error) {
    console.error('Error fetching active routine:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/routine/:id - Obtener rutina específica por ID (propia o asignada)
router.get('/routine/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    // Primero buscar si es una rutina propia del usuario
    const ownRoutine = await prisma.routine.findFirst({
      where: {
        id: req.params.id,
        createdById: req.user!.id,
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
        dayAssignments: true,
      },
    });

    if (ownRoutine) {
      return res.json({ 
        routine: { ...ownRoutine, isOwn: true, assignedBy: null } 
      });
    }

    // Si no es propia, buscar si está asignada al cliente via ClientRoutine
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
      include: {
        assignedRoutines: {
          where: { routineId: req.params.id },
          include: {
            routine: {
              include: {
                exercises: {
                  include: { exercise: true },
                  orderBy: { order: 'asc' },
                },
                dayAssignments: true,
                createdBy: { 
                  select: { 
                    firstName: true, 
                    lastName: true,
                    professionalProfile: {
                      select: {
                        specialty: true,
                      }
                    }
                  } 
                },
              },
            },
          },
        },
        // También buscar en DayRoutineAssignment
        dayAssignments: {
          where: { routineId: req.params.id },
          include: {
            routine: {
              include: {
                exercises: {
                  include: { exercise: true },
                  orderBy: { order: 'asc' },
                },
                dayAssignments: true,
                createdBy: { 
                  select: { 
                    firstName: true, 
                    lastName: true,
                    professionalProfile: {
                      select: {
                        specialty: true,
                      }
                    }
                  } 
                },
              },
            },
          },
        },
      },
    });

    // Primero intentar con ClientRoutine
    const assignedRoutine = clientProfile?.assignedRoutines[0]?.routine;
    
    if (assignedRoutine) {
      const creatorName = `${assignedRoutine.createdBy.firstName} ${assignedRoutine.createdBy.lastName}`;
      const specialty = assignedRoutine.createdBy.professionalProfile?.specialty || 'Entrenador';
      
      // Filtrar dayAssignments para mostrar solo los del cliente actual
      const clientDayAssignments = clientProfile?.dayAssignments
        ?.filter(da => da.routineId === req.params.id)
        .map(da => ({ dayOfWeek: da.dayOfWeek })) || [];
      
      return res.json({ 
        routine: { 
          ...assignedRoutine, 
          isOwn: false, 
          assignedBy: creatorName,
          assignedByGym: specialty,
          dayAssignments: clientDayAssignments,
        } 
      });
    }

    // Si no está en ClientRoutine, buscar en DayRoutineAssignment
    const dayAssignedRoutine = clientProfile?.dayAssignments[0]?.routine;
    
    if (dayAssignedRoutine) {
      const creatorName = `${dayAssignedRoutine.createdBy.firstName} ${dayAssignedRoutine.createdBy.lastName}`;
      const specialty = dayAssignedRoutine.createdBy.professionalProfile?.specialty || 'Entrenador';
      
      // Filtrar dayAssignments para mostrar solo los del cliente actual
      const clientDayAssignments = clientProfile?.dayAssignments
        .filter(da => da.routineId === req.params.id)
        .map(da => ({ dayOfWeek: da.dayOfWeek })) || [];
      
      return res.json({ 
        routine: { 
          ...dayAssignedRoutine, 
          isOwn: false, 
          assignedBy: creatorName,
          assignedByGym: specialty,
          dayAssignments: clientDayAssignments,
        } 
      });
    }

    // Última opción: buscar la rutina directamente si existe y el usuario tiene acceso via DayRoutineAssignment sin filtro de clientProfile
    const routineDirectly = await prisma.routine.findFirst({
      where: { id: req.params.id },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
        dayAssignments: {
          where: { clientProfileId: clientProfile?.id },
        },
        createdBy: { 
          select: { 
            firstName: true, 
            lastName: true,
            professionalProfile: {
              select: {
                specialty: true,
              }
            }
          } 
        },
      },
    });

    // Si la rutina existe y tiene dayAssignments para este cliente
    if (routineDirectly && routineDirectly.dayAssignments.length > 0) {
      const creatorName = `${routineDirectly.createdBy.firstName} ${routineDirectly.createdBy.lastName}`;
      const specialty = routineDirectly.createdBy.professionalProfile?.specialty || 'Entrenador';
      
      return res.json({ 
        routine: { 
          ...routineDirectly, 
          isOwn: false, 
          assignedBy: creatorName,
          assignedByGym: specialty,
        } 
      });
    }

    return res.status(404).json({ error: 'Rutina no encontrada' });
  } catch (error) {
    console.error('Error fetching routine:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/routines/week - Obtener rutinas asignadas + propias por día de la semana
router.get('/routines/week', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    // Obtener TODAS las asignaciones de rutinas para este cliente (propias + asignadas por profesional)
    // Usando DayRoutineAssignment unificado
    const allDayAssignments = clientProfile ? await prisma.dayRoutineAssignment.findMany({
      where: { clientProfileId: clientProfile.id },
      include: {
        routine: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' },
            },
            createdBy: { select: { id: true, role: true } },
            _count: { select: { exercises: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { order: 'asc' }],
    }) : [];

    // Mapear asignaciones marcando si son propias o asignadas
    const allAssignments = allDayAssignments.map(a => {
      const isOwn = a.routine.createdById === req.user!.id;
      return {
        id: a.id,
        dayOfWeek: a.dayOfWeek,
        order: a.order,
        routine: {
          id: a.routine.id,
          name: a.routine.name,
          category: a.routine.category,
          level: a.routine.level,
          intensity: a.routine.intensity,
          estimatedMinutes: a.routine.estimatedMinutes,
          exercises: a.routine.exercises,
          _count: a.routine._count,
          isOwn,
        },
        isOwn,
      };
    });

    // Agrupar por día de la semana
    const weekRoutines: Record<number, typeof allAssignments> = {};
    for (const assignment of allAssignments) {
      if (!weekRoutines[assignment.dayOfWeek]) {
        weekRoutines[assignment.dayOfWeek] = [];
      }
      weekRoutines[assignment.dayOfWeek].push(assignment);
    }

    return res.json({ weekRoutines, assignments: allAssignments });
  } catch (error) {
    console.error('Error fetching week routines:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// POST /api/client/workout/start - Iniciar sesión de entrenamiento
router.post('/workout/start', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { routineId } = req.body; // Opcional: ID de rutina específica a iniciar
    
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Si se especificó una rutina específica, buscar sesión existente para ESA rutina
    if (routineId) {
      // Buscar sesión activa para esta rutina específica
      const existingSessions = await prisma.workoutSession.findMany({
        where: {
          clientProfileId: clientProfile.id,
          date: { gte: startOfDay, lt: endOfDay },
          completed: false,
        },
      });
      
      // Buscar si alguna sesión tiene esta rutina
      const existingSession = existingSessions.find(s => {
        const ids = s.routineIds as string[] || [];
        return ids.includes(routineId);
      });
      
      if (existingSession) {
        return res.json({ session: existingSession, isNew: false });
      }
      
      // Crear nueva sesión solo para esta rutina
      const session = await prisma.workoutSession.create({
        data: {
          clientProfileId: clientProfile.id,
          dayOfWeek,
          routineIds: [routineId],
          exercisesCompleted: [],
          completed: false,
        },
      });
      
      return res.json({ session, isNew: true });
    }
    
    // Sin routineId específico: buscar cualquier sesión activa hoy
    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        clientProfileId: clientProfile.id,
        date: { gte: startOfDay, lt: endOfDay },
        completed: false,
      },
    });

    if (existingSession) {
      return res.json({ session: existingSession, isNew: false });
    }

    // Fallback: obtener todas las rutinas del día usando DayRoutineAssignment unificado
    const todayAssignments = await prisma.dayRoutineAssignment.findMany({
      where: {
        clientProfileId: clientProfile.id,
        dayOfWeek: dayOfWeek,
      },
    });
    const routineIds = todayAssignments.map((a: { routineId: string }) => a.routineId);

    // Crear nueva sesión
    const session = await prisma.workoutSession.create({
      data: {
        clientProfileId: clientProfile.id,
        dayOfWeek,
        routineIds: routineIds,
        exercisesCompleted: [],
        completed: false,
      },
    });

    return res.json({ session, isNew: true });
  } catch (error) {
    console.error('Error starting workout:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/client/workout/:sessionId/exercise - Marcar ejercicio como completado
router.put('/workout/:sessionId/exercise', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { exerciseId, sets, reps, seriesData } = req.body;
    
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const session = await prisma.workoutSession.findFirst({
      where: {
        id: req.params.sessionId,
        clientProfileId: clientProfile.id,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    if (session.completed) {
      return res.status(400).json({ error: 'La sesión ya está completada' });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exercisesCompleted = (session.exercisesCompleted as any[]) || [];
    
    // Agregar ejercicio completado con datos de series
    exercisesCompleted.push({
      exerciseId,
      sets,
      reps,
      seriesData: seriesData || [],
      completedAt: new Date().toISOString(),
    });

    const updatedSession = await prisma.workoutSession.update({
      where: { id: session.id },
      data: { exercisesCompleted },
    });

    return res.json({ session: updatedSession });
  } catch (error) {
    console.error('Error updating exercise:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/workout/history - Historial de entrenamientos
// IMPORTANTE: Esta ruta debe estar ANTES de /workout/:sessionId para evitar conflictos
router.get('/workout/history', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const sessions = await prisma.workoutSession.findMany({
      where: {
        clientProfileId: clientProfile.id,
        completed: true,
      },
      orderBy: { date: 'desc' },
      take: 100, // Aumentado para mostrar más historial
    });

    // Obtener todos los IDs de rutinas únicos de todas las sesiones
    const allRoutineIds = new Set<string>();
    sessions.forEach(s => {
      const ids = s.routineIds as string[] || [];
      ids.forEach(id => allRoutineIds.add(id));
    });

    // Obtener nombres de rutinas
    const routines = await prisma.routine.findMany({
      where: { id: { in: Array.from(allRoutineIds) } },
      select: { id: true, name: true },
    });
    const routineMap = new Map(routines.map(r => [r.id, r.name]));

    // Enriquecer sesiones con nombres de rutinas
    const enrichedSessions = sessions.map(session => {
      const routineIds = session.routineIds as string[] || [];
      const routineNames = routineIds.map(id => routineMap.get(id)).filter(Boolean);
      
      let sessionName: string;
      // Usar el nombre guardado en la sesión si existe
      if (session.sessionName) {
        sessionName = session.sessionName;
      } else if (session.isFreeWorkout) {
        sessionName = 'Entrenamiento Libre';
      } else if (routineNames.length === 1) {
        sessionName = routineNames[0] as string;
      } else if (routineNames.length > 1) {
        sessionName = routineNames.join(' + ');
      } else {
        sessionName = 'Entrenamiento';
      }

      return {
        ...session,
        sessionName,
      };
    });

    // Calcular métricas
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((acc: number, s: { durationMinutes: number | null }) => acc + (s.durationMinutes || 0), 0);
    const totalExercises = sessions.reduce((acc: number, s: { exercisesCompleted: unknown }) => {
      const exercises = s.exercisesCompleted as Array<unknown>;
      return acc + (exercises?.length || 0);
    }, 0);
    const totalCalories = sessions.reduce((acc: number, s: { caloriesBurned: number | null }) => acc + (s.caloriesBurned || 0), 0);

    // Sesiones por día de la semana
    const sessionsByDay: Record<number, number> = {};
    for (const session of sessions) {
      sessionsByDay[session.dayOfWeek] = (sessionsByDay[session.dayOfWeek] || 0) + 1;
    }

    // Calcular racha actual (streak)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Ordenar sesiones por fecha descendente y contar días consecutivos
    const sortedDates = [...new Set(sessions.map(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a);

    if (sortedDates.length > 0) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      let checkDate = today.getTime();
      
      // Si no entrenó hoy, empezar desde ayer
      if (sortedDates[0] < checkDate) {
        checkDate -= oneDayMs;
      }
      
      for (const dateTime of sortedDates) {
        if (dateTime === checkDate || dateTime === checkDate + oneDayMs) {
          currentStreak++;
          checkDate = dateTime - oneDayMs;
        } else if (dateTime < checkDate) {
          break;
        }
      }
    }

    // Calcular calorías por semana (últimas 4 semanas)
    const caloriesByWeek: number[] = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (7 * (i + 1)));
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - (7 * i));
      
      const weekCalories = sessions
        .filter(s => {
          const d = new Date(s.date);
          return d >= weekStart && d < weekEnd;
        })
        .reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);
      
      caloriesByWeek.unshift(Math.round(weekCalories));
    }

    return res.json({
      sessions: enrichedSessions,
      stats: {
        totalSessions,
        totalMinutes,
        totalExercises,
        totalCalories: Math.round(totalCalories),
        sessionsByDay,
        currentStreak,
        caloriesByWeek,
      },
    });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/workout/:sessionId - Obtener detalle de una sesión
router.get('/workout/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const session = await prisma.workoutSession.findFirst({
      where: {
        id: req.params.sessionId,
        clientProfileId: clientProfile.id,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Obtener info de los ejercicios completados
    const exercisesCompleted = session.exercisesCompleted as Array<{
      exerciseId: string;
      exerciseName?: string;
      sets: number;
      seriesData?: Array<{ setNumber: number; reps: number; weight: number }>;
    }> || [];

    // Obtener IDs de ejercicios para buscar sus datos
    const exerciseIds = exercisesCompleted.map(e => e.exerciseId).filter(Boolean);
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds } },
    });

    // Crear mapa de ejercicios para acceso rápido
    const exerciseMap = new Map(exercises.map(e => [e.id, e]));

    // Mapear ejercicios completados con nombre correcto
    const mappedExercises = exercisesCompleted.map(ec => {
      const exerciseData = ec.exerciseId ? exerciseMap.get(ec.exerciseId) : null;
      return {
        ...ec,
        name: exerciseData?.name || ec.exerciseName || 'Ejercicio',
        muscleGroup: exerciseData?.muscleGroup || null,
        caloriesPerRep: exerciseData?.caloriesPerRep || 0.5,
      };
    });

    // Si es entrenamiento libre
    if (session.isFreeWorkout) {
      return res.json({ 
        session: {
          ...session,
          exercisesCompleted: mappedExercises,
        },
        routines: [],
        isFreeWorkout: true,
        freeWorkoutExercises: mappedExercises.map(ec => ({
          ...ec,
          exercise: exerciseMap.get(ec.exerciseId) || { id: ec.exerciseId, name: ec.name },
        })),
      });
    }

    // Obtener las rutinas asociadas a esta sesión
    const routineIds = session.routineIds as string[] || [];
    const routines = await prisma.routine.findMany({
      where: { id: { in: routineIds } },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return res.json({ 
      session: {
        ...session,
        exercisesCompleted: mappedExercises,
      },
      routines,
      isFreeWorkout: false,
    });
  } catch (error) {
    console.error('Error fetching workout session:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/client/workout/:sessionId/complete - Finalizar sesión de entrenamiento
router.put('/workout/:sessionId/complete', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { durationMinutes, caloriesBurned } = req.body;
    
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const session = await prisma.workoutSession.findFirst({
      where: {
        id: req.params.sessionId,
        clientProfileId: clientProfile.id,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }

    // Si ya está completada, retornar sin modificar (evita duplicados)
    if (session.completed) {
      return res.json({ session, isDuplicate: true });
    }

    const updatedSession = await prisma.workoutSession.update({
      where: { id: session.id },
      data: {
        completed: true,
        durationMinutes: durationMinutes || null,
        caloriesBurned: caloriesBurned || null,
      },
    });

    return res.json({ session: updatedSession });
  } catch (error) {
    console.error('Error completing workout:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ BRANCHES (SUCURSALES) ============

// GET /api/client/branches - Obtener sucursales de todos los gyms con suscripción activa
router.get('/branches', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    // Obtener los gym IDs de las suscripciones activas del usuario
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: req.user!.id,
        status: 'ACTIVE',
      },
      select: { gymId: true },
    });

    const gymIds = activeSubscriptions.map(s => s.gymId);

    if (gymIds.length === 0) {
      return res.json({ branches: [], gyms: [] });
    }

    // Obtener branches agrupadas por gym
    const gymsWithBranches = await prisma.gym.findMany({
      where: { id: { in: gymIds } },
      select: {
        id: true,
        name: true,
        logo: true,
        branches: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Flatten para compatibilidad con el formato anterior
    const allBranches = gymsWithBranches.flatMap(gym => 
      gym.branches.map(branch => ({
        ...branch,
        gymId: gym.id,
        gymName: gym.name,
        gymLogo: gym.logo,
      }))
    );

    return res.json({ 
      branches: allBranches,
      gyms: gymsWithBranches,
    });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ BENEFITS (BENEFICIOS EXCLUSIVOS) ============

// GET /api/client/benefits - Obtener beneficios exclusivos activos agrupados por gym
router.get('/benefits', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    // Obtener los gymIds de las suscripciones activas del usuario
    const subscriptions = await prisma.subscription.findMany({
      where: { 
        userId: req.user!.id,
        status: 'ACTIVE',
      },
      select: { gymId: true },
    });
    
    const gymIds: string[] = subscriptions.map(s => s.gymId);
    
    // Si no tiene suscripciones activas, usar el gymId del usuario
    if (gymIds.length === 0 && req.user!.gymId) {
      gymIds.push(req.user!.gymId);
    }

    // Si aún no hay gymIds, devolver vacío
    if (gymIds.length === 0) {
      return res.json({ benefits: [], gymGroups: [] });
    }

    // Obtener beneficios de todos los gyms suscritos con info del gym
    const benefits = await prisma.benefit.findMany({
      where: { 
        gymId: { in: gymIds },
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } },
        ],
      },
      include: {
        gym: {
          select: { id: true, name: true, logo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Agrupar beneficios por gym
    const groupedByGym: Record<string, { gym: { id: string; name: string; logo: string | null }; benefits: typeof benefits }> = {};
    
    for (const benefit of benefits) {
      const gymId = benefit.gymId;
      if (!groupedByGym[gymId]) {
        groupedByGym[gymId] = {
          gym: benefit.gym,
          benefits: [],
        };
      }
      groupedByGym[gymId].benefits.push(benefit);
    }

    const gymGroups = Object.values(groupedByGym);

    return res.json({ benefits, gymGroups });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/benefits/:id - Obtener detalle de un beneficio
router.get('/benefits/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const benefit = await prisma.benefit.findFirst({
      where: { 
        id: req.params.id,
        gym: { id: req.user!.gymId },
        isActive: true,
      },
      include: {
        gym: {
          select: { name: true },
        },
      },
    });

    if (!benefit) {
      return res.status(404).json({ error: 'Beneficio no encontrado' });
    }

    return res.json({ benefit });
  } catch (error) {
    console.error('Error fetching benefit:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ PLANS ============

// GET /api/client/plans - Obtener planes disponibles
router.get('/plans', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const plans = await prisma.plan.findMany({
      where: { 
        gymId: req.user!.gymId,
        isActive: true,
      },
      include: {
        features: {
          include: { feature: true },
        },
      },
      orderBy: { price: 'asc' },
    });

    return res.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/client/change-plan - Cambiar de plan (restricción 15 días)
router.post('/change-plan', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { planId } = req.body;

    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Verificar restricción de 15 días
    if (clientProfile.lastPlanChangeAt) {
      const daysSinceLastChange = Math.floor(
        (Date.now() - clientProfile.lastPlanChangeAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSinceLastChange < 15) {
        const daysRemaining = 15 - daysSinceLastChange;
        return res.status(400).json({ 
          error: `Debes esperar ${daysRemaining} días más para cambiar de plan`,
          daysRemaining,
        });
      }
    }

    // Verificar que el plan existe y está activo
    const plan = await prisma.plan.findFirst({
      where: { id: planId, gymId: req.user!.gymId, isActive: true },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // Actualizar plan
    const updatedProfile = await prisma.clientProfile.update({
      where: { id: clientProfile.id },
      data: {
        planId,
        lastPlanChangeAt: new Date(),
        startDate: new Date(), // Reiniciar fecha de inicio
      },
      include: { 
        plan: {
          include: {
            features: {
              include: { feature: true },
            },
          },
        },
      },
    });

    return res.json({ 
      success: true, 
      profile: updatedProfile,
      message: 'Plan actualizado correctamente',
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ MERCADOPAGO ============

// POST /api/client/subscriptions/create-preference - Crear preferencia de pago MP
router.post('/subscriptions/create-preference', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { gymId, planId } = req.body;

    // Obtener gym con configuración de MP
    const gym = await prisma.gym.findFirst({
      where: { id: gymId, isPublic: true },
    });

    if (!gym) {
      return res.status(404).json({ error: 'Gimnasio no encontrado' });
    }

    if (!gym.mpAccessToken) {
      return res.status(400).json({ error: 'Este gimnasio no tiene MercadoPago configurado' });
    }

    // Obtener plan
    const plan = await prisma.plan.findFirst({
      where: { id: planId, gymId, isActive: true },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // En producción, aquí se crearía la preferencia real con el SDK de MP
    // Por ahora retornamos datos mock para el flujo
    const preferenceId = `PREF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return res.json({
      preferenceId,
      initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`,
      sandboxInitPoint: `https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`,
      plan: {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        durationDays: plan.durationDays,
      },
      gym: {
        id: gym.id,
        name: gym.name,
        logo: gym.logo,
      },
    });
  } catch (error) {
    console.error('Error creating MP preference:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/client/subscriptions/confirm-payment - Confirmar pago de MP (webhook o redirect)
router.post('/subscriptions/confirm-payment', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { gymId, planId, mpPaymentId, mpPreferenceId } = req.body;

    // Verificar que el gym existe
    const gym = await prisma.gym.findFirst({
      where: { id: gymId, isPublic: true },
    });

    if (!gym) {
      return res.status(404).json({ error: 'Gimnasio no encontrado' });
    }

    // Obtener plan
    const plan = await prisma.plan.findFirst({
      where: { id: planId, gymId, isActive: true },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // Calcular fecha de fin
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Crear suscripción activa
    const subscription = await prisma.subscription.create({
      data: {
        userId: req.user!.id,
        gymId,
        planId: plan.id,
        type: 'MONTHLY',
        status: 'ACTIVE',
        source: 'PLATFORM_PURCHASE',
        startDate: new Date(),
        endDate,
        mpSubscriptionId: mpPaymentId,
        mpPreapprovalId: mpPreferenceId,
        autoRenew: true,
      },
      include: {
        gym: true,
        plan: true,
      },
    });

    // Actualizar gymId del usuario
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { gymId },
    });

    // Crear o actualizar ClientProfile
    await prisma.clientProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        planId: plan.id,
        subscriptionStatus: 'ACTIVE',
        startDate: new Date(),
      },
      create: {
        userId: req.user!.id,
        planId: plan.id,
        subscriptionStatus: 'ACTIVE',
        startDate: new Date(),
      },
    });

    return res.status(201).json({ 
      subscription,
      message: '¡Suscripción activada exitosamente!' 
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/exercises - Obtener todos los ejercicios (globales + de mis suscripciones)
router.get('/exercises', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    // Obtener los gymIds de las suscripciones activas del usuario
    const subscriptions = await prisma.subscription.findMany({
      where: { 
        userId: req.user!.id,
        status: 'ACTIVE',
      },
      select: { gymId: true },
    });
    
    const gymIds = subscriptions.map(s => s.gymId);
    
    // Obtener ejercicios globales + ejercicios de los gyms suscritos
    const exercises = await prisma.exercise.findMany({
      where: { 
        status: 'APPROVED',
        OR: [
          { isGlobal: true },
          { gymId: { in: gymIds } },
        ],
      },
      orderBy: [
        { muscleGroup: 'asc' },
        { name: 'asc' },
      ],
    });

    return res.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== SUSCRIPCIONES MÚLTIPLES ====================

// GET /api/client/subscriptions - Listar mis suscripciones
router.get('/subscriptions', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user!.id },
      include: {
        gym: {
          include: {
            branches: { take: 1 },
          },
        },
        plan: {
          include: {
            features: {
              include: { feature: true },
            },
          },
        },
        assignedProfessional: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/subscriptions/:id - Detalle de suscripción
router.get('/subscriptions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const subscription = await prisma.subscription.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        gym: {
          include: {
            branches: true,
            benefits: { where: { isActive: true } },
          },
        },
        plan: {
          include: {
            features: {
              include: { feature: true },
            },
          },
        },
        assignedProfessional: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        dayRoutineAssignments: {
          include: {
            routine: {
              include: {
                _count: { select: { exercises: true } },
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    return res.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/client/subscriptions - Crear nueva suscripción (redirige a MercadoPago)
router.post('/subscriptions', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { gymId, planId, type } = req.body;

    // Verificar que el gym existe y es público
    const gym = await prisma.gym.findFirst({
      where: { id: gymId, isPublic: true },
    });

    if (!gym) {
      return res.status(404).json({ error: 'Gimnasio no encontrado' });
    }

    // Verificar que no tenga ya una suscripción activa a este gym
    const existingSubscription = await prisma.subscription.findFirst({
      where: { 
        userId: req.user!.id, 
        gymId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
    });

    if (existingSubscription) {
      return res.status(400).json({ error: 'Ya tienes una suscripción a este gimnasio' });
    }

    // Obtener el plan si se especificó
    let plan = null;
    let endDate = null;
    if (planId) {
      plan = await prisma.plan.findFirst({
        where: { id: planId, gymId, isActive: true },
      });
      if (plan) {
        endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.durationDays);
      }
    }

    // Crear suscripción con status ACTIVE (pago por MercadoPago)
    const subscription = await prisma.subscription.create({
      data: {
        userId: req.user!.id,
        gymId,
        planId: plan?.id,
        type: type || 'MONTHLY',
        status: 'ACTIVE',
        source: 'PLATFORM_PURCHASE',
        startDate: new Date(),
        endDate,
        autoRenew: true,
      },
      include: {
        gym: true,
        plan: true,
      },
    });

    // Actualizar el gymId del usuario para que pertenezca a este gym
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { gymId },
    });

    // Crear o actualizar ClientProfile con el plan y status activo
    await prisma.clientProfile.upsert({
      where: { userId: req.user!.id },
      update: {
        planId: plan?.id,
        subscriptionStatus: 'ACTIVE',
        startDate: new Date(),
      },
      create: {
        userId: req.user!.id,
        planId: plan?.id,
        subscriptionStatus: 'ACTIVE',
        startDate: new Date(),
      },
    });

    return res.status(201).json({ 
      subscription,
      message: '¡Suscripción activada exitosamente!' 
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/client/subscriptions/:id/cancel - Cancelar suscripción
// La suscripción se mantiene activa hasta la fecha de fin, solo se marca para no renovar
router.put('/subscriptions/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const subscription = await prisma.subscription.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        gym: {
          select: { mpAccessToken: true },
        },
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    // Si tiene suscripción de MercadoPago, notificar para cancelar renovación
    if (subscription.mpPreapprovalId && subscription.gym.mpAccessToken) {
      try {
        // En producción, aquí se llamaría a la API de MercadoPago para cancelar la suscripción
        // await fetch(`https://api.mercadopago.com/preapproval/${subscription.mpPreapprovalId}`, {
        //   method: 'PUT',
        //   headers: {
        //     'Authorization': `Bearer ${subscription.gym.mpAccessToken}`,
        //     'Content-Type': 'application/json',
        //   },
        //   body: JSON.stringify({ status: 'cancelled' }),
        // });
      } catch (mpError) {
        console.error('Error notificando a MercadoPago:', mpError);
        // Continuamos con la cancelación local aunque falle MP
      }
    }

    // La suscripción se mantiene ACTIVE hasta la fecha de fin
    // Solo marcamos autoRenew = false y agregamos fecha de cancelación
    const updated = await prisma.subscription.update({
      where: { id: req.params.id },
      data: { 
        autoRenew: false,
        cancelledAt: new Date(),
      },
      include: {
        gym: { select: { id: true, name: true } },
        plan: true,
      },
    });

    return res.json({ 
      subscription: updated,
      message: 'Suscripción cancelada. Seguirá activa hasta la fecha de vencimiento.',
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/gyms - Listar gimnasios públicos disponibles
router.get('/gyms', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const gyms = await prisma.gym.findMany({
      where: { isPublic: true },
      include: {
        branches: { 
          where: { isActive: true },
          take: 1,
        },
        plans: {
          where: { isActive: true },
          orderBy: { price: 'asc' },
        },
        _count: {
          select: { subscriptions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({ gyms });
  } catch (error) {
    console.error('Error fetching gyms:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/gyms/:id - Detalle de un gimnasio
router.get('/gyms/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const gym = await prisma.gym.findFirst({
      where: { id: req.params.id, isPublic: true },
      include: {
        branches: { where: { isActive: true } },
        plans: {
          where: { isActive: true },
          include: {
            features: {
              include: { feature: true },
            },
          },
          orderBy: { price: 'asc' },
        },
        benefits: { where: { isActive: true } },
      },
    });

    if (!gym) {
      return res.status(404).json({ error: 'Gimnasio no encontrado' });
    }

    // Verificar si el usuario ya tiene suscripción
    const existingSubscription = await prisma.subscription.findFirst({
      where: { userId: req.user!.id, gymId: gym.id },
    });

    return res.json({ 
      gym,
      hasSubscription: !!existingSubscription,
      subscription: existingSubscription,
    });
  } catch (error) {
    console.error('Error fetching gym:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/exercises/global - Ejercicios globales
router.get('/exercises/global', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const exercises = await prisma.exercise.findMany({
      where: { 
        isGlobal: true,
        status: 'APPROVED',
      },
      orderBy: [
        { muscleGroup: 'asc' },
        { name: 'asc' },
      ],
    });

    return res.json({ exercises });
  } catch (error) {
    console.error('Error fetching global exercises:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/client/workout/free - Guardar sesión de entrenamiento libre
router.post('/workout/free', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { exercisesCompleted, durationMinutes, caloriesBurned, workoutName, saveAsRoutine, clientRequestId } = req.body;

    // Obtener el clientProfile del usuario
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Perfil de cliente no encontrado' });
    }

    // Verificar si ya existe una sesión libre completada en los últimos 30 segundos para evitar duplicados
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    const recentSession = await prisma.workoutSession.findFirst({
      where: {
        clientProfileId: clientProfile.id,
        isFreeWorkout: true,
        completed: true,
        date: { gte: thirtySecondsAgo },
      },
      orderBy: { date: 'desc' },
    });

    if (recentSession) {
      return res.status(200).json({ session: recentSession, savedRoutine: null, isDuplicate: true });
    }

    // Si el usuario quiere guardar como rutina, crear la rutina
    let savedRoutine = null;
    if (saveAsRoutine && exercisesCompleted && exercisesCompleted.length > 0) {
      // Obtener el gymId del usuario (de su primera suscripción activa o del gym por defecto)
      const userWithGym = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { 
          gym: true,
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { plan: { include: { gym: true } } },
            take: 1,
          },
        },
      });
      
      const gymId = userWithGym?.subscriptions?.[0]?.plan?.gymId || userWithGym?.gymId;
      
      if (gymId) {
        savedRoutine = await prisma.routine.create({
          data: {
            name: workoutName || 'Mi Rutina',
            description: `Rutina creada desde entrenamiento libre`,
            category: 'MUSCULACION',
            gymId,
            createdById: req.user!.id,
            exercises: {
              create: exercisesCompleted.map((ex: { exerciseId: string; sets: number; reps: string }, index: number) => ({
                exerciseId: ex.exerciseId,
                sets: ex.sets || 3,
                reps: ex.reps || '12',
                restSeconds: 60,
                order: index + 1,
              })),
            },
          },
          include: {
            exercises: {
              include: { exercise: true },
            },
          },
        });
      }
    }

    const session = await prisma.workoutSession.create({
      data: {
        clientProfileId: clientProfile.id,
        dayOfWeek: new Date().getDay(),
        durationMinutes: durationMinutes || null,
        completed: true,
        isFreeWorkout: true,
        sessionName: workoutName || 'Entrenamiento Libre',
        exercisesCompleted: exercisesCompleted || [],
        routineIds: savedRoutine ? [savedRoutine.id] : [],
        caloriesBurned: caloriesBurned || null,
      },
    });

    return res.status(201).json({ session, savedRoutine });
  } catch (error) {
    console.error('Error saving free workout:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/workout/free/history - Historial de entrenamientos libres
router.get('/workout/free/history', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    const sessions = await prisma.workoutSession.findMany({
      where: { 
        clientProfileId: clientProfile.id,
        isFreeWorkout: true,
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    return res.json({ sessions });
  } catch (error) {
    console.error('Error fetching free workout history:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== RUTINAS PERSONALIZADAS DEL CLIENTE ====================

// GET /api/client/routines/my - Obtener rutinas propias del cliente
router.get('/routines/my', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const routines = await prisma.routine.findMany({
      where: { 
        createdById: req.user!.id,
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
        dayAssignments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ routines });
  } catch (error) {
    console.error('Error fetching my routines:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/client/routines/my - Crear rutina personalizada
router.post('/routines/my', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, category, level, intensity, exercises, dayAssignments } = req.body;

    if (!name || !exercises || exercises.length === 0) {
      return res.status(400).json({ error: 'Nombre y ejercicios son requeridos' });
    }

    // Obtener el gymId del usuario (puede ser null para usuarios libres)
    const gymId = req.user!.gymId;
    
    // Si no tiene gym, usar un gym por defecto o crear sin gym
    // Para rutinas personalizadas, usamos el gym del usuario si existe
    if (!gymId) {
      return res.status(400).json({ error: 'Necesitas estar suscrito a un gimnasio para crear rutinas' });
    }

    // Obtener el clientProfileId del usuario
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    const routine = await prisma.routine.create({
      data: {
        name,
        description: description || null,
        category: category || 'MUSCULACION',
        level: level || 1,
        intensity: intensity || 3,
        gymId,
        createdById: req.user!.id,
        exercises: {
          create: exercises.map((ex: { exerciseId: string; sets?: number; reps?: string; restSeconds?: number; notes?: string }, index: number) => ({
            order: index + 1,
            exerciseId: ex.exerciseId,
            sets: ex.sets || 3,
            reps: ex.reps || '12',
            restSeconds: ex.restSeconds || 60,
            notes: ex.notes || null,
          })),
        },
        // Usar DayRoutineAssignment con clientProfileId para unificar lógica
        dayAssignments: (dayAssignments && clientProfile) ? {
          create: dayAssignments.map((day: number) => ({
            dayOfWeek: day,
            clientProfileId: clientProfile.id,
          })),
        } : undefined,
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
        dayAssignments: true,
      },
    });

    return res.status(201).json({ routine });
  } catch (error) {
    console.error('Error creating routine:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/routines/my/:id - Obtener una rutina propia específica
router.get('/routines/my/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const routine = await prisma.routine.findFirst({
      where: { 
        id: req.params.id, 
        createdById: req.user!.id,
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
        dayAssignments: true,
      },
    });

    if (!routine) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    return res.json({ routine });
  } catch (error) {
    console.error('Error fetching routine:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/client/routines/my/:id - Actualizar rutina propia
router.put('/routines/my/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, exercises, dayAssignments } = req.body;

    // Verificar que la rutina pertenece al usuario
    const existing = await prisma.routine.findFirst({
      where: { id: req.params.id, createdById: req.user!.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    // Obtener el clientProfileId del usuario
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    // Si solo se envían dayAssignments, solo actualizar eso
    if (dayAssignments !== undefined && !exercises) {
      // Eliminar solo las asignaciones de este cliente para esta rutina
      await prisma.dayRoutineAssignment.deleteMany({ 
        where: { 
          routineId: req.params.id,
          clientProfileId: clientProfile?.id,
        } 
      });
      
      const routine = await prisma.routine.update({
        where: { id: req.params.id },
        data: {
          name: name || existing.name,
          description: description !== undefined ? description : existing.description,
          dayAssignments: (dayAssignments && clientProfile) ? {
            create: dayAssignments.map((day: number) => ({
              dayOfWeek: day,
              clientProfileId: clientProfile.id,
            })),
          } : undefined,
        },
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
          dayAssignments: {
            where: { clientProfileId: clientProfile?.id },
          },
        },
      });

      return res.json({ routine });
    }

    // Actualización completa (con ejercicios)
    await prisma.routineExercise.deleteMany({ where: { routineId: req.params.id } });
    await prisma.dayRoutineAssignment.deleteMany({ 
      where: { 
        routineId: req.params.id,
        clientProfileId: clientProfile?.id,
      } 
    });

    const routine = await prisma.routine.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        exercises: exercises ? {
          create: exercises.map((ex: { exerciseId: string; sets?: number; reps?: string; restSeconds?: number; notes?: string }, index: number) => ({
            order: index + 1,
            exerciseId: ex.exerciseId,
            sets: ex.sets || 3,
            reps: ex.reps || '12',
            restSeconds: ex.restSeconds || 60,
            notes: ex.notes || null,
          })),
        } : undefined,
        dayAssignments: (dayAssignments && clientProfile) ? {
          create: dayAssignments.map((day: number) => ({
            dayOfWeek: day,
            clientProfileId: clientProfile.id,
          })),
        } : undefined,
      },
      include: {
        exercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
        dayAssignments: {
          where: { clientProfileId: clientProfile?.id },
        },
      },
    });

    return res.json({ routine });
  } catch (error) {
    console.error('Error updating routine:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/client/routines/my/:id - Eliminar rutina propia
router.delete('/routines/my/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    // Verificar que la rutina pertenece al usuario
    const existing = await prisma.routine.findFirst({
      where: { id: req.params.id, createdById: req.user!.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    await prisma.routine.delete({ where: { id: req.params.id } });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting routine:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/client/routines/today - Obtener rutinas de hoy (asignadas + propias)
router.get('/routines/today', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const todayDate = new Date();
    const today = todayDate.getDay(); // 0 = domingo, 1 = lunes, etc.
    const startOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    const endOfDay = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() + 1);

    // Obtener perfil del cliente
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    // Obtener TODAS las rutinas asignadas para HOY usando DayRoutineAssignment unificado
    // Esto incluye tanto rutinas propias como asignadas por profesional
    const dayAssignments = clientProfile ? await prisma.dayRoutineAssignment.findMany({
      where: {
        clientProfileId: clientProfile.id,
        dayOfWeek: today,
      },
      include: {
        routine: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' },
            },
            createdBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { order: 'asc' },
    }) : [];

    // Mapear rutinas marcando si son propias o asignadas
    const allRoutines = dayAssignments.map(da => {
      const isOwn = da.routine.createdById === req.user!.id;
      return {
        ...da.routine,
        isOwn,
        assignedBy: isOwn ? null : `${da.routine.createdBy.firstName} ${da.routine.createdBy.lastName}`,
      };
    });

    // Verificar qué rutinas específicas se completaron hoy
    let completedRoutineIds: string[] = [];
    if (clientProfile) {
      const todaySessions = await prisma.workoutSession.findMany({
        where: {
          clientProfileId: clientProfile.id,
          date: { gte: startOfDay, lt: endOfDay },
          completed: true,
        },
      });
      
      // Extraer los IDs de rutinas completadas de todas las sesiones de hoy
      todaySessions.forEach(session => {
        if (session.routineIds && Array.isArray(session.routineIds)) {
          completedRoutineIds.push(...(session.routineIds as string[]));
        }
      });
      
      // Eliminar duplicados
      completedRoutineIds = [...new Set(completedRoutineIds)];
    }

    // isCompleted es true solo si TODAS las rutinas de hoy están completadas
    const isCompleted = allRoutines.length > 0 && allRoutines.every(r => completedRoutineIds.includes(r.id));

    return res.json({ 
      routines: allRoutines, 
      dayOfWeek: today, 
      isCompleted,
      completedRoutineIds,
    });
  } catch (error) {
    console.error('Error fetching today routines:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

function detectCardBrand(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'VISA';
  if (/^5[1-5]/.test(cleaned)) return 'MASTERCARD';
  if (/^3[47]/.test(cleaned)) return 'AMEX';
  if (/^6(?:011|5)/.test(cleaned)) return 'DISCOVER';
  return 'UNKNOWN';
}

// GET /api/client/progress - Obtener estadísticas de progreso completas
router.get('/progress', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const selectedYear = parseInt(req.query.year as string) || new Date().getFullYear();
    
    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    // Obtener todas las sesiones del usuario
    const allSessions = await prisma.workoutSession.findMany({
      where: {
        clientProfileId: clientProfile.id,
        completed: true,
      },
      orderBy: { date: 'desc' },
    });

    // Filtrar sesiones por año seleccionado para datos mensuales
    const sessions = allSessions;
    const yearFilteredSessions = allSessions.filter(s => {
      const d = new Date(s.date);
      return d.getFullYear() === selectedYear;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular métricas generales
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    const totalCalories = sessions.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);
    const totalExercises = sessions.reduce((acc, s) => {
      const exercises = s.exercisesCompleted as Array<unknown>;
      return acc + (exercises?.length || 0);
    }, 0);

    // Calcular racha actual
    let currentStreak = 0;
    const sortedDates = [...new Set(sessions.map(s => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a);

    if (sortedDates.length > 0) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      let checkDate = today.getTime();
      
      if (sortedDates[0] < checkDate) {
        checkDate -= oneDayMs;
      }
      
      for (const dateTime of sortedDates) {
        if (dateTime === checkDate || dateTime === checkDate + oneDayMs) {
          currentStreak++;
          checkDate = dateTime - oneDayMs;
        } else if (dateTime < checkDate) {
          break;
        }
      }
    }

    // Calcular mejor racha
    let bestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const diff = sortedDates[i - 1] - sortedDates[i];
        if (diff <= 24 * 60 * 60 * 1000) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak);

    // Sesiones por día de la semana
    const sessionsByDay: Record<number, number> = {};
    for (const session of sessions) {
      sessionsByDay[session.dayOfWeek] = (sessionsByDay[session.dayOfWeek] || 0) + 1;
    }

    // Datos por semana (últimas 8 semanas incluyendo la actual)
    const weeklyData: Array<{ week: string; sessions: number; calories: number; minutes: number }> = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (7 * i) - 6);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - (7 * i));
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekSessions = sessions.filter(s => {
        const d = new Date(s.date);
        return d >= weekStart && d <= weekEnd;
      });
      
      weeklyData.push({
        week: `S${8 - i}`,
        sessions: weekSessions.length,
        calories: Math.round(weekSessions.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0)),
        minutes: weekSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0),
      });
    }

    // Datos por mes (todos los meses del año seleccionado)
    const monthlyData: Array<{ month: string; sessions: number; calories: number; year: number }> = [];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    // Generar datos para todos los meses del año seleccionado
    for (let month = 0; month < 12; month++) {
      // Si es el año actual, solo mostrar hasta el mes actual
      if (selectedYear === currentYear && month > currentMonth) break;
      
      const monthDate = new Date(selectedYear, month, 1);
      const monthEnd = new Date(selectedYear, month + 1, 0, 23, 59, 59, 999);
      
      const monthSessions = yearFilteredSessions.filter(s => {
        const d = new Date(s.date);
        return d >= monthDate && d <= monthEnd;
      });
      
      monthlyData.push({
        month: monthNames[month],
        sessions: monthSessions.length,
        calories: Math.round(monthSessions.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0)),
        year: selectedYear,
      });
    }

    // Calcular promedios
    const avgSessionDuration = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    const avgCaloriesPerSession = totalSessions > 0 ? Math.round(totalCalories / totalSessions) : 0;

    // Sesiones este mes vs mes anterior
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    const thisMonthSessions = sessions.filter(s => new Date(s.date) >= thisMonthStart).length;
    const lastMonthSessions = sessions.filter(s => {
      const d = new Date(s.date);
      return d >= lastMonthStart && d <= lastMonthEnd;
    }).length;

    const monthlyGrowth = lastMonthSessions > 0 
      ? Math.round(((thisMonthSessions - lastMonthSessions) / lastMonthSessions) * 100)
      : thisMonthSessions > 0 ? 100 : 0;

    // Grupos musculares más trabajados
    const muscleGroups: Record<string, number> = {};
    for (const session of sessions) {
      const exercises = session.exercisesCompleted as Array<{ exercise?: { muscleGroup?: string } }>;
      if (exercises) {
        for (const ex of exercises) {
          const group = ex.exercise?.muscleGroup || 'General';
          muscleGroups[group] = (muscleGroups[group] || 0) + 1;
        }
      }
    }

    const topMuscleGroups = Object.entries(muscleGroups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Última sesión
    const lastSession = sessions[0] || null;

    // Helper para obtener ejercicios top por calorías de un conjunto de sesiones
    const getTopExercisesFromSessions = async (sessionList: typeof sessions) => {
      const exerciseIds = new Set<string>();
      for (const session of sessionList) {
        const exercises = session.exercisesCompleted as Array<{ 
          exerciseId?: string;
          exerciseName?: string;
          seriesData?: Array<{ reps?: number; weight?: number }>;
        }>;
        if (exercises && Array.isArray(exercises)) {
          for (const ex of exercises) {
            if (ex.exerciseId) exerciseIds.add(ex.exerciseId);
          }
        }
      }

      const exercisesData = await prisma.exercise.findMany({
        where: { id: { in: Array.from(exerciseIds) } },
        select: { id: true, name: true, caloriesPerRep: true },
      });
      const exerciseMap = new Map(exercisesData.map(e => [e.id, e]));

      const caloriesByExercise: Record<string, { name: string; totalCalories: number; count: number }> = {};
      for (const session of sessionList) {
        const exercises = session.exercisesCompleted as Array<{ 
          exerciseId?: string;
          exerciseName?: string;
          seriesData?: Array<{ reps?: number; weight?: number }>;
        }>;
        if (exercises && Array.isArray(exercises)) {
          for (const ex of exercises) {
            const exData = ex.exerciseId ? exerciseMap.get(ex.exerciseId) : null;
            const name = exData?.name || ex.exerciseName || 'Ejercicio';
            const caloriesPerRep = exData?.caloriesPerRep || 0.5;
            let totalReps = 0;
            if (ex.seriesData && Array.isArray(ex.seriesData)) {
              totalReps = ex.seriesData.reduce((acc, s) => acc + (s.reps || 0), 0);
            }
            const calories = totalReps * caloriesPerRep;
            if (!caloriesByExercise[name]) {
              caloriesByExercise[name] = { name, totalCalories: 0, count: 0 };
            }
            caloriesByExercise[name].totalCalories += calories;
            caloriesByExercise[name].count += 1;
          }
        }
      }

      return Object.values(caloriesByExercise)
        .sort((a, b) => b.totalCalories - a.totalCalories)
        .slice(0, 4)
        .map(e => ({ 
          name: e.name, 
          calories: Math.round(e.totalCalories),
          avgCalories: e.count > 0 ? Math.round(e.totalCalories / e.count) : 0
        }));
    };

    // Filtrar sesiones por período
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    
    const yearStart = new Date(today.getFullYear(), 0, 1);

    const weekSessions = sessions.filter(s => new Date(s.date) >= weekStart);
    const yearSessions = sessions.filter(s => new Date(s.date) >= yearStart);

    // Calcular datos por cada mes del año seleccionado
    const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const topExercisesByMonth: Record<string, Awaited<ReturnType<typeof getTopExercisesFromSessions>>> = {};
    const recentSessionsByMonth: Record<string, typeof recentSessionsWeek> = {};

    for (let month = 0; month < 12; month++) {
      // Si es el año actual, solo procesar hasta el mes actual
      if (selectedYear === currentYear && month > currentMonth) break;
      
      const monthDate = new Date(selectedYear, month, 1);
      const monthEnd = new Date(selectedYear, month + 1, 0, 23, 59, 59, 999);
      const monthName = monthNamesShort[month];
      
      const monthSessions = yearFilteredSessions.filter(s => {
        const d = new Date(s.date);
        return d >= monthDate && d <= monthEnd;
      });

      topExercisesByMonth[monthName] = await getTopExercisesFromSessions(monthSessions);
      recentSessionsByMonth[monthName] = monthSessions.map(s => ({
        id: s.id,
        date: s.date,
        durationMinutes: s.durationMinutes,
        caloriesBurned: s.caloriesBurned,
        isFreeWorkout: s.isFreeWorkout,
      }));
    }

    // Calcular datos para semana y año
    const [topExercisesWeek, topExercisesYear] = await Promise.all([
      getTopExercisesFromSessions(weekSessions),
      getTopExercisesFromSessions(yearSessions),
    ]);

    // Sesiones para semana y año (todas, no solo las recientes)
    const recentSessionsWeek = weekSessions.map(s => ({
      id: s.id,
      date: s.date,
      durationMinutes: s.durationMinutes,
      caloriesBurned: s.caloriesBurned,
      isFreeWorkout: s.isFreeWorkout,
    }));

    const recentSessionsYear = yearFilteredSessions.map(s => ({
      id: s.id,
      date: s.date,
      durationMinutes: s.durationMinutes,
      caloriesBurned: s.caloriesBurned,
      isFreeWorkout: s.isFreeWorkout,
    }));

    return res.json({
      overview: {
        totalSessions,
        totalMinutes,
        totalCalories: Math.round(totalCalories),
        totalExercises,
        currentStreak,
        bestStreak,
        avgSessionDuration,
        avgCaloriesPerSession,
        thisMonthSessions,
        monthlyGrowth,
      },
      sessionsByDay,
      weeklyData,
      monthlyData,
      topMuscleGroups,
      topCalorieExercises: {
        week: topExercisesWeek,
        byMonth: topExercisesByMonth,
        year: topExercisesYear,
      },
      recentSessions: {
        week: recentSessionsWeek,
        byMonth: recentSessionsByMonth,
        year: recentSessionsYear,
      },
      lastSession: lastSession ? {
        id: lastSession.id,
        date: lastSession.date,
        durationMinutes: lastSession.durationMinutes,
        caloriesBurned: lastSession.caloriesBurned,
        isFreeWorkout: lastSession.isFreeWorkout,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/client/profile - Actualizar perfil del cliente (peso, altura, apto médico)
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { weight, height, medicalClearanceUrl } = req.body;

    let clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
    });

    // Si no existe el perfil, crearlo
    if (!clientProfile) {
      clientProfile = await prisma.clientProfile.create({
        data: {
          userId: req.user!.id,
          weight: weight !== undefined ? weight : null,
          height: height !== undefined ? height : null,
          medicalClearanceUrl: medicalClearanceUrl !== undefined ? medicalClearanceUrl : null,
        },
      });
      return res.json({ profile: clientProfile });
    }

    const updatedProfile = await prisma.clientProfile.update({
      where: { id: clientProfile.id },
      data: {
        weight: weight !== undefined ? weight : clientProfile.weight,
        height: height !== undefined ? height : clientProfile.height,
        medicalClearanceUrl: medicalClearanceUrl !== undefined ? medicalClearanceUrl : clientProfile.medicalClearanceUrl,
      },
    });

    return res.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error updating client profile:', error);
    return res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

// GET /api/client/profile/health - Obtener datos de salud del cliente
router.get('/profile/health', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const clientProfile = await prisma.clientProfile.findFirst({
      where: { userId: req.user!.id },
      select: {
        weight: true,
        height: true,
        medicalClearanceUrl: true,
      },
    });

    if (!clientProfile) {
      return res.status(404).json({ error: 'Perfil no encontrado' });
    }

    return res.json({ health: clientProfile });
  } catch (error) {
    console.error('Error fetching health data:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
