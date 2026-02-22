import { useUIStore } from '../../store/uiStore';
import {
    X, LayoutDashboard, Zap, ListTodo, FileText,
    Users, Calendar, MessageSquare, Box, PenTool,
    Video, Target, Clock, Activity, Check,
    Inbox, Reply, AtSign, Send, Megaphone, LayoutGrid, Globe, CheckCheck, UserCheck, GripVertical
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

// Map icon aliases to Lucide components for the items defined in the store
const PREF_CONFIG: Record<string, { label: string; icon: any; description?: string }> = {
    home: { label: 'Home', icon: LayoutDashboard, description: 'Home will show a badge for @mentions, DMs & Inbox' },
    spaces: { label: 'Spaces', icon: Box },
    chat: { label: 'Chat', icon: MessageSquare },
    planner: { label: 'Planner', icon: Calendar },
    ai: { label: 'AI', icon: Zap },
    teams: { label: 'Teams', icon: Users },
    docs: { label: 'Docs', icon: FileText },
    dashboards: { label: 'Dashboards', icon: Activity },
    whiteboards: { label: 'Whiteboards', icon: PenTool },
    forms: { label: 'Forms', icon: ListTodo },
    clips: { label: 'Clips', icon: Video },
    goals: { label: 'Goals', icon: Target },
    timesheets: { label: 'Timesheets', icon: Clock },
};

const HOME_PREF_CONFIG: Record<string, { label: string; icon: any; indent?: boolean }> = {
    inbox: { label: 'Inbox', icon: Inbox },
    replies: { label: 'Replies', icon: Reply, indent: true },
    assignedComments: { label: 'Assigned Comments', icon: MessageSquare, indent: true },
    myTasks: { label: 'My Tasks', icon: UserCheck, indent: true },
    chatActivity: { label: 'Chat Activity', icon: AtSign },
    draftsAndSent: { label: 'Drafts & Sent', icon: Send },
    posts: { label: 'Posts', icon: Megaphone },
    allChannels: { label: 'All Channels', icon: LayoutGrid },
    allSpaces: { label: 'All Spaces', icon: Globe },
    allTasks: { label: 'All Tasks', icon: CheckCheck },
};

const SECTION_CONFIG: Record<string, { label: string }> = {
    favorites: { label: 'Favorites' },
    spaces: { label: 'Spaces' },
    channels: { label: 'Channels' },
    directMessages: { label: 'Direct Messages' }
};

const THEME_COLORS = [
    { id: 'black', label: 'Black', hex: '#64748b' }, // slate-500 rep
    { id: 'purple', label: 'Purple', hex: '#a855f7' },
    { id: 'blue', label: 'Blue', hex: '#3b82f6' },
    { id: 'pink', label: 'Pink', hex: '#ec4899' },
    { id: 'violet', label: 'Violet', hex: '#8b5cf6' },
    { id: 'indigo', label: 'Indigo', hex: '#6366f1' },
    { id: 'orange', label: 'Orange', hex: '#f97316' },
    { id: 'teal', label: 'Teal', hex: '#14b8a6' },
    { id: 'bronze', label: 'Bronze', hex: '#78716c' }, // stone-500 rep
    { id: 'mint', label: 'Mint', hex: '#10b981' } // emerald-500 rep
];

export default function CustomizeSidebarModal() {
    const {
        activeModal, closeModal,
        sidebarPreferences, toggleSidebarPreference,
        homePreferences, toggleHomePreference,
        sectionPreferences, toggleSectionPreference,
        themeColor, setThemeColor,
        themeAppearance, setThemeAppearance
    } = useUIStore();
    const [activeTab, setActiveTab] = useState('Navigation');

    if (activeModal !== 'customizeSidebar') return null;

    const tabs = ['Navigation', 'Home', 'Sections', 'Themes'];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-start justify-between p-6 pb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-100">Customize</h2>
                        <p className="text-sm text-gray-500 mt-1">Personalize and organize your TrickleUp interface</p>
                    </div>
                    <button
                        onClick={closeModal}
                        className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-gray-800 bg-gray-900 border border-gray-800"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Tabs */}
                    <div className="px-6 mb-4">
                        <div className="flex items-center gap-1 p-1 bg-gray-900 rounded-xl">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={clsx(
                                        "flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                                        activeTab === tab
                                            ? "bg-gray-800 text-gray-100 border border-gray-700 shadow-sm"
                                            : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                        {activeTab === 'Navigation' && (
                            <div className="space-y-1 mt-2">
                                {Object.entries(PREF_CONFIG).map(([key, config]) => {
                                    const isChecked = sidebarPreferences[key];
                                    return (
                                        <div key={key} className="flex items-start gap-4 py-2 group cursor-pointer" onClick={() => toggleSidebarPreference(key)}>
                                            <div className="pt-0.5">
                                                <div className={clsx(
                                                    "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors",
                                                    isChecked
                                                        ? "bg-accent-600 border-accent-600 shadow-glow"
                                                        : "bg-transparent border-gray-600 group-hover:border-gray-500"
                                                )}>
                                                    {isChecked && <Check size={12} className="text-gray-950 font-bold" />}
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                                <config.icon size={16} className={clsx("mt-0.5", isChecked ? "text-gray-300" : "text-gray-500")} />
                                                <div>
                                                    <p className={clsx("text-sm font-medium", isChecked ? "text-gray-200" : "text-gray-400")}>{config.label}</p>
                                                    {config.description && (
                                                        <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">{config.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="mt-8 pt-6 border-t border-gray-800/50">
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Appearance</h3>
                                    <div className="flex gap-4">
                                        <div className="flex-1 aspect-[4/3] bg-gray-900 border border-gray-800 rounded-xl flex flex-col items-center justify-center opacity-50 cursor-pointer hover:border-gray-700 hover:bg-gray-800 transition-colors p-4 relative overflow-hidden">
                                            <div className="w-full space-y-2 opacity-50">
                                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-gray-500" /><div className="flex-1 h-1.5 rounded-full bg-gray-700" /></div>
                                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-gray-500" /><div className="w-1/2 h-1.5 rounded-full bg-gray-700" /></div>
                                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-gray-500" /></div>
                                            </div>
                                            <div className="absolute bottom-2 text-xs text-center text-gray-500 font-medium">Icons only</div>
                                        </div>
                                        <div className="flex-1 aspect-[4/3] bg-gray-900 border-2 border-accent-600/50 rounded-xl flex flex-col items-center justify-center shadow-glow cursor-pointer relative overflow-hidden p-4">
                                            <div className="absolute inset-0 bg-accent-600/5" />
                                            <div className="w-full space-y-2 opacity-80 relative z-10">
                                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-accent-500" /><div className="flex-1 h-1.5 rounded-full bg-gray-600" /></div>
                                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-accent-500" /><div className="w-1/2 h-1.5 rounded-full bg-gray-600" /></div>
                                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-accent-500" /></div>
                                            </div>
                                            <div className="absolute bottom-2 text-xs text-center font-bold text-gray-200 relative z-10 w-full">Icons & Labels</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'Home' && (
                            <div className="space-y-1 mt-2">
                                {Object.entries(HOME_PREF_CONFIG).map(([key, config]) => {
                                    const isChecked = homePreferences[key];
                                    return (
                                        <div
                                            key={key}
                                            className={clsx("flex items-start gap-4 py-2 group cursor-pointer", config.indent ? "ml-8" : "")}
                                            onClick={() => toggleHomePreference(key)}
                                        >
                                            <div className="pt-0.5">
                                                <div className={clsx(
                                                    "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors",
                                                    isChecked
                                                        ? "bg-accent-600 border-accent-600 shadow-glow"
                                                        : "bg-transparent border-gray-600 group-hover:border-gray-500"
                                                )}>
                                                    {isChecked && <Check size={12} className="text-gray-950 font-bold" />}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                <config.icon size={16} className={clsx(isChecked ? "text-gray-300" : "text-gray-500")} />
                                                <p className={clsx("text-sm font-medium", isChecked ? "text-gray-200" : "text-gray-400")}>{config.label}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'Sections' && (
                            <div className="space-y-2 mt-2">
                                {Object.entries(SECTION_CONFIG).map(([key, config]) => {
                                    const isChecked = sectionPreferences[key];
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => toggleSectionPreference(key)}
                                            className={clsx(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors",
                                                isChecked
                                                    ? "bg-gray-800/50 border-accent-600/30 shadow-sm"
                                                    : "bg-gray-900 border-gray-800 hover:border-gray-700 hover:bg-gray-800/50"
                                            )}
                                        >
                                            <GripVertical size={14} className="text-gray-600" />
                                            <span className={clsx("text-sm font-medium flex-1", isChecked ? "text-gray-200" : "text-gray-400")}>{config.label}</span>
                                            <div className={clsx(
                                                "w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors",
                                                isChecked
                                                    ? "bg-accent-600 border-accent-600 shadow-glow"
                                                    : "bg-transparent border-gray-600"
                                            )}>
                                                {isChecked && <Check size={12} className="text-gray-950 font-bold" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'Themes' && (
                            <div className="space-y-8 mt-2 pb-4">
                                {/* Appearance */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">Appearance</h3>
                                    <div className="flex gap-4">
                                        {['light', 'dark', 'auto'].map((mode) => (
                                            <div key={mode} className="flex flex-col items-center gap-2 flex-1">
                                                <div
                                                    onClick={() => setThemeAppearance(mode)}
                                                    className={clsx(
                                                        "w-full aspect-[4/3] rounded-xl border flex flex-col cursor-pointer transition-all relative overflow-hidden",
                                                        themeAppearance === mode
                                                            ? "border-accent-500 shadow-glow"
                                                            : "border-gray-800 hover:border-gray-600",
                                                        mode === 'light' ? 'bg-gray-100' : mode === 'dark' ? 'bg-gray-950' : 'bg-gradient-to-r from-gray-100 to-gray-950'
                                                    )}
                                                >
                                                    <div className={clsx("h-2.5 w-full border-b", mode === 'light' ? 'border-gray-200' : 'border-gray-800')} />
                                                    <div className="flex-1 p-2 flex gap-2">
                                                        <div className={clsx("w-3 h-full rounded-[2px]", mode === 'light' ? 'bg-gray-200' : 'bg-gray-900')} />
                                                        <div className="flex-1 space-y-1 mt-1">
                                                            <div className={clsx("h-1 w-3/4 rounded-full", mode === 'light' ? 'bg-gray-300' : 'bg-gray-800')} />
                                                            <div className={clsx("h-1 w-1/2 rounded-full", mode === 'light' ? 'bg-gray-300' : 'bg-gray-800')} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={clsx("text-xs font-semibold capitalize", themeAppearance === mode ? 'text-gray-200' : 'text-gray-500')}>{mode}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ClickUp theme */}
                                <div>
                                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-4">TrickleUp theme</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {THEME_COLORS.map((t) => (
                                            <div
                                                key={t.id}
                                                onClick={() => setThemeColor(t.id)}
                                                className={clsx(
                                                    "flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all",
                                                    themeColor === t.id
                                                        ? "border-accent-500 bg-accent-500/10 shadow-sm"
                                                        : "border-gray-800 bg-gray-900 hover:border-gray-700 hover:bg-gray-800/50"
                                                )}
                                            >
                                                <div className="w-4 h-4 rounded-[4px] shadow-sm relative flex items-center justify-center" style={{ backgroundColor: t.hex }}>
                                                    {themeColor === t.id && <Check size={10} className="text-white drop-shadow-md" />}
                                                </div>
                                                <span className={clsx("text-sm font-medium", themeColor === t.id ? "text-gray-200" : "text-gray-400")}>{t.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
