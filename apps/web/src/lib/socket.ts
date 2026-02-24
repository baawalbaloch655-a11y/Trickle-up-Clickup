import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { create } from 'zustand';

interface SocketState {
    isConnected: boolean;
    setConnected: (state: boolean) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
    isConnected: false,
    setConnected: (isConnected) => set({ isConnected }),
}));

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
    if (!socket) {
        const { accessToken } = useAuthStore.getState();
        socket = io(WS_URL, {
            auth: { token: accessToken },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            console.log('🔌 WebSocket connected:', socket?.id);
            useSocketStore.getState().setConnected(true);
        });

        socket.on('disconnect', (reason) => {
            console.log('🔌 WebSocket disconnected:', reason);
            useSocketStore.getState().setConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('🔌 WebSocket connection error:', error.message);
            useSocketStore.getState().setConnected(false);
        });
    }

    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

export const joinOrgRoom = (orgId: string) => {
    getSocket().emit('room:join', { orgId });
};

export const leaveOrgRoom = (orgId: string) => {
    getSocket().emit('room:leave', { orgId });
};

export const joinChatRoom = (targetId: string, targetType: 'CHANNEL' | 'CONVERSATION') => {
    getSocket().emit('chat:join', { targetId, targetType });
};

export const leaveChatRoom = (targetId: string, targetType: 'CHANNEL' | 'CONVERSATION') => {
    getSocket().emit('chat:leave', { targetId, targetType });
};
