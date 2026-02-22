import { NavLink, useNavigate, useParams } from 'react-router-dom';
import {
    LayoutDashboard, Bell, Settings, LogOut,
    ChevronLeft, ChevronRight, Zap, Users,
    Hash, Folder, Box, ChevronDown, Plus,
    Star, MessageSquare, MessageCircle, UserPlus,
    Inbox, Reply, AtSign, ListTodo, MoreHorizontal,
    Calendar, FileText, Activity, PenTool, Video, Target, Clock,
    Send, Megaphone, LayoutGrid, Globe, CheckCheck, UserCheck
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { authApi, spacesApi, favoritesApi, channelsApi, conversationsApi, notificationsApi } from '../../lib/api';
import { disconnectSocket, joinOrgRoom, leaveOrgRoom } from '../../lib/socket';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { useState } from 'react';
import CustomizeSidebarModal from './CustomizeSidebarModal';

// Map logical preference keys to their route and icon config
const NAV_ITEM_CONFIG: Record<string, { to: string; icon: any; label: string; subItems?: any[] }> = {
    home: { to: '/home', icon: LayoutDashboard, label: 'Home' },
    chat: { to: '/chat', icon: MessageSquare, label: 'Chat' },
    planner: { to: '/planner', icon: Calendar, label: 'Planner' },
    ai: { to: '/ai', icon: Zap, label: 'AI' },
    teams: { to: '/teams', icon: Users, label: 'Teams' },
    docs: { to: '/docs', icon: FileText, label: 'Docs' },
    dashboards: { to: '/dashboards', icon: Activity, label: 'Dashboards' },
    whiteboards: { to: '/whiteboards', icon: PenTool, label: 'Whiteboards' },
    forms: { to: '/forms', icon: ListTodo, label: 'Forms' },
    clips: { to: '/clips', icon: Video, label: 'Clips' },
    goals: { to: '/goals', icon: Target, label: 'Goals' },
    timesheets: { to: '/timesheets', icon: Clock, label: 'Timesheets' },
};

const bottomItems = [
    { to: '/settings/profile', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    const { sidebarCollapsed, toggleSidebar, sidebarPreferences, homePreferences, sectionPreferences, openModal } = useUIStore();
    const { user, activeOrg, logout } = useAuthStore();
    const navigate = useNavigate();
    const { listId: activeListId } = useParams();

    const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({});
    const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

    // Compute dynamic inbox + subitems
    const inboxSubItems = [];
    if (homePreferences.replies) inboxSubItems.push({ to: '/inbox/replies', icon: Reply, label: 'Replies' });
    if (homePreferences.assignedComments) inboxSubItems.push({ to: '/inbox/assigned', icon: MessageSquare, label: 'Assigned Comments' });
    if (homePreferences.myTasks) inboxSubItems.push({ to: '/home', icon: UserCheck, label: 'My Tasks' });

    // Compute dynamic nav items
    const navItems = [
        ...(sidebarPreferences.home ? [NAV_ITEM_CONFIG.home] : []),
        ...(homePreferences.inbox ? [{ to: '/inbox', icon: Inbox, label: 'Inbox', subItems: inboxSubItems.length > 0 ? inboxSubItems : undefined }] : []),
        ...(homePreferences.chatActivity ? [{ to: '/chat-activity', icon: AtSign, label: 'Chat Activity' }] : []),
        ...(homePreferences.draftsAndSent ? [{ to: '/drafts', icon: Send, label: 'Drafts & Sent' }] : []),
        ...(homePreferences.posts ? [{ to: '/posts', icon: Megaphone, label: 'Posts' }] : []),
        ...(homePreferences.allChannels ? [{ to: '/channels', icon: LayoutGrid, label: 'All Channels' }] : []),
        ...(homePreferences.allSpaces ? [{ to: '/spaces', icon: Globe, label: 'All Spaces' }] : []),
        ...(homePreferences.allTasks ? [{ to: '/tasks', icon: CheckCheck, label: 'All Tasks' }] : []),
        ...(sidebarPreferences.chat ? [NAV_ITEM_CONFIG.chat] : []),
        ...(sidebarPreferences.teams ? [NAV_ITEM_CONFIG.teams] : []),
        ...(sidebarPreferences.clips ? [NAV_ITEM_CONFIG.clips] : []),
        ...(sidebarPreferences.planner ? [NAV_ITEM_CONFIG.planner] : []),
        ...(sidebarPreferences.ai ? [NAV_ITEM_CONFIG.ai] : []),
        ...(sidebarPreferences.docs ? [NAV_ITEM_CONFIG.docs] : []),
        ...(sidebarPreferences.dashboards ? [NAV_ITEM_CONFIG.dashboards] : []),
        ...(sidebarPreferences.whiteboards ? [NAV_ITEM_CONFIG.whiteboards] : []),
        ...(sidebarPreferences.forms ? [NAV_ITEM_CONFIG.forms] : []),
        ...(sidebarPreferences.goals ? [NAV_ITEM_CONFIG.goals] : []),
        ...(sidebarPreferences.timesheets ? [NAV_ITEM_CONFIG.timesheets] : []),
    ];

    const { data: spacesRes } = useQuery({
        queryKey: ['spaces', activeOrg?.id],
        queryFn: () => spacesApi.list(),
        enabled: !!activeOrg,
    });

    const { data: favoritesRes } = useQuery({
        queryKey: ['favorites', activeOrg?.id],
        queryFn: () => favoritesApi.list(),
        enabled: !!activeOrg,
    });

    const { data: channelsRes } = useQuery({
        queryKey: ['channels', activeOrg?.id],
        queryFn: () => channelsApi.list(),
        enabled: !!activeOrg,
    });

    const { data: conversationsRes } = useQuery({
        queryKey: ['conversations', activeOrg?.id],
        queryFn: () => conversationsApi.list(),
        enabled: !!activeOrg,
    });

    const spaces = spacesRes?.data?.data || [];
    const favorites = favoritesRes?.data?.data || [];
    const channels = channelsRes?.data?.data || [];
    const conversations = conversationsRes?.data?.data || [];

    const { data: unreadRes } = useQuery({
        queryKey: ['unread-count', activeOrg?.id],
        queryFn: () => notificationsApi.getUnreadCount(),
        enabled: !!activeOrg,
        refetchInterval: 10000,
    });

    const unreadCount = unreadRes?.data?.count || 0;

    const toggleSpace = (id: string) => {
        setExpandedSpaces(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleFolder = (id: string) => {
        setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch { }
        disconnectSocket();
        logout();
        navigate('/login');
        toast.success('Logged out successfully');
    };

    return (
        <>
            <aside
                className={clsx(
                    'flex flex-col h-full bg-gray-900 border-r border-gray-800 transition-all duration-300 flex-shrink-0 z-30',
                    sidebarCollapsed ? 'w-16' : 'w-60',
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-accent-600 flex items-center justify-center shadow-glow">
                                <Zap size={16} className="text-white" />
                            </div>
                            <span className="font-bold text-gray-100 tracking-tight">TrickleUp</span>
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <div className="mx-auto w-8 h-8 rounded-xl bg-accent-600 flex items-center justify-center shadow-glow">
                            <Zap size={16} className="text-white" />
                        </div>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className={clsx('btn-ghost btn-sm p-1.5 rounded-lg', sidebarCollapsed && 'mx-auto mt-0')}
                        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </div>

                {/* Org indicator */}
                {!sidebarCollapsed && activeOrg && (
                    <div className="px-3 pt-3 pb-1">
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/40">
                            <div className="w-7 h-7 rounded-lg bg-accent-600/20 flex items-center justify-center flex-shrink-0">
                                <Users size={13} className="text-accent-400" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-semibold text-gray-200 truncate">{activeOrg.name}</p>
                                <p className="text-[10px] text-gray-500 capitalize">{activeOrg.plan.toLowerCase()} plan</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Nav items */}
                <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <div key={item.to} className="space-y-0.5">
                            <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                    clsx(isActive ? 'nav-item-active' : 'nav-item', sidebarCollapsed && 'justify-center px-2')
                                }
                                title={sidebarCollapsed ? item.label : undefined}
                            >
                                <item.icon size={18} className="flex-shrink-0" />
                                {!sidebarCollapsed && (
                                    <div className="flex-1 flex items-center justify-between">
                                        <span className="text-sm">{item.label}</span>
                                        {item.label === 'Inbox' && unreadCount > 0 && (
                                            <span className="bg-accent-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </NavLink>

                            {!sidebarCollapsed && item.subItems && (
                                <div className="ml-9 space-y-0.5 mt-0.5">
                                    {item.subItems.map((sub) => (
                                        <NavLink
                                            key={sub.to}
                                            to={sub.to}
                                            className={({ isActive }) =>
                                                clsx(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors",
                                                    isActive ? "text-gray-100 bg-gray-800/40" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/20"
                                                )
                                            }
                                        >
                                            <sub.icon size={14} className="opacity-70" />
                                            <span>{sub.label}</span>
                                        </NavLink>
                                    ))}
                                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:text-gray-400">
                                        <MoreHorizontal size={14} />
                                        <span>More</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {!sidebarCollapsed && favorites.length > 0 && (
                        <div className="pt-4 pb-2">
                            <div className="px-3 mb-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Favorites</span>
                            </div>
                            <div className="space-y-0.5">
                                {favorites.map((fav: any) => (
                                    <NavLink
                                        key={fav.id}
                                        to={fav.entityType === 'TASK' ? `/lists/${fav.entityId}` : fav.entityType === 'LIST' ? `/lists/${fav.entityId}` : `/dashboard`}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 transition-colors"
                                    >
                                        <Star size={14} className="text-yellow-500/80 fill-yellow-500/20" />
                                        <span className="text-xs truncate">
                                            {fav.entityType.charAt(0) + fav.entityType.slice(1).toLowerCase()} {fav.entityId.slice(0, 4)}
                                        </span>
                                    </NavLink>
                                ))}
                            </div>
                        </div>
                    )}

                    {!sidebarCollapsed && sectionPreferences.spaces && (
                        <div className="pt-4 pb-2">
                            <div className="flex items-center justify-between px-3 mb-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Workspace</span>
                                <button className="text-gray-500 hover:text-accent-400 transition-colors">
                                    <Plus size={14} />
                                </button>
                            </div>

                            <div className="space-y-1">
                                {spaces.map((space: any) => (
                                    <div key={space.id} className="space-y-0.5">
                                        <div
                                            className={clsx(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors group",
                                                "hover:bg-gray-800/50 text-gray-400 hover:text-gray-200"
                                            )}
                                            onClick={() => {
                                                toggleSpace(space.id);
                                                navigate(`/spaces/${space.id}`);
                                            }}
                                        >
                                            <Box size={14} className="text-accent-500/70" />
                                            <span className="text-xs font-medium flex-1 truncate">{space.name}</span>
                                            <ChevronDown
                                                size={12}
                                                className={clsx("transition-transform duration-200", expandedSpaces[space.id] ? "rotate-0" : "-rotate-90")}
                                            />
                                        </div>

                                        {expandedSpaces[space.id] && (
                                            <div className="ml-4 space-y-0.5 border-l border-gray-800/60 pl-2 mt-0.5">
                                                {/* Direct Lists in Space (not in folders) */}
                                                {space.lists?.filter((l: any) => !l.folderId).map((list: any) => (
                                                    <NavLink
                                                        key={list.id}
                                                        to={`/lists/${list.id}`}
                                                        className={({ isActive }) => clsx(
                                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group",
                                                            isActive ? "bg-accent-600/10 text-accent-400 font-medium" : "text-gray-500 hover:bg-gray-800/40 hover:text-gray-300"
                                                        )}
                                                    >
                                                        <Hash size={12} />
                                                        <span className="text-xs truncate">{list.name}</span>
                                                    </NavLink>
                                                ))}

                                                {/* Folders in Space */}
                                                {space.folders?.map((folder: any) => (
                                                    <div key={folder.id} className="space-y-0.5">
                                                        <div
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-800/40 text-gray-500 hover:text-gray-300 transition-colors"
                                                            onClick={() => toggleFolder(folder.id)}
                                                        >
                                                            <Folder size={12} />
                                                            <span className="text-xs flex-1 truncate">{folder.name}</span>
                                                            <ChevronDown
                                                                size={10}
                                                                className={clsx("transition-transform duration-200", expandedFolders[folder.id] ? "rotate-0" : "-rotate-90")}
                                                            />
                                                        </div>

                                                        {expandedFolders[folder.id] && (
                                                            <div className="ml-4 space-y-0.5 border-l border-gray-800/40 pl-2 mt-0.5">
                                                                {folder.lists?.map((list: any) => (
                                                                    <NavLink
                                                                        key={list.id}
                                                                        to={`/lists/${list.id}`}
                                                                        className={({ isActive }) => clsx(
                                                                            "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group",
                                                                            isActive ? "bg-accent-600/10 text-accent-400 font-medium" : "text-gray-600 hover:bg-gray-800/30 hover:text-gray-300"
                                                                        )}
                                                                    >
                                                                        <Hash size={11} />
                                                                        <span className="text-xs truncate">{list.name}</span>
                                                                    </NavLink>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!sidebarCollapsed && (
                        <>
                            {/* Channels */}
                            {sectionPreferences.channels && (
                                <div className="pt-4 pb-2">
                                    <div className="flex items-center justify-between px-3 mb-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Channels</span>
                                        <button className="text-gray-500 hover:text-accent-400 transition-colors">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-0.5">
                                        {channels.map((channel: any) => (
                                            <NavLink
                                                key={channel.id}
                                                to={`/channels/${channel.id}`}
                                                className={({ isActive }) => clsx(
                                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group",
                                                    isActive ? "bg-accent-600/10 text-accent-400 font-medium" : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
                                                )}
                                            >
                                                <Hash size={14} className="text-gray-500" />
                                                <span className="text-xs truncate">{channel.name}</span>
                                            </NavLink>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Direct Messages */}
                            {sectionPreferences.directMessages && (
                                <div className="pt-2 pb-2">
                                    <div className="flex items-center justify-between px-3 mb-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Direct Messages</span>
                                        <button className="text-gray-500 hover:text-accent-400 transition-colors">
                                            <UserPlus size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-0.5">
                                        {conversations.map((conv: any) => {
                                            const otherMember = conv.members.find((m: any) => m.userId !== user?.id)?.user;
                                            return (
                                                <NavLink
                                                    key={conv.id}
                                                    to={`/conversations/${conv.id}`}
                                                    className={({ isActive }) => clsx(
                                                        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group",
                                                        isActive ? "bg-accent-600/10 text-accent-400 font-medium" : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
                                                    )}
                                                >
                                                    <div className="w-4 h-4 rounded-full bg-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-300">
                                                        {conv.isGroup ? <Users size={10} /> : otherMember?.name?.[0] || '?'}
                                                    </div>
                                                    <span className="text-xs truncate">
                                                        {conv.isGroup ? (conv.name || 'Group Chat') : (otherMember?.name || 'Unknown')}
                                                    </span>
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </nav>

                {/* Bottom: Settings + User */}
                <div className="px-3 pb-3 space-y-0.5 border-t border-gray-800 pt-3 mt-auto">
                    <button
                        onClick={() => openModal('customizeSidebar')}
                        className={clsx(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 font-medium transition-all duration-150 hover:bg-gray-800 hover:text-gray-200",
                            sidebarCollapsed && "justify-center px-2"
                        )}
                        title={sidebarCollapsed ? "Customize" : undefined}
                    >
                        <Settings size={18} className="flex-shrink-0" />
                        {!sidebarCollapsed && <span className="text-sm">Customize</span>}
                    </button>
                    {bottomItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                clsx(isActive ? 'nav-item-active' : 'nav-item', sidebarCollapsed && 'justify-center px-2')
                            }
                            title={sidebarCollapsed ? label : undefined}
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            {!sidebarCollapsed && <span className="text-sm">{label}</span>}
                        </NavLink>
                    ))}

                    {/* User + logout */}
                    <div className={clsx(
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl mt-1',
                        sidebarCollapsed && 'justify-center px-2'
                    )}>
                        <div className="w-8 h-8 rounded-full bg-accent-600/30 border border-accent-500/30 flex items-center justify-center flex-shrink-0 uppercase text-accent-400 text-xs font-bold">
                            {user?.name?.[0] ?? '?'}
                        </div>
                        {!sidebarCollapsed && (
                            <>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-medium text-gray-200 truncate">{user?.name}</p>
                                    <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="btn-ghost p-1.5 rounded-lg text-gray-500 hover:text-red-400"
                                    title="Logout"
                                >
                                    <LogOut size={15} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </aside>
            <CustomizeSidebarModal />
        </>
    );
}
