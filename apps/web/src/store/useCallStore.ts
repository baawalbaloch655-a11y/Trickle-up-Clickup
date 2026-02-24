import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import { useAuthStore } from './authStore';

interface IncomingCall {
    callerId: string;
    callerName: string;
    callerAvatarUrl?: string;
    isVideo: boolean;
}

interface ActiveCall {
    targetId: string;
    targetName?: string;
    targetAvatarUrl?: string;
    isVideo: boolean;
    isCaller: boolean;
}

interface CallState {
    incomingCall: IncomingCall | null;
    activeCall: ActiveCall | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    audioEnabled: boolean;
    videoEnabled: boolean;
    peerConnection: RTCPeerConnection | null;
    isRinging: boolean; // Outbound ringing

    setIncomingCall: (call: IncomingCall | null) => void;

    // Core Actions
    initiateCall: (targetId: string, isVideo: boolean, targetName?: string, targetAvatarUrl?: string) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    endCall: (emitEvent?: boolean) => void;

    // Media Controls
    toggleAudio: () => void;
    toggleVideo: () => void;

    // WebRTC Signaling Handlers
    handleOffer: (senderId: string, offer: RTCSessionDescriptionInit) => Promise<void>;
    handleAnswer: (senderId: string, answer: RTCSessionDescriptionInit) => Promise<void>;
    handleIceCandidate: (senderId: string, candidate: RTCIceCandidateInit) => Promise<void>;
}

// Google's public STUN servers for NAT traversal
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export const useCallStore = create<CallState>((set, get) => {

    const stopStreams = () => {
        const { localStream, remoteStream } = get();
        localStream?.getTracks().forEach(track => track.stop());
        remoteStream?.getTracks().forEach(track => track.stop());
        set({ localStream: null, remoteStream: null });
    };

    const cleanupPC = () => {
        const { peerConnection } = get();
        if (peerConnection) {
            peerConnection.ontrack = null;
            peerConnection.onicecandidate = null;
            peerConnection.close();
            set({ peerConnection: null });
        }
    };

    const setupMedia = async (isVideo: boolean): Promise<MediaStream> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideo,
                audio: true
            });
            set({ localStream: stream, audioEnabled: true, videoEnabled: isVideo });
            return stream;
        } catch (error) {
            console.error('Error accessing media devices', error);
            throw error;
        }
    };

    const setupPeerConnection = (targetId: string): RTCPeerConnection => {
        const pc = new RTCPeerConnection(ICE_SERVERS);
        const socket = getSocket();

        // Send ICE candidates to the other peer via signaling server
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc:ice-candidate', {
                    targetUserId: targetId,
                    candidate: event.candidate
                });
            }
        };

        // When remote stream arrives, set it
        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                set({ remoteStream: event.streams[0] });
            }
        };

        set({ peerConnection: pc });
        return pc;
    };

    return {
        incomingCall: null,
        activeCall: null,
        localStream: null,
        remoteStream: null,
        audioEnabled: true,
        videoEnabled: true,
        peerConnection: null,
        isRinging: false,

        setIncomingCall: (call) => set({ incomingCall: call }),

        initiateCall: async (targetId, isVideo, targetName, targetAvatarUrl) => {
            const socket = getSocket();
            // Get user's own profile info for the caller details
            const currentUser = useAuthStore.getState().user;

            // 1. Ask for media permissions
            const stream = await setupMedia(isVideo);

            set({
                isRinging: true,
                activeCall: { targetId, isVideo, isCaller: true, targetName, targetAvatarUrl }
            });

            // 2. Notify the remote user
            socket.emit('call:initiate', {
                targetUserId: targetId,
                isVideo: isVideo,
                callerName: currentUser?.name || currentUser?.email || 'User',
                callerAvatarUrl: currentUser?.avatarUrl || ''
            });

            // 3. Setup PC, but wait for 'call:accepted' before offering
            const pc = setupPeerConnection(targetId);
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        },

        acceptCall: async () => {
            const { incomingCall } = get();
            if (!incomingCall) return;

            const socket = getSocket();
            const targetId = incomingCall.callerId;
            const isVideo = incomingCall.isVideo;

            const stream = await setupMedia(isVideo);

            set({
                incomingCall: null,
                activeCall: {
                    targetId,
                    isVideo,
                    isCaller: false,
                    targetName: incomingCall.callerName,
                    targetAvatarUrl: incomingCall.callerAvatarUrl
                }
            });

            socket.emit('call:accept', { targetUserId: targetId });

            const pc = setupPeerConnection(targetId);
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        },

        rejectCall: () => {
            const { incomingCall } = get();
            if (incomingCall) {
                getSocket().emit('call:reject', { targetUserId: incomingCall.callerId });
            }
            set({ incomingCall: null });
        },

        endCall: (emitEvent = true) => {
            const { activeCall, isRinging, incomingCall } = get();

            // If we are currently ringing someone and hang up
            if (isRinging && activeCall && emitEvent) {
                getSocket().emit('call:end', { targetUserId: activeCall.targetId });
            }

            // If we are in an active connected call
            if (activeCall && !isRinging && emitEvent) {
                getSocket().emit('call:end', { targetUserId: activeCall.targetId });
            }

            // Cleanup everything
            cleanupPC();
            stopStreams();
            set({ activeCall: null, incomingCall: null, isRinging: false });
        },

        toggleAudio: () => {
            const { localStream, audioEnabled } = get();
            if (localStream) {
                const audioTracks = localStream.getAudioTracks();
                audioTracks.forEach(track => {
                    track.enabled = !audioEnabled;
                });
                set({ audioEnabled: !audioEnabled });
            }
        },

        toggleVideo: () => {
            const { localStream, videoEnabled } = get();
            if (localStream) {
                const videoTracks = localStream.getVideoTracks();
                videoTracks.forEach(track => {
                    track.enabled = !videoEnabled;
                });
                set({ videoEnabled: !videoEnabled });
            }
        },

        handleOffer: async (senderId, offer) => {
            const { peerConnection } = get();
            if (!peerConnection) return;

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            getSocket().emit('webrtc:answer', {
                targetUserId: senderId,
                answer
            });
        },

        handleAnswer: async (senderId, answer) => {
            const { peerConnection } = get();
            if (!peerConnection) return;

            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        },

        handleIceCandidate: async (senderId, candidate) => {
            const { peerConnection } = get();
            if (!peerConnection) return;

            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error("Error adding received ICE candidate", e);
            }
        }
    };
});
