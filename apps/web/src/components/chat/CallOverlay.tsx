import { useEffect, useRef, useCallback } from 'react';
import { useCallStore } from '../../store/useCallStore';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { clsx } from 'clsx';

// Ringtone using Web Audio API — no external file needed
function useRingtone(active: boolean) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const playBeep = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playNote = (freq: number, start: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
                gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
                osc.start(ctx.currentTime + start);
                osc.stop(ctx.currentTime + start + duration + 0.05);
            };
            playNote(480, 0, 0.4);
            playNote(620, 0, 0.4);
            playNote(480, 0.5, 0.4);
            playNote(620, 0.5, 0.4);
        } catch (_) { /* audio blocked — ignore */ }
    }, []);

    useEffect(() => {
        if (active) {
            playBeep();
            intervalRef.current = setInterval(playBeep, 2000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [active, playBeep]);
}

export default function CallOverlay() {
    // Subscribe to individual slices to avoid re-renders
    const incomingCall = useCallStore(s => s.incomingCall);
    const activeCall = useCallStore(s => s.activeCall);
    const localStream = useCallStore(s => s.localStream);
    const remoteStream = useCallStore(s => s.remoteStream);
    const audioEnabled = useCallStore(s => s.audioEnabled);
    const videoEnabled = useCallStore(s => s.videoEnabled);
    const isRinging = useCallStore(s => s.isRinging);

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

    // Ringtone fires on incoming and outbound ringing
    useRingtone(!!incomingCall || (!!activeCall && isRinging));

    // Attach streams to media elements
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            (remoteVideoRef.current as HTMLVideoElement).srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (!incomingCall && !activeCall) return null;

    // ─── Incoming Call Screen ───
    if (incomingCall) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center w-80 shadow-2xl">
                    <div className="w-24 h-24 rounded-full bg-accent-100 flex items-center justify-center text-4xl font-bold text-accent-700 uppercase mb-4 shadow-lg ring-4 ring-accent-300 animate-pulse">
                        {incomingCall.callerAvatarUrl ? (
                            <img src={incomingCall.callerAvatarUrl} alt={incomingCall.callerName} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            incomingCall.callerName?.[0]?.toUpperCase() || '?'
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">{incomingCall.callerName || 'Unknown'}</h2>
                    <p className="text-sm text-gray-500 mb-8">
                        Incoming {incomingCall.isVideo ? 'Video' : 'Audio'} Call...
                    </p>
                    <div className="flex items-center gap-6 w-full justify-center">
                        <button
                            onClick={() => useCallStore.getState().rejectCall()}
                            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
                        >
                            <PhoneOff size={24} />
                        </button>
                        <button
                            onClick={() => useCallStore.getState().acceptCall()}
                            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105"
                        >
                            {incomingCall.isVideo ? <Video size={24} /> : <Phone size={24} fill="currentColor" />}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Active / Ringing Screen ───
    if (activeCall) {
        const isVideoCall = activeCall.isVideo;

        if (isVideoCall) {
            return (
                <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col">
                    <div className="flex-1 relative bg-black overflow-hidden">
                        {isRinging ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-4xl font-bold mb-4 animate-pulse">
                                    {activeCall.targetName?.[0]?.toUpperCase() || '?'}
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">{activeCall.targetName || 'User'}</h2>
                                <p className="text-gray-400 text-sm">Ringing...</p>
                            </div>
                        ) : (
                            <>
                                <video ref={remoteVideoRef as any} autoPlay playsInline className="w-full h-full object-contain" />
                                <div className="absolute bottom-24 right-6 w-40 h-56 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 z-10">
                                    {localStream ? (
                                        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No Camera</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="h-20 bg-gray-900/95 border-t border-gray-800 flex items-center justify-center gap-6">
                        <button
                            onClick={() => useCallStore.getState().toggleAudio()}
                            className={clsx('w-12 h-12 rounded-full flex items-center justify-center', audioEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white')}
                        >
                            {audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>
                        <button onClick={() => useCallStore.getState().endCall(true)} className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white">
                            <PhoneOff size={24} />
                        </button>
                        <button
                            onClick={() => useCallStore.getState().toggleVideo()}
                            className={clsx('w-12 h-12 rounded-full flex items-center justify-center', videoEnabled ? 'bg-gray-700 text-white' : 'bg-red-500 text-white')}
                        >
                            {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="fixed bottom-6 right-6 z-[9999] w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center text-lg font-bold text-accent-700 uppercase shrink-0">
                        {activeCall.targetName?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{activeCall.targetName || 'User'}</h3>
                        <p className="text-xs text-green-600 font-medium">{isRinging ? 'Ringing...' : 'Ongoing Audio Call'}</p>
                    </div>
                </div>
                {remoteStream && <audio ref={remoteVideoRef as any} autoPlay playsInline className="hidden" />}
                <div className="flex items-center justify-center gap-4">
                    <button
                        onClick={() => useCallStore.getState().toggleAudio()}
                        className={clsx('w-10 h-10 rounded-full flex items-center justify-center', audioEnabled ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-600')}
                    >
                        {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>
                    <button onClick={() => useCallStore.getState().endCall(true)} className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white">
                        <PhoneOff size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
