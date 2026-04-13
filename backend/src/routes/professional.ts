import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { notifyRoutineAssigned, notifyWelcome } from '../services/notificationService';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('PROFESSIONAL'));

const PROFESSIONAL_CURRENT_SUBSCRIPTION_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED'] as const;
const SUBSCRIPTION_STATUS_PRIORITY: Record<string, number> = {
  ACTIVE: 0,
  PENDING: 1,
  SUSPENDED: 2,
  EXPIRED: 3,
  CANCELLED: 4,
};

const pickPreferredSubscription = (subscriptions: any[]) => {
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    const priorityA = SUBSCRIPTION_STATUS_PRIORITY[a.status] ?? 99;
    const priorityB = SUBSCRIPTION_STATUS_PRIORITY[b.status] ?? 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    const dateA = new Date(a.startDate ?? a.createdAt).getTime();
    const dateB = new Date(b.startDate ?? b.createdAt).getTime();
    return dateB - dateA;
  });

  return sortedSubscriptions[0] ?? null;
};

async function getProfessionalClientContext(
  prisma: PrismaClient,
  professionalId: string,
  gymId: string,
  clientProfileId: string,
) {
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { id: clientProfileId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      plan: true,
    },
  });

  if (!clientProfile) {
    return null;
  }

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: clientProfile.userId,
      gymId,
    },
    include: {
      plan: true,
    },
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
  });

  const assignedSubscription = subscriptions.find(
    (subscription) =>
      subscription.assignedProfessionalId === professionalId
      && PROFESSIONAL_CURRENT_SUBSCRIPTION_STATUSES.includes(subscription.status as any),
  );

  if (clientProfile.assignedProfessionalId !== professionalId && !assignedSubscription) {
    return null;
  }

  return {
    clientProfile,
    currentSubscription: pickPreferredSubscription(subscriptions),
    assignedSubscription,
  };
}

