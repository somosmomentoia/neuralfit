import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { 
  notifySubscriptionExpiring, 
  notifySubscriptionExpired 
} from '../services/notificationService';

const prisma = new PrismaClient();

async function checkSubscriptions() {
  console.log('🔔 Running subscription check cron job...');
  
  try {
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

    // Buscar suscripciones que vencen en 7 días
    const expiring7Days = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: new Date(new Date(in7Days).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(in7Days).setHours(23, 59, 59, 999)),
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
          gte: new Date(new Date(in3Days).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(in3Days).setHours(23, 59, 59, 999)),
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
          gte: new Date(new Date(in1Day).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(in1Day).setHours(23, 59, 59, 999)),
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

    // Buscar suscripciones que vencieron y marcarlas como expiradas
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

    console.log('✅ Subscription check completed:', results);
  } catch (error) {
    console.error('❌ Error in subscription cron:', error);
  }
}

export function startSubscriptionCron() {
  // Ejecutar todos los días a las 9:00 AM (hora del servidor)
  cron.schedule('0 9 * * *', () => {
    checkSubscriptions();
  });

  console.log('📅 Subscription cron job scheduled (daily at 9:00 AM)');
}

// Exportar para poder ejecutar manualmente si es necesario
export { checkSubscriptions };
