import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authMiddleware);
router.use(requireRole('ADMIN'));

// ============ GYM CONFIG ============

// GET /api/admin/gym - Obtener configuración del gym
router.get('/gym', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const gym = await prisma.gym.findUnique({
      where: { id: req.user!.gymId! },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        isPublic: true,
        mpAccessToken: true,
        mpPublicKey: true,
        mpUserId: true,
      },
    });

    if (!gym) {
      return res.status(404).json({ error: 'Gimnasio no encontrado' });
    }

    // Ocultar el access token completo, solo mostrar si está configurado
    return res.json({ 
      gym: {
        ...gym,
        mpAccessToken: gym.mpAccessToken ? '••••••••' + gym.mpAccessToken.slice(-8) : null,
        hasMpConfigured: !!gym.mpAccessToken,
      }
    });
  } catch (error) {
    console.error('Error fetching gym:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/gym - Actualizar configuración del gym
router.put('/gym', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, logo, isPublic } = req.body;

    const gym = await prisma.gym.update({
      where: { id: req.user!.gymId! },
      data: {
        name: name || undefined,
        description: description !== undefined ? description : undefined,
        logo: logo !== undefined ? logo : undefined,
        isPublic: isPublic !== undefined ? isPublic : undefined,
      },
    });

    return res.json({ gym, message: 'Configuración actualizada' });
  } catch (error) {
    console.error('Error updating gym:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/gym/mercadopago - Configurar MercadoPago
router.put('/gym/mercadopago', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { accessToken, publicKey } = req.body;

    if (!accessToken || !publicKey) {
      return res.status(400).json({ error: 'Access Token y Public Key son requeridos' });
    }

    // En producción, aquí validaríamos las credenciales con la API de MP
    const gym = await prisma.gym.update({
      where: { id: req.user!.gymId! },
      data: {
        mpAccessToken: accessToken,
        mpPublicKey: publicKey,
      },
    });

    return res.json({ 
      success: true, 
      message: 'MercadoPago configurado correctamente',
      hasMpConfigured: true,
    });
  } catch (error) {
    console.error('Error configuring MercadoPago:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ LEADS ============

// GET /api/admin/leads
router.get('/leads', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const leads = await prisma.lead.findMany({
      where: { gymId: req.user!.gymId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/leads
router.post('/leads', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { firstName, lastName, email, phone, source, notes } = req.body;

    const lead = await prisma.lead.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        source,
        notes,
        gymId: req.user!.gymId,
      },
    });

    return res.status(201).json({ lead });
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/leads/:id
router.get('/leads/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, gymId: req.user!.gymId },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    return res.json({ lead });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/leads/:id
router.put('/leads/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { firstName, lastName, email, phone, source, notes, status } = req.body;

    const lead = await prisma.lead.updateMany({
      where: { id: req.params.id, gymId: req.user!.gymId },
      data: { firstName, lastName, email, phone, source, notes, status },
    });

    return res.json({ success: lead.count > 0 });
  } catch (error) {
    console.error('Error updating lead:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/admin/leads/:id
router.delete('/leads/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    const result = await prisma.lead.deleteMany({
      where: { id: req.params.id, gymId: req.user!.gymId },
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/leads/:id/convert
router.post('/leads/:id/convert', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { planId, password } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id: req.params.id, gymId: req.user!.gymId },
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Obtener el plan para calcular fechas
    let plan = null;
    if (planId) {
      plan = await prisma.plan.findUnique({ where: { id: planId } });
    }

    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date(subscriptionStartDate);
    if (plan) {
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + plan.durationDays);
    } else {
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30);
    }

    const user = await prisma.user.create({
      data: {
        email: lead.email,
        passwordHash: hashedPassword,
        firstName: lead.firstName,
        lastName: lead.lastName,
        phone: lead.phone,
        role: 'CLIENT',
        gymId: req.user!.gymId,
        clientProfile: {
          create: {
            planId,
            subscriptionStatus: 'ACTIVE',
          },
        },
        subscriptions: {
          create: {
            gymId: req.user!.gymId,
            planId: planId || null,
            status: 'ACTIVE',
            type: 'MONTHLY',
            source: 'LEAD_CONVERSION',
            startDate: subscriptionStartDate,
            endDate: subscriptionEndDate,
            autoRenew: false,
          },
        },
      },
    });

    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'CONVERTED', convertedUserId: user.id },
    });

    return res.json({ success: true, userId: user.id });
  } catch (error) {
    console.error('Error converting lead:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ CLIENTS ============

// GET /api/admin/clients
router.get('/clients', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const adminGymId = req.user!.gymId;
    
    // Buscar suscripciones de este gym y traer los usuarios
    const subscriptions = await prisma.subscription.findMany({
      where: { gymId: adminGymId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
        plan: true,
        assignedProfessional: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Formatear para compatibilidad con frontend
    const clients = subscriptions.map(sub => ({
      id: sub.user.id,
      firstName: sub.user.firstName,
      lastName: sub.user.lastName,
      email: sub.user.email,
      phone: sub.user.phone,
      avatar: sub.user.avatar,
      isActive: sub.user.isActive,
      createdAt: sub.user.createdAt,
      // Datos de la suscripción en este gym
      subscription: {
        id: sub.id,
        status: sub.status,
        plan: sub.plan,
        assignedProfessional: sub.assignedProfessional,
      },
      // Compatibilidad legacy
      clientProfile: {
        subscriptionStatus: sub.status,
        plan: sub.plan,
      },
    }));

    return res.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/clients - Create client directly
router.post('/clients', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { 
      email, password, firstName, lastName, phone, 
      planId, assignedProfessionalId, startDate, 
      specialConsiderations 
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Obtener el plan para calcular la fecha de fin
    let plan = null;
    if (planId) {
      plan = await prisma.plan.findUnique({ where: { id: planId } });
    }

    const subscriptionStartDate = startDate ? new Date(startDate) : new Date();
    const subscriptionEndDate = new Date(subscriptionStartDate);
    if (plan) {
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + plan.durationDays);
    } else {
      subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30); // Default 30 días
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
            assignedProfessionalId: assignedProfessionalId || null,
            startDate: subscriptionStartDate,
            specialConsiderations: specialConsiderations || null,
            subscriptionStatus: 'ACTIVE',
          },
        },
        // Crear suscripción en el nuevo modelo
        subscriptions: {
          create: {
            gymId: req.user!.gymId,
            planId: planId || null,
            status: 'ACTIVE',
            type: 'MONTHLY',
            source: 'ADMIN_GRANTED',
            startDate: subscriptionStartDate,
            endDate: subscriptionEndDate,
            autoRenew: false, // Las otorgadas por admin no se renuevan automáticamente
            assignedProfessionalId: assignedProfessionalId || null,
          },
        },
      },
      include: { 
        clientProfile: { 
          include: { 
            plan: true,
            assignedProfessional: {
              include: { user: true }
            }
          } 
        },
        subscriptions: {
          include: { plan: true, gym: true }
        }
      },
    });

    return res.status(201).json({ client: user, tempPassword: password });
  } catch (error) {
    console.error('Error creating client:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/clients/:id
router.get('/clients/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const clientId = req.params.id;
    const adminGymId = req.user!.gymId;

    // Buscar el usuario y su suscripción en este gym
    const user = await prisma.user.findFirst({
      where: { id: clientId, role: 'CLIENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        subscriptions: {
          where: { gymId: adminGymId },
          include: {
            plan: true,
            assignedProfessional: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
            dayRoutineAssignments: {
              include: { routine: true },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Verificar que tenga suscripción en este gym
    const subscription = user.subscriptions[0];
    if (!subscription) {
      return res.status(404).json({ error: 'El cliente no tiene suscripción en este gimnasio' });
    }

    // Formatear respuesta compatible con el frontend actual
    const client = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.isActive,
      createdAt: user.createdAt,
      // Datos específicos de este gym (desde Subscription)
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        plan: subscription.plan,
        assignedProfessional: subscription.assignedProfessional,
        specialConsiderations: subscription.specialConsiderations,
        notes: subscription.notes,
        medicalClearanceUrl: subscription.medicalClearanceUrl,
        assignedRoutines: subscription.dayRoutineAssignments,
      },
    };

    return res.json({ client });
  } catch (error) {
    console.error('Error fetching client:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/clients/:id
router.put('/clients/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const adminGymId = req.user!.gymId;
    const { status, planId, assignedProfessionalId, specialConsiderations, notes } = req.body;

    // Buscar la suscripción del cliente en este gym
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.params.id, gymId: adminGymId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'El cliente no tiene suscripción en este gimnasio' });
    }

    // Actualizar la suscripción
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: status || undefined,
        planId: planId || null,
        assignedProfessionalId: assignedProfessionalId || null,
        specialConsiderations: specialConsiderations ?? subscription.specialConsiderations,
        notes: notes ?? subscription.notes,
      },
      include: {
        plan: true,
        assignedProfessional: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        dayRoutineAssignments: {
          include: { routine: true },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    // También actualizar el ClientProfile para mantener sincronizado
    if (assignedProfessionalId !== undefined) {
      await prisma.clientProfile.updateMany({
        where: { userId: req.params.id },
        data: { assignedProfessionalId: assignedProfessionalId || null },
      });
    }

    // Formatear respuesta
    const client = {
      ...updatedSubscription.user,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        startDate: updatedSubscription.startDate,
        endDate: updatedSubscription.endDate,
        plan: updatedSubscription.plan,
        assignedProfessional: updatedSubscription.assignedProfessional,
        specialConsiderations: updatedSubscription.specialConsiderations,
        notes: updatedSubscription.notes,
        medicalClearanceUrl: updatedSubscription.medicalClearanceUrl,
        assignedRoutines: updatedSubscription.dayRoutineAssignments,
      },
    };

    return res.json({ client });
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/admin/clients/:id/medical-clearance - Actualizar apto médico
router.patch('/clients/:id/medical-clearance', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const adminGymId = req.user!.gymId;
    const { medicalClearanceUrl } = req.body;

    // Buscar la suscripción del cliente en este gym
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.params.id, gymId: adminGymId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'El cliente no tiene suscripción en este gimnasio' });
    }

    // Actualizar el apto médico en la suscripción
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { medicalClearanceUrl },
    });

    return res.json({ 
      success: true, 
      medicalClearanceUrl: updatedSubscription.medicalClearanceUrl 
    });
  } catch (error) {
    console.error('Error updating medical clearance:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/admin/clients/:id/status - Toggle client active status
router.patch('/clients/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const adminGymId = req.user!.gymId;
    const { isActive, status } = req.body;

    // Buscar la suscripción del cliente en este gym
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.params.id, gymId: adminGymId },
      include: { user: true },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'El cliente no tiene suscripción en este gimnasio' });
    }

    // Update user active status si se proporciona
    if (isActive !== undefined) {
      await prisma.user.update({
        where: { id: subscription.userId },
        data: { isActive },
      });
    }

    // Update subscription status si se proporciona
    if (status) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status },
      });
    }

    // Obtener datos actualizados
    const updatedSubscription = await prisma.subscription.findFirst({
      where: { id: subscription.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            isActive: true,
            createdAt: true,
          },
        },
        plan: true,
        assignedProfessional: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    const client = {
      ...updatedSubscription!.user,
      subscription: {
        id: updatedSubscription!.id,
        status: updatedSubscription!.status,
        plan: updatedSubscription!.plan,
        assignedProfessional: updatedSubscription!.assignedProfessional,
      },
    };

    return res.json({ client });
  } catch (error) {
    console.error('Error updating client status:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ PAYMENTS ============

// GET /api/admin/payments - Get all payments
router.get('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const payments = await prisma.payment.findMany({
      where: {
        clientProfile: {
          user: { gymId: req.user!.gymId },
        },
      },
      include: {
        clientProfile: {
          include: {
            user: true,
            plan: true,
          },
        },
        invoice: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/payments - Register manual payment
router.post('/payments', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { clientProfileId, amount, method, reference, notes } = req.body;

    const payment = await prisma.payment.create({
      data: {
        clientProfileId,
        amount,
        method: method || 'manual',
        reference,
        notes,
      },
      include: {
        clientProfile: {
          include: { user: true, plan: true },
        },
      },
    });

    return res.status(201).json({ payment });
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ PROFESSIONALS ============

// GET /api/admin/professionals
router.get('/professionals', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const professionals = await prisma.user.findMany({
      where: { gymId: req.user!.gymId, role: 'PROFESSIONAL' },
      include: {
        professionalProfile: {
          include: {
            _count: { select: { assignedClients: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ professionals });
  } catch (error) {
    console.error('Error fetching professionals:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/professionals/:id
router.get('/professionals/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const professional = await prisma.user.findFirst({
      where: { id: req.params.id, gymId: req.user!.gymId, role: 'PROFESSIONAL' },
      include: {
        professionalProfile: {
          include: {
            assignedClients: {
              include: {
                user: true,
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!professional) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    return res.json({ professional });
  } catch (error) {
    console.error('Error fetching professional:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/professionals
router.post('/professionals', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { email, password, firstName, lastName, phone, specialty } = req.body;

    // Validaciones
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Email, contraseña, nombre y apellido son requeridos' });
    }

    if (!req.user!.gymId) {
      return res.status(400).json({ error: 'No tienes un gimnasio asignado' });
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: 'PROFESSIONAL',
        gymId: req.user!.gymId,
        professionalProfile: {
          create: { specialty: specialty || null },
        },
      },
      include: { professionalProfile: true },
    });

    return res.status(201).json({ professional: user });
  } catch (error) {
    console.error('Error creating professional:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ EXERCISES ============

// GET /api/admin/exercises
router.get('/exercises', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const exercises = await prisma.exercise.findMany({
      where: { gymId: req.user!.gymId },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ exercises });
  } catch (error) {
    console.error('Error fetching exercises:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/exercises/:id - Obtener ejercicio por ID
router.get('/exercises/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const exercise = await prisma.exercise.findFirst({
      where: { id: req.params.id, gymId: req.user!.gymId },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
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

// POST /api/admin/exercises - Crear ejercicio (aprobado automáticamente)
router.post('/exercises', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, muscleGroup, category, difficulty, description, videoUrl } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Nombre y categoría son requeridos' });
    }

    const exercise = await prisma.exercise.create({
      data: {
        name,
        muscleGroup: muscleGroup || null,
        category,
        difficulty: difficulty || 3,
        description: description || null,
        videoUrl: videoUrl || null,
        status: 'APPROVED',
        gymId: req.user!.gymId,
        createdById: req.user!.id,
      },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return res.status(201).json({ exercise });
  } catch (error) {
    console.error('Error creating exercise:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/exercises/:id - Actualizar ejercicio
router.put('/exercises/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, muscleGroup, category, difficulty, description, videoUrl } = req.body;

    const exercise = await prisma.exercise.update({
      where: { id: req.params.id, gymId: req.user!.gymId },
      data: {
        name,
        muscleGroup: muscleGroup || null,
        category,
        difficulty: difficulty || 3,
        description: description || null,
        videoUrl: videoUrl || null,
      },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    return res.json({ exercise });
  } catch (error) {
    console.error('Error updating exercise:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/exercises/:id/approve
router.post('/exercises/:id/approve', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const exercise = await prisma.exercise.update({
      where: { id: req.params.id, gymId: req.user!.gymId },
      data: { status: 'APPROVED' },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
    return res.json({ success: true, exercise });
  } catch (error) {
    console.error('Error approving exercise:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/exercises/:id/reject
router.post('/exercises/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const exercise = await prisma.exercise.update({
      where: { id: req.params.id, gymId: req.user!.gymId },
      data: { status: 'REJECTED' },
      include: { createdBy: { select: { firstName: true, lastName: true } } },
    });
    return res.json({ success: true, exercise });
  } catch (error) {
    console.error('Error rejecting exercise:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/exercises/pending - Obtener ejercicios pendientes de aprobación
router.get('/exercises/pending', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const exercises = await prisma.exercise.findMany({
      where: { gymId: req.user!.gymId, status: 'PENDING' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ exercises });
  } catch (error) {
    console.error('Error fetching pending exercises:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ ROUTINES ============

// GET /api/admin/routines
router.get('/routines', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const routines = await prisma.routine.findMany({
      where: { gymId: req.user!.gymId },
      include: {
        createdBy: { select: { firstName: true, lastName: true } },
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

// GET /api/admin/routines/:id - Detalle de rutina
router.get('/routines/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const routine = await prisma.routine.findFirst({
      where: { id: req.params.id, gymId: req.user!.gymId },
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

// ============ PLANS ============

// GET /api/admin/plans
router.get('/plans', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const plans = await prisma.plan.findMany({
      where: { gymId: req.user!.gymId },
      include: {
        features: {
          include: { feature: true },
        },
        _count: { select: { clients: true } },
      },
      orderBy: { price: 'asc' },
    });
    return res.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/plans
router.post('/plans', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, price, durationDays, featureIds } = req.body;

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        price,
        durationDays,
        gymId: req.user!.gymId,
      },
    });

    // Assign features if provided
    if (featureIds && featureIds.length > 0) {
      await prisma.planFeatureAssignment.createMany({
        data: featureIds.map((featureId: string) => ({
          planId: plan.id,
          featureId,
        })),
      });
    }

    const planWithFeatures = await prisma.plan.findUnique({
      where: { id: plan.id },
      include: {
        features: { include: { feature: true } },
        _count: { select: { clients: true } },
      },
    });

    return res.status(201).json({ plan: planWithFeatures });
  } catch (error) {
    console.error('Error creating plan:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/plans/:id
router.put('/plans/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, price, durationDays, isActive, featureIds } = req.body;

    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        price,
        durationDays,
        isActive,
      },
    });

    // Update features if provided
    if (featureIds !== undefined) {
      // Remove existing assignments
      await prisma.planFeatureAssignment.deleteMany({
        where: { planId: plan.id },
      });

      // Add new assignments
      if (featureIds.length > 0) {
        await prisma.planFeatureAssignment.createMany({
          data: featureIds.map((featureId: string) => ({
            planId: plan.id,
            featureId,
          })),
        });
      }
    }

    const planWithFeatures = await prisma.plan.findUnique({
      where: { id: plan.id },
      include: {
        features: { include: { feature: true } },
        _count: { select: { clients: true } },
      },
    });

    return res.json({ plan: planWithFeatures });
  } catch (error) {
    console.error('Error updating plan:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/admin/plans/:id
router.delete('/plans/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    
    // Check if plan has clients
    const plan = await prisma.plan.findFirst({
      where: { id: req.params.id, gymId: req.user!.gymId },
      include: { _count: { select: { clients: true } } },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    if (plan._count.clients > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un plan con clientes asignados' });
    }

    await prisma.plan.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ PLAN FEATURES ============

// GET /api/admin/plan-features
router.get('/plan-features', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const features = await prisma.planFeature.findMany({
      where: { gymId: req.user!.gymId },
      orderBy: { name: 'asc' },
    });
    return res.json({ features });
  } catch (error) {
    console.error('Error fetching plan features:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/plan-features
router.post('/plan-features', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, icon } = req.body;

    const feature = await prisma.planFeature.create({
      data: {
        name,
        description,
        icon,
        gymId: req.user!.gymId,
      },
    });

    return res.status(201).json({ feature });
  } catch (error) {
    console.error('Error creating plan feature:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/plan-features/:id
router.put('/plan-features/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, icon } = req.body;

    const feature = await prisma.planFeature.update({
      where: { id: req.params.id },
      data: { name, description, icon },
    });

    return res.json({ feature });
  } catch (error) {
    console.error('Error updating plan feature:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/admin/plan-features/:id
router.delete('/plan-features/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    await prisma.planFeature.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan feature:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ BRANCHES (SUCURSALES) ============

// GET /api/admin/branches
router.get('/branches', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const branches = await prisma.branch.findMany({
      where: { gymId: req.user!.gymId },
      orderBy: { name: 'asc' },
    });
    return res.json({ branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/branches
router.post('/branches', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { 
      name, address, phone, googleMapsUrl, googleMapsEmbed,
      openTime, closeTime, scheduleNotes,
      hasParking, is24Hours, hasContinuousSchedule, hasAirConditioning,
      hasShowers, hasLockers, hasWifi
    } = req.body;

    const branch = await prisma.branch.create({
      data: {
        name,
        address,
        phone,
        googleMapsUrl,
        googleMapsEmbed,
        openTime,
        closeTime,
        scheduleNotes,
        hasParking,
        is24Hours,
        hasContinuousSchedule,
        hasAirConditioning,
        hasShowers,
        hasLockers,
        hasWifi,
        gymId: req.user!.gymId,
      },
    });

    return res.status(201).json({ branch });
  } catch (error) {
    console.error('Error creating branch:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/branches/:id
router.put('/branches/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { 
      name, address, phone, googleMapsUrl, googleMapsEmbed, isActive,
      openTime, closeTime, scheduleNotes,
      hasParking, is24Hours, hasContinuousSchedule, hasAirConditioning,
      hasShowers, hasLockers, hasWifi
    } = req.body;

    const branch = await prisma.branch.update({
      where: { id: req.params.id },
      data: { 
        name, address, phone, googleMapsUrl, googleMapsEmbed, isActive,
        openTime, closeTime, scheduleNotes,
        hasParking, is24Hours, hasContinuousSchedule, hasAirConditioning,
        hasShowers, hasLockers, hasWifi
      },
    });

    return res.json({ branch });
  } catch (error) {
    console.error('Error updating branch:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/admin/branches/:id
router.delete('/branches/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    await prisma.branch.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting branch:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ============ BENEFITS (BENEFICIOS EXCLUSIVOS) ============

// GET /api/admin/benefits
router.get('/benefits', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const benefits = await prisma.benefit.findMany({
      where: { gym: { id: req.user!.gymId } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ benefits });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/benefits
router.post('/benefits', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, discount, imageUrl, websiteUrl, validUntil } = req.body;

    if (!name || !discount) {
      return res.status(400).json({ error: 'Nombre y descuento son requeridos' });
    }

    const benefit = await prisma.benefit.create({
      data: {
        name,
        description,
        discount,
        imageUrl,
        websiteUrl,
        validUntil: validUntil ? new Date(validUntil) : null,
        gymId: req.user!.gymId,
      },
    });

    return res.status(201).json({ benefit });
  } catch (error) {
    console.error('Error creating benefit:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/benefits/:id
router.put('/benefits/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { name, description, discount, imageUrl, websiteUrl, validUntil, isActive } = req.body;

    const benefit = await prisma.benefit.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        discount,
        imageUrl,
        websiteUrl,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive,
      },
    });

    return res.json({ benefit });
  } catch (error) {
    console.error('Error updating benefit:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/admin/benefits/:id
router.delete('/benefits/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    await prisma.benefit.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting benefit:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ==================== SUSCRIPCIONES ====================

// GET /api/admin/subscriptions - Listar suscripciones del gym
router.get('/subscriptions', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { status, search } = req.query;

    const where: Record<string, unknown> = { gymId: req.user!.gymId };
    
    if (status && status !== 'all') {
      where.status = status;
    }

    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        plan: true,
        assignedProfessional: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filtrar por búsqueda si se proporciona
    let filtered = subscriptions;
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filtered = subscriptions.filter(s => 
        s.user.firstName.toLowerCase().includes(searchLower) ||
        s.user.lastName.toLowerCase().includes(searchLower) ||
        s.user.email.toLowerCase().includes(searchLower)
      );
    }

    return res.json({ subscriptions: filtered });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/subscriptions/recent - Suscripciones recientes para dashboard
router.get('/subscriptions/recent', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const recentSubscriptions = await prisma.subscription.findMany({
      where: { 
        gymId: req.user!.gymId,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        plan: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Limitar a 10 para el dashboard
    });

    return res.json({ subscriptions: recentSubscriptions });
  } catch (error) {
    console.error('Error fetching recent subscriptions:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/admin/subscriptions/stats - Estadísticas de suscripciones
router.get('/subscriptions/stats', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');

    const [total, active, pending, expired, cancelled] = await Promise.all([
      prisma.subscription.count({ where: { gymId: req.user!.gymId } }),
      prisma.subscription.count({ where: { gymId: req.user!.gymId, status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { gymId: req.user!.gymId, status: 'PENDING' } }),
      prisma.subscription.count({ where: { gymId: req.user!.gymId, status: 'EXPIRED' } }),
      prisma.subscription.count({ where: { gymId: req.user!.gymId, status: 'CANCELLED' } }),
    ]);

    return res.json({
      stats: { total, active, pending, expired, cancelled },
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/subscriptions/:id - Actualizar suscripción
router.put('/subscriptions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { status, planId, endDate, assignedProfessionalId } = req.body;

    // Verificar que la suscripción pertenece al gym
    const existing = await prisma.subscription.findFirst({
      where: { id: req.params.id, gymId: req.user!.gymId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    const subscription = await prisma.subscription.update({
      where: { id: req.params.id },
      data: {
        status,
        planId,
        endDate: endDate ? new Date(endDate) : undefined,
        assignedProfessionalId,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        plan: true,
      },
    });

    // Sincronizar assignedProfessionalId en ClientProfile
    if (assignedProfessionalId !== undefined) {
      await prisma.clientProfile.updateMany({
        where: { userId: existing.userId },
        data: { assignedProfessionalId: assignedProfessionalId || null },
      });
    }

    return res.json({ subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/subscriptions/:id/activate - Activar suscripción y asignar entrenador
router.put('/subscriptions/:id/activate', async (req: AuthRequest, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const { assignedProfessionalId } = req.body;

    const existing = await prisma.subscription.findFirst({
      where: { id: req.params.id, gymId: req.user!.gymId },
      include: { plan: true, user: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Suscripción no encontrada' });
    }

    // Calcular fecha de fin basada en el plan
    let endDate = new Date();
    if (existing.plan) {
      endDate.setDate(endDate.getDate() + existing.plan.durationDays);
    } else {
      endDate.setDate(endDate.getDate() + 30); // Default 30 días
    }

    // Actualizar la suscripción
    const subscription = await prisma.subscription.update({
      where: { id: req.params.id },
      data: {
        status: 'ACTIVE',
        startDate: new Date(),
        endDate,
        assignedProfessionalId: assignedProfessionalId || undefined,
      },
      include: {
        user: true,
        plan: true,
        gym: true,
      },
    });

    // Actualizar o crear el clientProfile del usuario
    await prisma.clientProfile.upsert({
      where: { userId: existing.userId },
      update: {
        subscriptionStatus: 'ACTIVE',
        planId: existing.planId,
        assignedProfessionalId: assignedProfessionalId || undefined,
        startDate: new Date(),
      },
      create: {
        userId: existing.userId,
        subscriptionStatus: 'ACTIVE',
        planId: existing.planId,
        assignedProfessionalId: assignedProfessionalId || null,
        startDate: new Date(),
      },
    });

    // Si el usuario no tiene gymId, asignarlo a este gym
    if (!existing.user.gymId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { gymId: req.user!.gymId },
      });
    }

    return res.json({ subscription });
  } catch (error) {
    console.error('Error activating subscription:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
