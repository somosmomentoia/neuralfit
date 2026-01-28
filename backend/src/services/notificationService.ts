import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type NotificationType = 'INFO' | 'ROUTINE' | 'SUBSCRIPTION' | 'PAYMENT' | 'BENEFIT' | 'SYSTEM';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  actionUrl?: string;
  gymId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        actionUrl: params.actionUrl,
        gymId: params.gymId,
      },
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export async function notifyRoutineAssigned(userId: string, routineName: string, dayName: string, gymId?: string) {
  try {
    // Buscar si ya existe una notificación de esta rutina para este usuario
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId,
        type: 'ROUTINE',
        title: {
          contains: routineName,
        },
        createdAt: {
          // Solo buscar notificaciones de los últimos 7 días
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingNotification) {
      // Actualizar la notificación existente agregando el nuevo día
      const currentMessage = existingNotification.message;
      const daysMatch = currentMessage.match(/para los días: (.+)\./);
      
      let days: string[];
      if (daysMatch) {
        days = daysMatch[1].split(', ');
        if (!days.includes(dayName)) {
          days.push(dayName);
        }
      } else {
        // Es una notificación vieja con formato anterior, extraer el día si existe
        days = [dayName];
      }

      const updatedMessage = `Se te asignó la rutina "${routineName}" para los días: ${days.join(', ')}. ¡A entrenar!`;
      
      await prisma.notification.update({
        where: { id: existingNotification.id },
        data: {
          message: updatedMessage,
          isRead: false, // Marcar como no leída para que el usuario la vea
          createdAt: new Date(), // Actualizar fecha para que aparezca arriba
        },
      });
      
      return existingNotification;
    }

    // Si no existe, crear una nueva
    return createNotification({
      userId,
      title: `Rutina: ${routineName}`,
      message: `Se te asignó la rutina "${routineName}" para los días: ${dayName}. ¡A entrenar!`,
      type: 'ROUTINE',
      actionUrl: '/client/routines',
      gymId,
    });
  } catch (error) {
    console.error('Error in notifyRoutineAssigned:', error);
    return null;
  }
}

export async function notifySubscriptionExpiring(userId: string, daysLeft: number, gymName: string, gymId?: string) {
  return createNotification({
    userId,
    title: 'Tu suscripción está por vencer',
    message: `Tu suscripción en ${gymName} vence en ${daysLeft} día${daysLeft > 1 ? 's' : ''}. Renová para seguir entrenando.`,
    type: 'SUBSCRIPTION',
    actionUrl: '/client/plan',
    gymId,
  });
}

export async function notifySubscriptionExpired(userId: string, gymName: string, gymId?: string) {
  return createNotification({
    userId,
    title: 'Tu suscripción venció',
    message: `Tu suscripción en ${gymName} ha vencido. Renová para seguir disfrutando de los beneficios.`,
    type: 'SUBSCRIPTION',
    actionUrl: '/client/plan',
    gymId,
  });
}

export async function notifySubscriptionRenewed(userId: string, gymName: string, endDate: Date, gymId?: string) {
  const formattedDate = endDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
  return createNotification({
    userId,
    title: 'Suscripción renovada',
    message: `Tu suscripción en ${gymName} fue renovada hasta el ${formattedDate}.`,
    type: 'SUBSCRIPTION',
    actionUrl: '/client/plan',
    gymId,
  });
}

export async function notifyPaymentReceived(userId: string, amount: number, gymName: string, gymId?: string) {
  return createNotification({
    userId,
    title: 'Pago recibido',
    message: `Recibimos tu pago de $${amount.toLocaleString('es-AR')} en ${gymName}. ¡Gracias!`,
    type: 'PAYMENT',
    actionUrl: '/client/plan',
    gymId,
  });
}

export async function notifyNewBenefit(userId: string, benefitName: string, discount: string, gymId?: string) {
  return createNotification({
    userId,
    title: 'Nuevo beneficio disponible',
    message: `${benefitName} - ${discount}. ¡Aprovechá este beneficio exclusivo!`,
    type: 'BENEFIT',
    actionUrl: '/client/benefits',
    gymId,
  });
}

export async function notifyWelcome(userId: string, gymName: string, gymId?: string) {
  return createNotification({
    userId,
    title: `¡Bienvenido a ${gymName}!`,
    message: 'Tu cuenta está lista. Explorá tus rutinas, beneficios y más.',
    type: 'INFO',
    actionUrl: '/client',
    gymId,
  });
}

export async function notifySystemMessage(userId: string, title: string, message: string) {
  return createNotification({
    userId,
    title,
    message,
    type: 'SYSTEM',
  });
}

export async function notifyInactivity(userId: string, daysSinceLastWorkout: number, gymId?: string) {
  try {
    // Buscar si ya existe una notificación de inactividad reciente (últimos 3 días)
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId,
        type: 'ROUTINE',
        title: '¿Te extrañamos!',
        createdAt: {
          gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingNotification) {
      // Actualizar la notificación existente en vez de crear una nueva
      const message = daysSinceLastWorkout >= 14
        ? `Hace ${daysSinceLastWorkout} días que no entrenás. ¡Volvé a la rutina!`
        : daysSinceLastWorkout >= 7
        ? `Pasó más de una semana desde tu último entrenamiento. ¡No pierdas el ritmo!`
        : `Hace ${daysSinceLastWorkout} días que no entrenás. ¡Hoy es un buen día para volver!`;

      await prisma.notification.update({
        where: { id: existingNotification.id },
        data: {
          message,
          isRead: false,
          createdAt: new Date(),
        },
      });
      
      return existingNotification;
    }

    // Crear nueva notificación
    const message = daysSinceLastWorkout >= 14
      ? `Hace ${daysSinceLastWorkout} días que no entrenás. ¡Volvé a la rutina!`
      : daysSinceLastWorkout >= 7
      ? `Pasó más de una semana desde tu último entrenamiento. ¡No pierdas el ritmo!`
      : `Hace ${daysSinceLastWorkout} días que no entrenás. ¡Hoy es un buen día para volver!`;

    return createNotification({
      userId,
      title: '¿Te extrañamos!',
      message,
      type: 'ROUTINE',
      actionUrl: '/client/routines',
      gymId,
    });
  } catch (error) {
    console.error('Error in notifyInactivity:', error);
    return null;
  }
}

export default {
  createNotification,
  notifyRoutineAssigned,
  notifySubscriptionExpiring,
  notifySubscriptionExpired,
  notifySubscriptionRenewed,
  notifyPaymentReceived,
  notifyNewBenefit,
  notifyWelcome,
  notifySystemMessage,
  notifyInactivity,
};
