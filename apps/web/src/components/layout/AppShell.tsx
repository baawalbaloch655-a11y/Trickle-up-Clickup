import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { joinOrgRoom } from '../../lib/socket';

export default function AppShell() {
    const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
    const activeOrg = useAuthStore((s) => s.activeOrg);
    const navigate = useNavigate();

    useEffect(() => {
        if (!activeOrg) {
            navigate('/select-org');
            return;
        }
        // Join org realtime room
        joinOrgRoom(activeOrg.id);
    }, [activeOrg, navigate]);

    return (
        <div className="flex h-screen bg-gray-950 overflow-hidden">
            <Sidebar />
            <div className={`flex flex-col flex-1 overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-0'}`}>
                <Topbar />
                <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
