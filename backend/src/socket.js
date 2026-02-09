const { Server } = require('socket.io');

let io;
const connectedUsers = new Map(); // Map userId -> socketId

const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Configure this appropriately for production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        // Join a room based on user ID for private messages/notifications
        socket.on('join_user_room', (userId) => {
            socket.join(userId);
            connectedUsers.set(userId, socket.id);
        });

        // Delivery driver updates their location
        socket.on('update_location', (data) => {
            // data: { userId, coordinates: { latitude, longitude }, orderId }
            const { userId, coordinates, orderId } = data;

            // Broadcast to specific order room if provided
            if (orderId) {
                io.to(`order_${orderId}`).emit('driver_location_update', coordinates);
            }

            // Also broadcast to general tracking room for this user
            if (userId) {
                io.to(`tracking_${userId}`).emit('driver_location_update', coordinates);
            }
        });

        // Customer tracking an order/driver
        socket.on('track_order', (orderId) => {
            socket.join(`order_${orderId}`);
        });

        // Driver joining an order room (e.g. for chat or updates)
        socket.on('join_order_room', (orderId) => {
            socket.join(`order_${orderId}`);
        });

        socket.on('disconnect', () => {
            // Remove user from connectedUsers map
            for (const [userId, socketId] of connectedUsers.entries()) {
                if (socketId === socket.id) {
                    connectedUsers.delete(userId);
                    break;
                }
            }
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = {
    init,
    getIo
};
