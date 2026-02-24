import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useCallStore } from './store/useCallStore';
import { getSocket } from './lib/socket';
import { MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ProfileSettingsPage from './pages/settings/ProfileSettingsPage';
import OrgSettingsPage from './pages/settings/OrgSettingsPage';
import OrgSelectPage from './pages/auth/OrgSelectPage';
import CallOverlay from './components/chat/CallOverlay';
import PeoplePage from './pages/people/PeoplePage';
import ChatPage from './pages/chat/ChatPage';
import InboxPage from './pages/inbox/InboxPage';
import HomeDashboard from './pages/dashboard/HomeDashboard';
import ChatLandingPage from './pages/chat/ChatLandingPage';
import TeamsPage from './pages/teams/TeamsPage';
import ClipsPage from './pages/clips/ClipsPage';
import SpacePage from './pages/spaces/SpacePage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function GlobalSocketListener({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, activeOrg, user } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated || !activeOrg) return;

        const socket = getSocket();

        const handleNotification = (data: any) => {
            // Ignore messages sent by ourselves
            if (data.message.userId === user?.id) return;

            const isChannel = data.targetType === 'CHANNEL';
            const link = isChannel ? `/channels/${data.targetId}` : `/conversations/${data.targetId}`;

            toast.custom((t) => (
                <div
                    className={`${t.visible ? 'animate-enter' : 'animate-leave'
                        } max-w-md w-full bg-white shadow-lg rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors`}
                    onClick={() => {
                        toast.dismiss(t.id);
                        navigate(link);
                    }}
                >
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 pt-0.5">
                                {data.message.user.avatarUrl ? (
                                    <img
                                        className="h-10 w-10 rounded-full object-cover"
                                        src={data.message.user.avatarUrl}
                                        alt=""
                                    />
                                ) : (
                                    <div className="h-10 w-10 rounded-full bg-accent-100 flex items-center justify-center border border-accent-200">
                                        <MessageSquare size={20} className="text-accent-600" />
                                    </div>
                                )}
                            </div>
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-bold text-gray-900">
                                    {data.message.user.name} <span className="text-xs font-normal text-gray-500 ml-1">in {isChannel ? 'Team' : 'DM'}</span>
                                </p>
                                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                    {data.message.content}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ), { duration: 5000, position: 'bottom-right' });
        };

        // ── WebRTC Call Events ── registered here because auth is guaranteed
        const handleCallIncoming = (data: any) => {
            const { activeCall } = useCallStore.getState();
            if (activeCall) return; // Already in a call
            useCallStore.getState().setIncomingCall({
                callerId: data.callerId,
                callerName: data.callerName,
                callerAvatarUrl: data.callerAvatarUrl,
                isVideo: data.isVideo,
            });
        };

        const handleCallAccepted = async (data: any) => {
            const { peerConnection } = useCallStore.getState();
            if (!peerConnection) return;
            try {
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                socket.emit('webrtc:offer', { targetUserId: data.responderId, offer });
                useCallStore.setState({ isRinging: false });
            } catch (err) {
                console.error('Error creating WebRTC offer:', err);
                useCallStore.getState().endCall(false);
            }
        };

        const handleCallRejected = () => {
            toast.error('Call was declined.');
            useCallStore.getState().endCall(false);
        };

        const handleCallEnded = () => {
            toast('Call ended', { icon: 'ℹ️' });
            useCallStore.getState().endCall(false);
        };

        const handleOffer = async (data: any) => {
            await useCallStore.getState().handleOffer(data.senderId, data.offer);
        };

        const handleAnswer = async (data: any) => {
            await useCallStore.getState().handleAnswer(data.senderId, data.answer);
        };

        const handleIce = async (data: any) => {
            await useCallStore.getState().handleIceCandidate(data.senderId, data.candidate);
        };

        socket.on('message.notify', handleNotification);
        socket.on('call:incoming', handleCallIncoming);
        socket.on('call:accepted', handleCallAccepted);
        socket.on('call:rejected', handleCallRejected);
        socket.on('call:ended', handleCallEnded);
        socket.on('webrtc:offer', handleOffer);
        socket.on('webrtc:answer', handleAnswer);
        socket.on('webrtc:ice-candidate', handleIce);

        return () => {
            socket.off('message.notify', handleNotification);
            socket.off('call:incoming', handleCallIncoming);
            socket.off('call:accepted', handleCallAccepted);
            socket.off('call:rejected', handleCallRejected);
            socket.off('call:ended', handleCallEnded);
            socket.off('webrtc:offer', handleOffer);
            socket.off('webrtc:answer', handleAnswer);
            socket.off('webrtc:ice-candidate', handleIce);
        };
    }, [isAuthenticated, activeOrg, user, navigate]);

    return (
        <>
            {children}
            <CallOverlay />
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <GlobalSocketListener>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                    <Route path="/select-org" element={<PrivateRoute><OrgSelectPage /></PrivateRoute>} />

                    {/* Protected app routes */}
                    <Route path="/" element={<PrivateRoute><AppShell /></PrivateRoute>}>
                        <Route index element={<Navigate to="/home" replace />} />
                        <Route path="home" element={<HomeDashboard />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="people" element={<PeoplePage />} />
                        <Route path="projects/:id" element={<ProjectDetailPage />} />
                        <Route path="lists/:listId" element={<ProjectDetailPage />} />
                        <Route path="inbox" element={<InboxPage />} />
                        <Route path="inbox/:filter" element={<InboxPage />} />
                        <Route path="settings/profile" element={<ProfileSettingsPage />} />
                        <Route path="settings/organization" element={<OrgSettingsPage />} />
                        <Route path="chat" element={<ChatLandingPage />} />
                        <Route path="teams" element={<TeamsPage />} />
                        <Route path="clips" element={<ClipsPage />} />
                        <Route path="channels/:channelId" element={<ChatPage />} />
                        <Route path="conversations/:conversationId" element={<ChatPage />} />
                        <Route path="spaces/:spaceId" element={<SpacePage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </GlobalSocketListener>
        </BrowserRouter>
    );
}
