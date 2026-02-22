import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ProfileSettingsPage from './pages/settings/ProfileSettingsPage';
import OrgSettingsPage from './pages/settings/OrgSettingsPage';
import OrgSelectPage from './pages/auth/OrgSelectPage';
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

export default function App() {
    return (
        <BrowserRouter>
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
        </BrowserRouter>
    );
}
