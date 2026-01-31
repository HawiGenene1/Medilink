import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    // Mock initial notifications
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'Low Stock Alert: Paracetamol',
            description: 'Paracetamol stock has fallen below 50 units. Please restock soon.',
            type: 'alert',
            read: false,
            timestamp: new Date().toISOString()
        },
        {
            id: 2,
            title: 'New Order Received',
            description: 'You have received a new order #ORD-2023-005 from Tadesse Girma.',
            type: 'order',
            read: false,
            timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 3,
            title: 'Subscription Renewal',
            description: 'Your Basic Plan subscription will renew in 3 days.',
            type: 'system',
            read: true,
            timestamp: new Date(Date.now() - 86400000).toISOString()
        }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now(),
            read: false,
            timestamp: new Date().toISOString(),
            ...notification
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const value = {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
