import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  notifySubscriptionExpiring, 
  notifySubscriptionExpired 
} from '../services/notificationService';

const router = Router();

// Clave secreta para proteger el endpoint (configurar en Railway)
const CRON_SECRET = process.env.CRON_SECRET || 'neuralfit-cron-secret-2024';

// Middleware para verificar la clave del cron
const verifyCronSecret = (req: Request, res: Response, next: Function) => {
  const secret = req.headers['x-cron-secret'] || req.query.secret;
  if (secret !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// POST /api/cron/check-subscriptions - Verificar suscripciones por vencer
router.post('/check-subscriptions', verifyCronSecret, async (req: Request, res: Response) => {
  try {
    const prisma: PrismaClient = req.app.get('prisma');
    const now = new Date();
    const results = {
      expiring7Days: 0,
      expiring3Days: 0,
      expiring1Day: 0,
      expired: 0,
    };

    // Calcular fechas límite
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);
    
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);
    
    const in1Day = new Date(now);
    in1Day.setDate(in1Day.getDate() + 1);

    // Buscar suscripciones que vencen en 7 días (notificar una vez)
    const expiring7Days = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(in7Days.setHours(0, 0, 0, 0)),
          lt: new Date(in7Days.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        user: true,
        gym: true,
      },
    });

    for (const sub of expiring7Days) {
      await notifySubscriptionExpiring(sub.userId, 7, sub.gym.name, sub.gymId);
      results.expiring7Days++;
    }

    // Buscar suscripciones que vencen en 3 días
    const expiring3Days = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(in3Days.setHours(0, 0, 0, 0)),
          lt: new Date(in3Days.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        user: true,
        gym: true,
      },
    });

    for (const sub of expiring3Days) {
      await notifySubscriptionExpiring(sub.userId, 3, sub.gym.name, sub.gymId);
      results.expiring3Days++;
    }

    // Buscar suscripciones que vencen mañana
    const expiring1Day = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(in1Day.setHours(0, 0, 0, 0)),
          lt: new Date(in1Day.setHours(23, 59, 59, 999)),
        },
      },
      include: {
        user: true,
        gym: true,
      },
    });

    for (const sub of expiring1Day) {
      await notifySubscriptionExpiring(sub.userId, 1, sub.gym.name, sub.gymId);
      results.expiring1Day++;
    }

    // Buscar suscripciones que vencieron hoy y marcarlas como expiradas
    const expiredToday = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: now,
        },
      },
      include: {
        user: true,
        gym: true,
      },
    });

    for (const sub of expiredToday) {
      // Actualizar estado a EXPIRED
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });
      
      // Notificar al usuario
      await notifySubscriptionExpired(sub.userId, sub.gym.name, sub.gymId);
      results.expired++;
    }

    console.log('🔔 Cron check-subscriptions completed:', results);
    return res.json({ success: true, results });
  } catch (error) {
    console.error('Error in check-subscriptions cron:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/cron/health - Health check para el cron
router.get('/health', (req: Request, res: Response) => {
  return res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
