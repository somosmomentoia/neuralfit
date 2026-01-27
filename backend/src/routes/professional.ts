import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.use(requireRole('PROFESSIONAL'));

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

    // Buscar clientes asignados a través de ClientProfile O a través de Subscription
    const clientsFromProfile = await prisma.clientProfile.findMany({
      where: { assignedProfessionalId: professional.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        plan: true,
        assignedRoutines: { 
          where: {
            routine: {
              gymId: req.user!.gymId, // Solo rutinas del gym del profesional
              createdBy: {
                role: 'PROFESSIONAL', // Solo rutinas creadas por profesionales
              },
            },
          },
          include: { routine: true } 
        },
      },
    });

    // También buscar clientes asignados a través de Subscription (nuevo modelo)
    const subscriptions = await prisma.subscription.findMany({
      where: { 
        assignedProfessionalId: professional.id,
      },
      include: {
        user: {
          include: {
            clientProfile: {
              include: {
                plan: true,
                assignedRoutines: { 
                  where: {
                    routine: {
                      gymId: req.user!.gymId, // Solo rutinas del gym del profesional
                      createdBy: {
                        role: 'PROFESSIONAL', // Solo rutinas creadas por profesionales
                      },
                    },
                  },
                  include: { routine: true } 
                },
              },
            },
          },
        },
      },
    });

    // Combinar y deduplicar clientes
    const clientsFromSubscriptions = subscriptions
      .filter(sub => sub.user.clientProfile)
      .map(sub => ({
        ...sub.user.clientProfile!,
        user: { 
          id: sub.user.id, 
          firstName: sub.user.firstName, 
          lastName: sub.user.lastName, 
          email: sub.user.email 
        },
      }));

    // Deduplicar por ID
    const allClientsMap = new Map();
    [...clientsFromProfile, ...clientsFromSubscriptions].forEach(client => {
      allClientsMap.set(client.id, client);
    });

    const clients = Array.from(allClientsMap.values());

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

    // Buscar cliente por ClientProfile.assignedProfessionalId
    let client = await prisma.clientProfile.findFirst({
      where: { 
        id: req.params.id,
        assignedProfessionalId: professional.id,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        plan: true,
        assignedRoutines: { 
          where: {
            routine: {
              gymId: req.user!.gymId, // Solo rutinas del gym del profesional
              createdBy: {
                role: 'PROFESSIONAL', // Solo rutinas creadas por profesionales
              },
            },
          },
          include: { 
            routine: {
              select: { id: true, name: true, createdAt: true }
            } 
          } 
        },
      },
    });

    // Si no se encontró, buscar a través de Subscription
    if (!client) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          assignedProfessionalId: professional.id,
          status: 'ACTIVE',
          user: {
            clientProfile: {
              id: req.params.id,
            },
          },
        },
        include: {
          user: {
            include: {
              clientProfile: {
                include: {
                  plan: true,
                  assignedRoutines: {
                    where: {
                      routine: {
                        gymId: req.user!.gymId, // Solo rutinas del gym del profesional
                        createdBy: {
                          role: 'PROFESSIONAL', // Solo rutinas creadas por profesionales
                        },
                      },
                    },
                    include: {
                      routine: {
                        select: { id: true, name: true, createdAt: true }
                      }
                    }
                  },
                },
              },
            },
          },
        },
      });

      if (subscription?.user?.clientProfile) {
        client = {
          ...subscription.user.clientProfile,
          user: {
            id: subscription.user.id,
            firstName: subscription.user.firstName,
            lastName: subscription.user.lastName,
            email: subscription.user.email,
            phone: subscription.user.phone,
          },
        } as unknown as typeof client;
      }
    }

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const formattedClient = {
      ...client,
      routines: client.assignedRoutines.map(ar => ar.routine),
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

    // Buscar cliente asignado directamente
    let client = await prisma.clientProfile.findFirst({
      where: { 
        id: req.params.clientId,
        assignedProfessionalId: professional.id,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
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
              clientProfile: {
                include: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      });

      if (subscription?.user?.clientProfile?.id === req.params.clientId) {
        client = subscription.user.clientProfile as unknown as typeof client;
      }
    }

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado o no asignado a ti' });
    }

    const dayAssignments = await prisma.dayRoutineAssignment.findMany({
      where: { 
        clientProfileId: req.params.clientId,
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

    return res.json({ client, weekRoutines, assignments: dayAssignments });
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

    // Buscar cliente asignado directamente
    let client = await prisma.clientProfile.findFirst({
      where: { 
        id: req.params.clientId,
        assignedProfessionalId: professional.id,
      },
    });

    // Si no está asignado directamente, buscar via Subscription
    if (!client) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          assignedProfessionalId: professional.id,
        },
        include: {
          user: {
            include: {
              clientProfile: true,
            },
          },
        },
      });

      if (subscription?.user?.clientProfile?.id === req.params.clientId) {
        client = subscription.user.clientProfile;
      }
    }

    if (!client) {
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
        clientProfileId: req.params.clientId,
        dayOfWeek,
      },
    });

    // Crear asignación
    const assignment = await prisma.dayRoutineAssignment.create({
      data: {
        clientProfileId: req.params.clientId,
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
      },
    });

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

    const client = await prisma.clientProfile.findFirst({
      where: { 
        id: req.params.clientId,
        assignedProfessionalId: professional.id,
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
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
        clientProfileId: req.params.clientId,
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
          clientProfileId: req.params.clientId,
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
        clientProfileId: req.params.clientId,
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

export default router;
