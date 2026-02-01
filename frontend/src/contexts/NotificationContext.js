import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from '../services/api/notifications';
import { message } from 'antd';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Fetch notifications on mount and periodically
    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            fetchNotifications(true); // Silent refresh
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await getNotifications({ limit: 50 });

            if (response.success) {
                // Transform API data to match UI expectations
                const transformedNotifications = response.data.map(notif => ({
                    id: notif._id,
                    title: notif.title,
                    description: notif.message,
                    type: notif.type === 'new_order' ? 'order' :
                        notif.type === 'low_stock' ? 'alert' : 'system',
                    read: notif.isRead,
                    timestamp: notif.createdAt,
                    metadata: notif.metadata
                }));

                setNotifications(transformedNotifications);
                setUnreadCount(response.unreadCount || 0);
            }
        } catch (error) {
            if (!silent) {
                console.error('Error fetching notifications:', error);
                message.error('Failed to load notifications');
            }
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await markNotificationAsRead(id);

            // Update local state
            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            message.error('Failed to mark notification as read');
        }
    };

    const markAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead();

            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            message.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            message.error('Failed to mark all notifications as read');
        }
    };

    const removeNotification = async (id) => {
        try {
            await deleteNotification(id);

            // Update local state
            const notif = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notif && !notif.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
            message.success('Notification deleted');
        } catch (error) {
            console.error('Error deleting notification:', error);
            message.error('Failed to delete notification');
        }
    };

    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now(),
            read: false,
            timestamp: new Date().toISOString(),
            ...notification
        };
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    const value = {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        addNotification,
        removeNotification,
        refreshNotifications: fetchNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
