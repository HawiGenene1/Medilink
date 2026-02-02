<<<<<<< HEAD
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

=======
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { notification } from 'antd';
import MedilinkUI from '../services/MedilinkUI';

const NotificationContext = createContext();

>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
<<<<<<< HEAD

    // Fetch notifications on mount and periodically
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

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
=======
    const { user } = useAuth();
    const socket = useSocket();

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await api.get('/notifications');
            if (response.data.success) {
                setNotifications(response.data.data);
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleNewNotification = (noti) => {
            setNotifications(prev => [noti, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show browser/UI notification based on severity/type
            if (noti.metadata?.isSuccess) {
                MedilinkUI.notify.success(noti.title, noti.message);
            } else {
                MedilinkUI.notify.info(noti.title, noti.message);
            }
        };

        socket.on('new_notification', handleNewNotification);

        return () => {
            socket.off('new_notification', handleNewNotification);
        };
    }, [socket, user]);

    const markAsRead = async (id) => {
        try {
            const response = await api.patch(`/notifications/${id}/read`);
            if (response.data.success) {
                setNotifications(prev =>
                    prev.map(n => n._id === id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            const response = await api.patch('/notifications/read-all');
            if (response.data.success) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            const response = await api.delete(`/notifications/${id}`);
            if (response.data.success) {
                const deletedNoti = notifications.find(n => n._id === id);
                setNotifications(prev => prev.filter(n => n._id !== id));
                if (deletedNoti && !deletedNoti.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            fetchNotifications,
            markAsRead,
            markAllRead,
            deleteNotification
        }}>
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
            {children}
        </NotificationContext.Provider>
    );
};
<<<<<<< HEAD
=======

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
>>>>>>> a66ca820b925672e200b3182594ec5642d8f8df1
