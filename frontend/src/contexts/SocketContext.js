import React, { createContext, useRef, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const socket = useRef(null);
    const { user } = useAuth(); // Get current user to join room

    useEffect(() => {
        // Initialize socket connection
        socket.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

        socket.current.on('connect', () => {
            if (user) {
                socket.current.emit('join_user_room', user.id || user._id);
            }
        });

        return () => {
            if (socket.current) {
                socket.current.disconnect();
            }
        };
    }, [user]);

    // Provide the socket instance
    return (
        <SocketContext.Provider value={socket.current}>
            {children}
        </SocketContext.Provider>
    );
};
