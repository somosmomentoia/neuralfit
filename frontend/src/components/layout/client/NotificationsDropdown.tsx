'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './NotificationsDropdown.module.css';
import { Bell, Check, Trash2, X, Dumbbell, CreditCard, Gift, Info, AlertCircle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'ROUTINE' | 'SUBSCRIPTION' | 'PAYMENT' | 'BENEFIT' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsDropdown({ isOpen, onClose }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/notifications');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIcon = (type: Notification['type']) => {
    const iconProps = { size: 18 };
    switch (type) {
      case 'ROUTINE':
        return <Dumbbell {...iconProps} />;
      case 'SUBSCRIPTION':
        return <CreditCard {...iconProps} />;
      case 'PAYMENT':
        return <CreditCard {...iconProps} />;
      case 'BENEFIT':
        return <Gift {...iconProps} />;
      case 'SYSTEM':
        return <AlertCircle {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const getIconClass = (type: Notification['type']) => {
    switch (type) {
      case 'ROUTINE':
        return styles.iconRoutine;
      case 'SUBSCRIPTION':
        return styles.iconSubscription;
      case 'PAYMENT':
        return styles.iconPayment;
      case 'BENEFIT':
        return styles.iconBenefit;
      case 'SYSTEM':
        return styles.iconSystem;
      default:
        return styles.iconInfo;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}m`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <div 
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`} 
        onClick={onClose}
      />
      <div className={`${styles.dropdown} ${isOpen ? styles.dropdownOpen : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Bell size={20} />
            <span>Notificaciones</span>
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </div>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className={styles.markAllBtn}>
                <Check size={16} />
                <span>Marcar todas</span>
              </button>
            )}
            <button onClick={onClose} className={styles.closeBtn}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
            </div>
          ) : notifications.length === 0 ? (
            <div className={styles.empty}>
              <Bell size={40} strokeWidth={1.5} />
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <div className={styles.list}>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`${styles.item} ${!notification.isRead ? styles.itemUnread : ''}`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className={`${styles.icon} ${getIconClass(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <span className={styles.itemTitle}>{notification.title}</span>
                      <span className={styles.itemTime}>{formatDate(notification.createdAt)}</span>
                    </div>
                    <p className={styles.itemMessage}>{notification.message}</p>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
