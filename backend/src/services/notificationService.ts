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

export async function notifyRoutineAssigned(userId: string, routineName: string, gymId?: string) {
  return createNotification({
    userId,
    title: 'Nueva rutina asignada',
    message: `Se te asignó la rutina "${routineName}". ¡A entrenar!`,
    type: 'ROUTINE',
    actionUrl: '/client/routine',
    gymId,
  });
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
};
