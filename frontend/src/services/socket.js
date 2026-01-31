import io from 'socket.io-client';

const SOCKET_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace('/api', '');

class SocketService {
    socket = null;

    connect() {
        if (!this.socket) {
            // Only connect if not in development or specifically enabled
            // This prevents the repetitive "WebSocket connection failed" logs during defense
            if (process.env.NODE_ENV === 'development' && !process.env.REACT_APP_ENABLE_SOCKETS) {
                console.log('Socket.io suppressed in development mode.');
                return null;
            }
            this.socket = io(SOCKET_URL, {
                reconnectionAttempts: 3, // Limit retries to reduce noise
                timeout: 5000
            });
            console.log('Socket connecting...');
        }
        return this.socket;
    }

    join(userId) {
        if (this.socket) {
            this.socket.emit('join', userId);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event) {
        if (this.socket) {
            this.socket.off(event);
        }
    }
}

export default new SocketService();