async function getProfessionalClients(
  prisma: PrismaClient,
  professionalId: string,
  gymId: string,
) {
  const clientProfiles = await prisma.clientProfile.findMany({
    where: {
      OR: [
        { assignedProfessionalId: professionalId },
        {
          user: {
            subscriptions: {
              some: {
                gymId,
                assignedProfessionalId: professionalId,
                status: { in: [...PROFESSIONAL_CURRENT_SUBSCRIPTION_STATUSES] },
              },
            },
          },
        },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      plan: true,
      assignedRoutines: {
        where: {
          isActive: true,
          routine: {
            gymId,
            createdBy: {
              role: 'PROFESSIONAL',
            },
          },
        },
        include: {
          routine: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (clientProfiles.length === 0) {
    return [];
  }

  const subscriptions = await prisma.subscription.findMany({
    where: {
      gymId,
      userId: { in: clientProfiles.map((clientProfile) => clientProfile.userId) },
    },
    include: {
      plan: true,
    },
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
  });

  const subscriptionsByUserId = new Map<string, any[]>();
  for (const subscription of subscriptions) {
    const userSubscriptions = subscriptionsByUserId.get(subscription.userId) ?? [];
    userSubscriptions.push(subscription);
    subscriptionsByUserId.set(subscription.userId, userSubscriptions);
  }

  return clientProfiles.map((clientProfile) => {
    const currentSubscription = pickPreferredSubscription(
      subscriptionsByUserId.get(clientProfile.userId) ?? [],
    );

    return {
      id: clientProfile.id,
      user: clientProfile.user,
      subscriptionStatus: currentSubscription?.status ?? clientProfile.subscriptionStatus,
      plan: currentSubscription?.plan ?? clientProfile.plan,
      startDate: currentSubscription?.startDate ?? clientProfile.startDate,
      assignedRoutines: clientProfile.assignedRoutines,
    };
  });
}

// GET /api/professional/plans - Planes activos del gimnasio del profesional
router.get('/plans', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const plans = await prisma.plan.findMany({
      where: {
        gymId: req.user!.gymId!,
        isActive: true,
      },
      orderBy: [{ price: 'asc' }, { name: 'asc' }],
    });

    return res.json({ plans });
  } catch (error) {
    console.error('Error fetching professional plans:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/professional/clients - Crear cliente desde el lado del entrenador
router.post('/clients', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      planId,
      startDate,
      specialConsiderations,
    } = req.body;

    const professional = await prisma.professionalProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!professional) {
      return res.status(404).json({ error: 'Perfil profesional no encontrado' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let plan = null;
    if (planId) {
      plan = await prisma.plan.findFirst({
        where: { id: planId, gymId: req.user!.gymId!, isActive: true },
      });
    }

    const subscriptionStartDate = startDate ? new Date(startDate) : new Date();
    const subscriptionEndDate = new Date(subscriptionStartDate);
    if (plan) {
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + plan.durationDays);
    } else {
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone,
        role: 'CLIENT',
        gymId: req.user!.gymId,
        clientProfile: {
          create: {
            planId: planId || null,
            createdByUserId: req.user!.id,
            createdByGymId: req.user!.gymId,
            assignedProfessionalId: professional.id,
            startDate: subscriptionStartDate,
            specialConsiderations: specialConsiderations || null,
            subscriptionStatus: 'ACTIVE',
          } as any,
        },
        subscriptions: {
          create: {
            gymId: req.user!.gymId!,
            planId: planId || null,
            status: 'ACTIVE',
            type: 'MONTHLY',
            source: 'ADMIN_GRANTED',
            startDate: subscriptionStartDate,
            endDate: subscriptionEndDate,
            autoRenew: false,
            assignedProfessionalId: professional.id,
            createdByUserId: req.user!.id,
            attributedToUserId: req.user!.id,
          } as any,
        },
      },
      include: {
        subscriptions: {
          include: { plan: true, gym: true },
        },
        clientProfile: true,
      },
    });

    const gym = await prisma.gym.findUnique({ where: { id: req.user!.gymId! } });
    if (gym) {
      notifyWelcome(user.id, gym.name, gym.id);
    }

    return res.status(201).json({ client: user, tempPassword: password });
  } catch (error) {
    console.error('Error creating professional client:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/professional/clients
router.get('/clients', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const professional = await prisma.professionalProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!professional) {
      return res.status(404).json({ error: 'Perfil profesional no encontrado' });
    }

    const clients = await getProfessionalClients(prisma, professional.id, req.user!.gymId!);

    return res.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/professional/clients/:id
router.get('/clients/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const professional = await prisma.professionalProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!professional) {
      return res.status(404).json({ error: 'Perfil profesional no encontrado' });
    }

    const clientContext = await getProfessionalClientContext(
      prisma,
      professional.id,
      req.user!.gymId!,
      req.params.id,
    );

    if (!clientContext) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const assignedRoutines = await prisma.clientRoutine.findMany({
      where: {
        clientProfileId: clientContext.clientProfile.id,
        routine: {
          gymId: req.user!.gymId,
          createdBy: {
            role: 'PROFESSIONAL',
          },
        },
      },
      include: {
        routine: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });

    const formattedClient = {
      id: clientContext.clientProfile.id,
      user: clientContext.clientProfile.user,
      subscriptionStatus: clientContext.currentSubscription?.status ?? clientContext.clientProfile.subscriptionStatus,
      plan: clientContext.currentSubscription?.plan ?? clientContext.clientProfile.plan,
      startDate: clientContext.currentSubscription?.startDate ?? clientContext.clientProfile.startDate,
      routines: assignedRoutines.map((assignedRoutine) => assignedRoutine.routine),
    };

    return res.json({ client: formattedClient });
  } catch (error) {
    console.error('Error fetching client:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/professional/exercises - Solo ejercicios creados por el profesional
router.get('/exercises', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    // Solo ejercicios creados por este profesional
    const exercises = await prisma.exercise.findMany({
      where: {
        createdById: req.user!.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/professional/exercises
router.post('/exercises', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, muscleGroup, category, difficulty, videoUrl } = req.body;

    const exercise = await prisma.exercise.create({
      data: {
        name,
        description,
        muscleGroup,
        category,
        difficulty: parseInt(difficulty),
        videoUrl,
        gymId: req.user!.gymId,
        createdById: req.user!.id,
        status: 'PENDING',
      },
    });

    return res.status(201).json({ exercise });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/professional/exercises/approved - DEBE estar ANTES de /exercises/:id
router.get('/exercises/approved', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    // Obtener el gymId del user
    const gymId = req.user!.gymId;

    // Construir condiciones OR
    const orConditions: object[] = [
      { gymId: null, status: 'APPROVED' }, // Ejercicios globales aprobados
      { createdById: req.user!.id }, // Ejercicios creados por el profesional
    ];

    // Solo agregar condición de gymId si existe
    if (gymId) {
      orConditions.push({ gymId, status: 'APPROVED' });
    }

    const exercises = await prisma.exercise.findMany({
      where: { OR: orConditions },
      orderBy: { name: 'asc' },
    });

    return res.json({ exercises });
  } catch (error) {
    console.error('Error fetching approved exercises:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/professional/exercises/:id - Obtener ejercicio por ID
router.get('/exercises/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { gymId: req.user!.gymId },
          { gymId: null },
        ],
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!exercise) {
      return res.status(404).json({ error: 'Ejercicio no encontrado' });
    }

    return res.json({ exercise });
  } catch (error) {
    console.error('Error fetching exercise:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/professional/routines
router.get('/routines', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const routines = await prisma.routine.findMany({
      where: { gymId: req.user!.gymId, createdById: req.user!.id },
      include: {
        _count: { select: { exercises: true, clientRoutines: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ routines });
  } catch (error) {
    console.error('Error fetching routines:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/professional/routines
router.post('/routines', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, category, level, objective, intensity, exercises } = req.body;

    const routine = await prisma.routine.create({
      data: {
        name,
        description,
        category,
        level: parseInt(level),
        objective,
        intensity,
        gymId: req.user!.gymId,
        createdById: req.user!.id,
        exercises: {
          create: exercises?.map((ex: { exerciseId: string; sets: number; reps: string; restSeconds: number }, index: number) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets || 3,
            reps: ex.reps || '12',
            restSeconds: ex.restSeconds || 60,
            order: index,
          })),
        },
      },
      include: { exercises: { include: { exercise: true } } },
    });

    return res.status(201).json({ routine });
  } catch (error) {
    console.error('Error creating routine:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/professional/routines/templates
router.get('/routines/templates', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const templates = await prisma.routine.findMany({
      where: { gymId: req.user!.gymId, isTemplate: true },
      include: {
        exercises: { include: { exercise: true } },
        _count: { select: { clientRoutines: true } },
      },
    });
    return res.json({ routines: templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/professional/routines/:id - Detalle de rutina
router.get('/routines/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const routine = await prisma.routine.findFirst({
      where: {
        id: req.params.id,
        gymId: req.user!.gymId,
        OR: [
          { createdById: req.user!.id },
          { isTemplate: true }
        ]
      },
      include: {
        exercises: { 
          include: { exercise: true },
          orderBy: { order: 'asc' }
        },
        createdBy: { select: { firstName: true, lastName: true } },
        clientRoutines: {
          include: {
            clientProfile: {
              include: {
                user: { select: { firstName: true, lastName: true } }
              }
            }
          }
        },
        _count: { select: { exercises: true, clientRoutines: true } },
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

// PUT /api/professional/routines/:id - Editar rutina
router.put('/routines/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, category, level, objective, intensity, exercises } = req.body;

    // Verificar que la rutina pertenece al profesional Y al gym
    const existing = await prisma.routine.findFirst({
      where: { 
        id: req.params.id, 
        createdById: req.user!.id,
        gymId: req.user!.gymId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rutina no encontrada o sin permisos' });
    }

    // Eliminar ejercicios existentes y crear nuevos
    await prisma.routineExercise.deleteMany({
      where: { routineId: req.params.id },
    });

    const routine = await prisma.routine.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        category,
        level: parseInt(level),
        objective,
        intensity: parseInt(intensity),
        exercises: {
          create: exercises?.map((ex: { exerciseId: string; sets: number; reps: string; restSeconds: number }, index: number) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets || 3,
            reps: ex.reps || '12',
            restSeconds: ex.restSeconds || 60,
            order: index,
          })),
        },
      },
      include: { exercises: { include: { exercise: true } } },
    });

    return res.json({ routine });
  } catch (error) {
    console.error('Error updating routine:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/professional/routines/:id/assign - Asignar rutina a cliente
router.post('/routines/:id/assign', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { clientProfileId, startDate, endDate } = req.body;

    // Verificar que el profesional tiene acceso a la rutina
    const routine = await prisma.routine.findFirst({
      where: { 
        id: req.params.id,
        gymId: req.user!.gymId,
        OR: [
          { createdById: req.user!.id },
          { isTemplate: true }
        ]
      },
      include: {
        exercises: { include: { exercise: true } }
      }
    });

    if (!routine) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    // Verificar que el cliente está asignado al profesional (via ClientProfile o Subscription)
    const professional = await prisma.professionalProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!professional) {
      return res.status(403).json({ error: 'Perfil profesional no encontrado' });
    }

    // Buscar cliente asignado directamente
    let client = await prisma.clientProfile.findFirst({
      where: { 
        id: clientProfileId,
        assignedProfessionalId: professional.id,
      },
    });

    // Si no está asignado directamente, buscar via Subscription
    if (!client) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          assignedProfessionalId: professional.id,
          status: 'ACTIVE',
        },
        include: {
          user: {
            include: {
              clientProfile: true,
            },
          },
        },
      });

      if (subscription?.user?.clientProfile?.id === clientProfileId) {
        client = subscription.user.clientProfile;
      }
    }

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado o no asignado a ti' });
    }

    // Crear snapshot de la rutina
    const snapshotData = {
      name: routine.name,
      description: routine.description,
      category: routine.category,
      level: routine.level,
      objective: routine.objective,
      intensity: routine.intensity,
      exercises: routine.exercises.map(re => ({
        name: re.exercise.name,
        muscleGroup: re.exercise.muscleGroup,
        sets: re.sets,
        reps: re.reps,
        restSeconds: re.restSeconds,
        order: re.order,
      })),
    };

    // Crear asignación
    const assignment = await prisma.clientRoutine.create({
      data: {
        clientProfileId,
        routineId: req.params.id,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
        snapshotData,
      },
      include: {
        routine: true,
        clientProfile: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });

    return res.status(201).json({ assignment });
  } catch (error) {
    console.error('Error assigning routine:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/professional/routines/:id - Eliminar rutina
router.delete('/routines/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const routine = await prisma.routine.findFirst({
      where: { 
        id: req.params.id, 
        createdById: req.user!.id,
        gymId: req.user!.gymId,
      },
    });

    if (!routine) {
      return res.status(404).json({ error: 'Rutina no encontrada o sin permisos' });
    }

    await prisma.routine.delete({
      where: { id: req.params.id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting routine:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== ASIGNACIÓN DE RUTINAS POR DÍA ====================

// GET /api/professional/clients/:clientId/week - Obtener asignaciones de rutinas por día de un cliente
router.get('/clients/:clientId/week', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const professional = await prisma.professionalProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!professional) {
      return res.status(403).json({ error: 'Perfil profesional no encontrado' });
    }

    const clientContext = await getProfessionalClientContext(
      prisma,
      professional.id,
      req.user!.gymId!,
      req.params.clientId,
    );

    if (!clientContext) {
      return res.status(404).json({ error: 'Cliente no encontrado o no asignado a ti' });
    }

    const dayAssignments = await prisma.dayRoutineAssignment.findMany({
      where: { 
        clientProfileId: clientContext.clientProfile.id,
        routine: {
          gymId: req.user!.gymId, // Solo rutinas del gym del profesional
          createdBy: {
            role: 'PROFESSIONAL', // Solo rutinas creadas por profesionales
          },
        },
      },
      include: {
        routine: {
          include: {
            _count: { select: { exercises: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { order: 'asc' }],
    });

    // Agrupar por día
    const weekRoutines: Record<number, typeof dayAssignments> = {};
    for (const assignment of dayAssignments) {
      if (!weekRoutines[assignment.dayOfWeek]) {
        weekRoutines[assignment.dayOfWeek] = [];
      }
      weekRoutines[assignment.dayOfWeek].push(assignment);
    }

    return res.json({ client: clientContext.clientProfile, weekRoutines, assignments: dayAssignments });
  } catch (error) {
    console.error('Error fetching client week:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/professional/clients/:clientId/day-assignment - Asignar rutina a un día específico
router.post('/clients/:clientId/day-assignment', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { routineId, dayOfWeek } = req.body;

    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Día de la semana inválido (0-6)' });
    }

    const professional = await prisma.professionalProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!professional) {
      return res.status(403).json({ error: 'Perfil profesional no encontrado' });
    }

    const clientContext = await getProfessionalClientContext(
      prisma,
      professional.id,
      req.user!.gymId!,
      req.params.clientId,
    );

    if (!clientContext) {
      return res.status(404).json({ error: 'Cliente no encontrado o no asignado a ti' });
    }

    // Verificar que la rutina existe y pertenece al gym
    const routine = await prisma.routine.findFirst({
      where: { 
        id: routineId,
        gymId: req.user!.gymId,
      },
    });

    if (!routine) {
      return res.status(404).json({ error: 'Rutina no encontrada' });
    }

    // Contar cuántas rutinas ya hay en ese día para determinar el orden
    const existingCount = await prisma.dayRoutineAssignment.count({
      where: {
        clientProfileId: clientContext.clientProfile.id,
        dayOfWeek,
      },
    });

    // Crear asignación
    const assignment = await prisma.dayRoutineAssignment.create({
      data: {
        clientProfileId: clientContext.clientProfile.id,
        routineId,
        dayOfWeek,
        order: existingCount,
      },
      include: {
        routine: {
          include: {
            _count: { select: { exercises: true } },
          },
        },
        clientProfile: {
          include: { user: true },
        },
      },
    });

    // Notificar al cliente
    if (assignment.clientProfile?.user) {
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const dayName = dayNames[dayOfWeek] || `Día ${dayOfWeek}`;
      notifyRoutineAssigned(
        assignment.clientProfile.user.id,
        assignment.routine.name,
        dayName,
        req.user!.gymId || undefined
      );
    }

    return res.status(201).json({ assignment });
  } catch (error) {
    console.error('Error creating day assignment:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/professional/day-assignment/:id - Eliminar asignación de rutina de un día
router.delete('/day-assignment/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const professional = await prisma.professionalProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!professional) {
      return res.status(403).json({ error: 'Perfil profesional no encontrado' });
    }

    // Verificar que la asignación pertenece a un cliente del profesional
    const assignment = await prisma.dayRoutineAssignment.findFirst({
      where: { id: req.params.id },
      include: {
        clientProfile: true,
        routine: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }

    // Verificar que la rutina pertenece al gym del profesional
    if (assignment.routine.gymId !== req.user!.gymId) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta asignación' });
    }

    // Verificar que el cliente está asignado al profesional (via ClientProfile o Subscription)
    let isClientAssigned = assignment.clientProfile?.assignedProfessionalId === professional.id;
    
    if (!isClientAssigned) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          assignedProfessionalId: professional.id,
        },
        include: {
          user: {
            include: { clientProfile: true },
          },
        },
      });
      
      if (subscription?.user?.clientProfile?.id === assignment.clientProfileId) {
        isClientAssigned = true;
      }
    }

    if (!isClientAssigned) {
      return res.status(403).json({ error: 'No tienes permiso para modificar este cliente' });
    }

    await prisma.dayRoutineAssignment.delete({
      where: { id: req.params.id },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting day assignment:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/professional/clients/:clientId/week - Actualizar todas las asignaciones de la semana
router.put('/clients/:clientId/week', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { assignments } = req.body; // [{dayOfWeek: number, routineIds: string[]}]

    const professional = await prisma.professionalProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!professional) {
      return res.status(403).json({ error: 'Perfil profesional no encontrado' });
    }

    const clientContext = await getProfessionalClientContext(
      prisma,
      professional.id,
      req.user!.gymId!,
      req.params.clientId,
    );

    if (!clientContext) {
      return res.status(404).json({ error: 'Cliente no encontrado o no asignado a ti' });
    }

    // Verificar que TODAS las rutinas pertenezcan al gym del profesional
    const allRoutineIds: string[] = [];
    for (const dayData of assignments) {
      allRoutineIds.push(...dayData.routineIds);
    }
    
    if (allRoutineIds.length > 0) {
      const validRoutines = await prisma.routine.findMany({
        where: { 
          id: { in: allRoutineIds },
          gymId: req.user!.gymId,
        },
        select: { id: true },
      });
      
      const validIds = new Set(validRoutines.map(r => r.id));
      const invalidIds = allRoutineIds.filter(id => !validIds.has(id));
      
      if (invalidIds.length > 0) {
        return res.status(403).json({ error: 'No tienes permiso para asignar algunas de estas rutinas' });
      }
    }

    // Eliminar SOLO las asignaciones de rutinas de ESTE gym
    await prisma.dayRoutineAssignment.deleteMany({
      where: { 
        clientProfileId: clientContext.clientProfile.id,
        routine: {
          gymId: req.user!.gymId,
        },
      },
    });

    // Crear nuevas asignaciones
    const newAssignments = [];
    for (const dayData of assignments) {
      const { dayOfWeek, routineIds } = dayData;
      for (let i = 0; i < routineIds.length; i++) {
        newAssignments.push({
          clientProfileId: clientContext.clientProfile.id,
          routineId: routineIds[i],
          dayOfWeek,
          order: i,
        });
      }
    }

    if (newAssignments.length > 0) {
      await prisma.dayRoutineAssignment.createMany({
        data: newAssignments,
      });
    }

    // Obtener las asignaciones actualizadas (solo de este gym y creadas por profesionales)
    const updatedAssignments = await prisma.dayRoutineAssignment.findMany({
      where: { 
        clientProfileId: clientContext.clientProfile.id,
        routine: {
          gymId: req.user!.gymId,
          createdBy: {
            role: 'PROFESSIONAL',
          },
        },
      },
      include: {
        routine: {
          include: {
            _count: { select: { exercises: true } },
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { order: 'asc' }],
    });

    return res.json({ assignments: updatedAssignments });
  } catch (error) {
    console.error('Error updating week assignments:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/professional/profile - Obtener perfil profesional
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const profile = await prisma.professionalProfile.findFirst({
      where: { userId: req.user!.id },
    });

    return res.json({ profile });
  } catch (error) {
    console.error('Error fetching professional profile:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/professional/profile - Actualizar perfil profesional
router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { specialty, bio } = req.body;
    
    const profile = await prisma.professionalProfile.findFirst({
      where: { userId: req.user!.id },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Perfil profesional no encontrado' });
    }

    const updatedProfile = await prisma.professionalProfile.update({
      where: { id: profile.id },
      data: {
        specialty: specialty || null,
        bio: bio || null,
      },
    });

    return res.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error updating professional profile:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
