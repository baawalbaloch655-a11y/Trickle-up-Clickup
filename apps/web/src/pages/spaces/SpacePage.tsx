import { useState } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spacesApi, tasksApi, listsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
    Box, ChevronDown, ChevronRight, Plus, Star, MoreHorizontal,
    Hash, Folder, Search, Filter, Users, Settings, Share2,
    MessageSquare, Flag, Clock, Calendar, CheckCircle2, Circle,
    Layout, List, Columns3, Activity, Eye, FileText, Loader2,
    Sparkles, X, AlignLeft
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
    TODO: { label: 'TO DO', color: 'text-gray-400', bgColor: 'bg-gray-600', borderColor: 'border-gray-600' },
    IN_PROGRESS: { label: 'IN PROGRESS', color: 'text-blue-400', bgColor: 'bg-blue-600', borderColor: 'border-blue-500' },
    IN_REVIEW: { label: 'PM REVIEW', color: 'text-orange-400', bgColor: 'bg-orange-600', borderColor: 'border-orange-500' },
    DONE: { label: 'FINAL SIGN OFF', color: 'text-green-400', bgColor: 'bg-green-600', borderColor: 'border-green-500' },
    CANCELLED: { label: 'CANCELLED', color: 'text-red-400', bgColor: 'bg-red-600', borderColor: 'border-red-500' },
};

const PRIORITY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    URGENT: { icon: '🚩', color: 'text-red-500', label: 'Urgent' },
    HIGH: { icon: '🔴', color: 'text-orange-500', label: 'High' },
    MEDIUM: { icon: '🟡', color: 'text-yellow-500', label: 'Medium' },
    LOW: { icon: '⚪', color: 'text-gray-500', label: 'Low' },
};

const TABS = [
    { id: 'list', label: 'List', icon: List },
    { id: 'board', label: 'Board', icon: Columns3 },
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'activity', label: 'Activity', icon: Activity },
];

export default function SpacePage() {
    const { spaceId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState('list');
    const [collapsedStatuses, setCollapsedStatuses] = useState<Record<string, boolean>>({});
    const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({});
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [addingToStatus, setAddingToStatus] = useState<string | null>(null);
    const [addingToList, setAddingToList] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);

    // Fetch space with folders & lists
    const { data: spaceRes, isLoading: spaceLoading } = useQuery({
        queryKey: ['space', spaceId],
        queryFn: () => spacesApi.get(spaceId!),
        enabled: !!spaceId,
    });

    // Fetch all spaces for sidebar
    const { data: allSpacesRes } = useQuery({
        queryKey: ['spaces'],
        queryFn: () => spacesApi.list(),
    });

    const space = spaceRes?.data?.data || spaceRes?.data;
    const allSpaces = allSpacesRes?.data?.data || allSpacesRes?.data || [];

    // Collect all list IDs from the space
    const allListIds: string[] = [];
    const listMap: Record<string, any> = {};
    if (space) {
        (space.lists || []).forEach((l: any) => {
            allListIds.push(l.id);
            listMap[l.id] = l;
        });
        (space.folders || []).forEach((f: any) => {
            (f.lists || []).forEach((l: any) => {
                allListIds.push(l.id);
                listMap[l.id] = { ...l, folderName: f.name };
            });
        });
    }

    // Fetch tasks for all lists in the space
    const { data: allTasksData, isLoading: tasksLoading } = useQuery({
        queryKey: ['space-tasks', spaceId, allListIds],
        queryFn: async () => {
            const results = await Promise.all(
                allListIds.map(async (listId) => {
                    try {
                        const res = await tasksApi.list(listId);
                        const tasks = res.data?.data || res.data || [];
                        return tasks.map((t: any) => ({ ...t, listId, listName: listMap[listId]?.name }));
                    } catch {
                        return [];
                    }
                })
            );
            return results.flat();
        },
        enabled: allListIds.length > 0,
    });

    const allTasks = allTasksData || [];

    // Group tasks by status
    const tasksByStatus: Record<string, any[]> = {};
    Object.keys(STATUS_CONFIG).forEach(s => { tasksByStatus[s] = []; });
    allTasks.forEach((task: any) => {
        const status = task.status || 'TODO';
        if (!tasksByStatus[status]) tasksByStatus[status] = [];
        tasksByStatus[status].push(task);
    });

    // Create task mutation
    const createTaskMutation = useMutation({
        mutationFn: (data: { listId: string; title: string; status: string }) =>
            tasksApi.create(data.listId, { title: data.title, status: data.status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['space-tasks'] });
            setNewTaskTitle('');
            setAddingToStatus(null);
            setAddingToList(null);
            toast.success('Task created');
        },
    });

    const toggleStatus = (status: string) => {
        setCollapsedStatuses(prev => ({ ...prev, [status]: !prev[status] }));
    };

    const toggleList = (id: string) => {
        setExpandedLists(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (spaceLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-[#0a0a0a]">
                <Loader2 className="animate-spin text-accent-500" size={32} />
            </div>
        );
    }

    if (!space) {
        return (
            <div className="flex items-center justify-center h-full bg-[#0a0a0a] text-gray-500">
                Space not found
            </div>
        );
    }

    return (
        <div className="flex h-full bg-[#0a0a0a]">
            {/* Left: Spaces Sidebar Panel */}
            <div className="w-56 flex-shrink-0 border-r border-gray-800/50 bg-[#0d0d0d] flex flex-col">
                {/* Sidebar Header */}
                <div className="h-12 px-4 border-b border-gray-800/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-300 tracking-wide">Spaces</span>
                    <div className="flex items-center gap-1">
                        <button className="p-1 rounded-md text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                            <Plus size={14} />
                        </button>
                        <button className="p-1 rounded-md text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors">
                            <Search size={14} />
                        </button>
                    </div>
                </div>

                {/* All Tasks link */}
                <div className="px-3 pt-2">
                    <button
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 transition-colors"
                    >
                        <CheckCircle2 size={13} />
                        <span>All Tasks - {space.org?.name || 'Workspace'}</span>
                    </button>
                </div>

                {/* Spaces Tree */}
                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 custom-scrollbar">
                    {allSpaces.map((s: any) => {
                        const isActive = s.id === spaceId;
                        const isExpanded = expandedLists[s.id] || isActive;
                        return (
                            <div key={s.id} className="space-y-0.5">
                                <div
                                    className={clsx(
                                        "group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all text-xs",
                                        isActive
                                            ? "bg-accent-600/10 text-accent-400 font-semibold"
                                            : "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200"
                                    )}
                                    onClick={() => {
                                        toggleList(s.id);
                                        navigate(`/spaces/${s.id}`);
                                    }}
                                >
                                    <ChevronDown
                                        size={11}
                                        className={clsx("transition-transform duration-200 flex-shrink-0", isExpanded ? "rotate-0" : "-rotate-90")}
                                    />
                                    <div className={clsx("w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[9px] font-bold", isActive ? "bg-accent-600 text-white" : "bg-gray-800 text-gray-400")}>
                                        {s.name?.[0]}
                                    </div>
                                    <span className="flex-1 truncate">{s.name}</span>

                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-0.5 rounded text-gray-600 hover:text-gray-300" onClick={(e) => { e.stopPropagation(); }}>
                                            <MoreHorizontal size={12} />
                                        </button>
                                        <button className="p-0.5 rounded text-gray-600 hover:text-gray-300" onClick={(e) => { e.stopPropagation(); }}>
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="ml-5 space-y-0.5 border-l border-gray-800/40 pl-1.5">
                                        {/* Direct lists */}
                                        {s.lists?.filter((l: any) => !l.folderId).map((list: any) => (
                                            <NavLink
                                                key={list.id}
                                                to={`/lists/${list.id}`}
                                                className={({ isActive: linkActive }) => clsx(
                                                    "flex items-center gap-2 px-2 py-1 rounded-md text-[11px] transition-colors",
                                                    linkActive ? "text-accent-400 bg-accent-600/5" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
                                                )}
                                            >
                                                <Hash size={11} />
                                                <span className="truncate">{list.name}</span>
                                            </NavLink>
                                        ))}
                                        {/* Folders */}
                                        {s.folders?.map((folder: any) => (
                                            <div key={folder.id} className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer hover:bg-gray-800/30 transition-colors">
                                                    <Folder size={11} />
                                                    <span className="truncate">{folder.name}</span>
                                                </div>
                                                <div className="ml-3 space-y-0.5">
                                                    {folder.lists?.map((list: any) => (
                                                        <NavLink
                                                            key={list.id}
                                                            to={`/lists/${list.id}`}
                                                            className="flex items-center gap-2 px-2 py-1 rounded-md text-[11px] text-gray-600 hover:text-gray-300 hover:bg-gray-800/30 transition-colors"
                                                        >
                                                            <Hash size={10} />
                                                            <span className="truncate">{list.name}</span>
                                                            {list._count?.tasks !== undefined && (
                                                                <span className="text-[9px] text-gray-700 ml-auto">{list._count.tasks}</span>
                                                            )}
                                                        </NavLink>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Sidebar footer */}
                <div className="border-t border-gray-800/50 px-3 py-2 space-y-1">
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-600 hover:text-gray-300 hover:bg-gray-800/40 transition-colors w-full">
                        <Users size={13} />
                        <span>Invite</span>
                    </button>
                </div>
            </div>

            {/* Right: Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Space Header */}
                <div className="h-12 px-6 border-b border-gray-800/50 flex items-center justify-between bg-[#0d0d0d]/80 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded bg-accent-600 flex items-center justify-center text-[10px] font-bold text-white">
                                {space.name?.[0]}
                            </div>
                            <h1 className="text-sm font-bold text-gray-100">{space.name}</h1>
                            <ChevronDown size={12} className="text-gray-600" />
                        </div>
                        <button className="text-gray-600 hover:text-yellow-500 transition-colors">
                            <Star size={14} />
                        </button>
                        <button className="text-gray-600 hover:text-gray-300 transition-colors">
                            <Settings size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center -space-x-1.5">
                            {[0, 1, 2].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full bg-gray-800 border-2 border-[#0d0d0d] flex items-center justify-center text-[8px] font-bold text-gray-500">
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-700 transition-colors">
                            <Sparkles size={12} />
                            Ask AI
                        </button>
                        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-gray-200 border border-gray-800 hover:border-gray-700 transition-colors">
                            <Share2 size={12} />
                            Share
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="h-10 px-6 border-b border-gray-800/50 flex items-center gap-1 bg-[#0d0d0d]/40">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                                activeTab === tab.id
                                    ? "bg-gray-800 text-white"
                                    : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
                            )}
                        >
                            <tab.icon size={13} />
                            {tab.label}
                        </button>
                    ))}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-600 hover:text-gray-400 transition-colors">
                        <Plus size={12} />
                        View
                    </button>
                </div>

                {/* Toolbar */}
                <div className="h-9 px-6 border-b border-gray-800/30 flex items-center justify-between bg-[#0a0a0a]">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <Circle size={12} className="text-gray-600" />
                            <span className="font-medium">Status</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <Filter size={12} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-gray-500 border border-gray-800 hover:border-gray-700 transition-colors">
                            <Filter size={10} />
                            1 Filter
                        </button>
                        <button className="p-1 rounded text-gray-600 hover:text-gray-300 transition-colors">
                            <Search size={13} />
                        </button>
                        <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-accent-600 text-white hover:bg-accent-500 transition-colors shadow-glow-sm">
                            <Plus size={12} />
                            Task
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
                    {tasksLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="animate-spin text-accent-500" size={24} />
                        </div>
                    ) : (
                        <div className="h-full">
                            {/* ─── LIST VIEW ──────────────────────────────────────────────────────── */}
                            {activeTab === 'list' && (
                                <div className="pb-32">
                                    {Object.entries(tasksByStatus)
                                        .filter(([, tasks]) => tasks.length > 0)
                                        .map(([status, tasks]) => {
                                            const config = STATUS_CONFIG[status] || STATUS_CONFIG.TODO;
                                            const isCollapsed = collapsedStatuses[status];
                                            return (
                                                <div key={status} className="border-b border-gray-900/50">
                                                    {/* Status Group Header */}
                                                    <div
                                                        className="flex items-center gap-3 px-6 py-2 cursor-pointer hover:bg-gray-900/30 transition-colors group"
                                                        onClick={() => toggleStatus(status)}
                                                    >
                                                        <ChevronDown
                                                            size={12}
                                                            className={clsx("text-gray-600 transition-transform duration-200", isCollapsed && "-rotate-90")}
                                                        />
                                                        <div className={clsx("px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider text-white", config.bgColor)}>
                                                            {config.label}
                                                        </div>
                                                        <span className="text-[11px] font-medium text-gray-600">{tasks.length}</span>
                                                    </div>

                                                    {/* Column Headers */}
                                                    {!isCollapsed && (
                                                        <>
                                                            <div className="grid grid-cols-12 gap-2 px-6 py-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider border-b border-gray-900/30">
                                                                <div className="col-span-4">Name</div>
                                                                <div className="col-span-1">Assignee</div>
                                                                <div className="col-span-2">Due date</div>
                                                                <div className="col-span-1">Priority</div>
                                                                <div className="col-span-2">Time tracked</div>
                                                                <div className="col-span-2">Comments</div>
                                                            </div>

                                                            {/* Task Rows */}
                                                            {tasks.map((task: any) => (
                                                                <TaskRow
                                                                    key={task.id}
                                                                    task={task}
                                                                    listName={task.listName}
                                                                    spaceName={space.name}
                                                                    user={user}
                                                                    onClick={() => setSelectedTask(task)}
                                                                />
                                                            ))}

                                                            {/* Add Task Row */}
                                                            <div className="px-6 py-2">
                                                                {addingToStatus === status ? (
                                                                    <form
                                                                        className="flex items-center gap-2"
                                                                        onSubmit={(e) => {
                                                                            e.preventDefault();
                                                                            if (newTaskTitle.trim() && allListIds.length > 0) {
                                                                                createTaskMutation.mutate({
                                                                                    listId: addingToList || allListIds[0],
                                                                                    title: newTaskTitle.trim(),
                                                                                    status,
                                                                                });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Plus size={14} className="text-gray-600" />
                                                                        <input
                                                                            type="text"
                                                                            value={newTaskTitle}
                                                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                                                            placeholder="Task name"
                                                                            className="flex-1 bg-transparent text-sm text-gray-300 placeholder:text-gray-700 outline-none"
                                                                            autoFocus
                                                                            onBlur={() => {
                                                                                if (!newTaskTitle.trim()) {
                                                                                    setAddingToStatus(null);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </form>
                                                                ) : (
                                                                    <button
                                                                        className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                                                                        onClick={() => setAddingToStatus(status)}
                                                                    >
                                                                        <Plus size={14} />
                                                                        Add Task
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            )}

                            {/* ─── BOARD VIEW ─────────────────────────────────────────────────────── */}
                            {activeTab === 'board' && (
                                <div className="flex gap-4 p-6 h-full items-start">
                                    {Object.entries(tasksByStatus).map(([status, tasks]) => {
                                        const config = STATUS_CONFIG[status] || STATUS_CONFIG.TODO;
                                        return (
                                            <div key={status} className="w-72 flex-shrink-0 flex flex-col bg-gray-900/20 rounded-xl border border-gray-800/50 max-h-[calc(100vh-160px)]">
                                                <div className="p-3 border-b border-gray-800/50 flex items-center justify-between sticky top-0 bg-[#0d0d0d]/90 backdrop-blur rounded-t-xl z-10">
                                                    <div className="flex items-center gap-2">
                                                        <div className={clsx("w-2 h-2 rounded-full", config.bgColor)} />
                                                        <span className="text-[11px] font-bold text-gray-300 tracking-wider uppercase">{config.label}</span>
                                                        <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 rounded">{tasks.length}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button className="p-1 rounded text-gray-600 hover:text-gray-300 transition-colors">
                                                            <Plus size={14} />
                                                        </button>
                                                        <button className="p-1 rounded text-gray-600 hover:text-gray-300 transition-colors">
                                                            <MoreHorizontal size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                                                    {tasks.map((task: any) => (
                                                        <BoardTaskCard
                                                            key={task.id}
                                                            task={task}
                                                            listName={task.listName}
                                                            onClick={() => setSelectedTask(task)}
                                                        />
                                                    ))}
                                                    <button
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors group border border-dashed border-transparent hover:border-gray-700"
                                                        onClick={() => {
                                                            setAddingToStatus(status);
                                                            setActiveTab('list'); // Redirect to list to add task easily
                                                        }}
                                                    >
                                                        <Plus size={14} className="group-hover:text-accent-400" />
                                                        Add Task
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* ─── OVERVIEW VIEW ──────────────────────────────────────────────────── */}
                            {activeTab === 'overview' && (
                                <div className="p-8 max-w-5xl mx-auto space-y-8">
                                    <h2 className="text-xl font-bold text-gray-100">Space Overview: {space.name}</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5">
                                            <div className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wider">Total Tasks</div>
                                            <div className="text-3xl font-bold text-gray-100">{allTasks.length}</div>
                                            <div className="text-xs text-gray-600 mt-2">Across {allListIds.length} lists</div>
                                        </div>
                                        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full" />
                                            <div className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wider">Completed</div>
                                            <div className="text-3xl font-bold text-green-400">{tasksByStatus['DONE']?.length || 0}</div>
                                            <div className="text-xs text-gray-600 mt-2">Final sign off achieved</div>
                                        </div>
                                        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full" />
                                            <div className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wider">Overdue</div>
                                            <div className="text-3xl font-bold text-red-400">
                                                {allTasks.filter((t: any) => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'DONE').length}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-2">Require immediate action</div>
                                        </div>
                                        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-accent-500/10 rounded-bl-full" />
                                            <div className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wider">Progress</div>
                                            <div className="text-3xl font-bold text-accent-400">
                                                {allTasks.length ? Math.round(((tasksByStatus['DONE']?.length || 0) / allTasks.length) * 100) : 0}%
                                            </div>
                                            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-accent-500 rounded-full"
                                                    style={{ width: `${allTasks.length ? Math.round(((tasksByStatus['DONE']?.length || 0) / allTasks.length) * 100) : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                                            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><Folder size={16} className="text-gray-500" /> Space Folders & Lists</h3>
                                            <div className="space-y-3">
                                                {space.folders?.map((folder: any) => (
                                                    <div key={folder.id} className="border border-gray-800/50 rounded-lg p-3 bg-black/20">
                                                        <div className="text-xs font-bold text-gray-400 flex items-center gap-1.5 mb-2">
                                                            <Folder size={12} /> {folder.name}
                                                        </div>
                                                        <div className="pl-4 space-y-1.5">
                                                            {folder.lists?.map((list: any) => (
                                                                <div key={list.id} className="flex justify-between items-center text-[11px] bg-gray-900/40 px-2 py-1.5 rounded">
                                                                    <span className="text-gray-300 flex items-center gap-1.5"><Hash size={10} className="text-gray-600" /> {list.name}</span>
                                                                    <span className="text-gray-500 font-mono bg-black/40 px-1.5 rounded">{list._count?.tasks || 0} tasks</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                {space.lists?.filter((l: any) => !l.folderId).map((list: any) => (
                                                    <div key={list.id} className="flex justify-between items-center text-xs bg-gray-900/40 px-3 py-2 border border-gray-800/50 rounded-lg">
                                                        <span className="text-gray-300 font-semibold flex items-center gap-1.5"><Hash size={12} className="text-gray-500" /> {list.name}</span>
                                                        <span className="text-gray-500 font-mono bg-black/40 px-2 py-0.5 rounded text-[10px]">{list._count?.tasks || 0} tasks</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-6">
                                            <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><Users size={16} className="text-gray-500" /> Top Assignees</h3>
                                            <div className="space-y-2">
                                                {Object.entries(
                                                    allTasks.reduce((acc: any, t: any) => {
                                                        if (t.assignee) {
                                                            acc[t.assignee.name] = (acc[t.assignee.name] || 0) + 1;
                                                        }
                                                        return acc;
                                                    }, {})
                                                ).sort(([, a]: any, [, b]: any) => b - a).slice(0, 5).map(([name, count]: any) => (
                                                    <div key={name} className="flex justify-between items-center p-2 rounded-lg hover:bg-gray-800/30 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-6 h-6 rounded-full bg-accent-600/20 border border-accent-500/20 text-accent-400 flex items-center justify-center text-[9px] font-bold">
                                                                {name[0].toUpperCase()}
                                                            </div>
                                                            <span className="text-xs text-gray-300 font-medium">{name}</span>
                                                        </div>
                                                        <div className="text-[11px] text-gray-500 bg-gray-900 px-2 py-0.5 rounded-md border border-gray-800">
                                                            {count} tasks
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─── ACTIVITY VIEW ──────────────────────────────────────────────────── */}
                            {activeTab === 'activity' && (
                                <div className="p-8 max-w-3xl mx-auto space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-800/50 pb-4">
                                        <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                                            <Activity size={18} className="text-accent-500" /> Space Activity
                                        </h2>
                                        <div className="flex bg-gray-900/50 rounded-lg p-0.5">
                                            <button className="px-3 py-1 text-[11px] font-medium text-white bg-gray-700/50 rounded-md shadow-sm">All Activity</button>
                                            <button className="px-3 py-1 text-[11px] font-medium text-gray-500 hover:text-gray-300 transition-colors">Comments Only</button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Sort tasks by updatedAt to create a mock activity feed */}
                                        {[...allTasks]
                                            .filter(t => t.updatedAt)
                                            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                                            .slice(0, 20)
                                            .map((task: any, index: number) => {
                                                const actionUser = task.creator || task.assignee || user;
                                                return (
                                                    <div key={`activity-${task.id}-${index}`} className="flex gap-4 p-4 rounded-xl bg-gray-900/20 border border-gray-800/30 hover:border-gray-700/50 transition-colors">
                                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs ring-4 ring-[#0a0a0a]">
                                                            {actionUser?.name?.[0] || 'U'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs text-gray-400">
                                                                <span className="font-semibold text-gray-200">{actionUser?.name || 'System User'}</span>
                                                                {' modified task '}
                                                                <span className="font-medium text-accent-400 hover:underline cursor-pointer">{task.title}</span>
                                                            </div>
                                                            <div className="mt-1.5 flex items-center gap-3 text-[10px] text-gray-600">
                                                                <span className="flex items-center gap-1 bg-gray-800/50 px-1.5 py-0.5 rounded">
                                                                    <Hash size={10} /> {task.listName || 'List'}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={10} /> {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {/* Empty state if no tasks at all */}
                            {allTasks.length === 0 && !tasksLoading && activeTab === 'list' && (
                                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center">
                                        <FileText size={28} className="text-gray-800" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-gray-300">No tasks yet</h3>
                                        <p className="text-xs text-gray-600 max-w-xs">Create lists and add tasks to get started with this space.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Task Details Modal */}
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    spaceName={space.name}
                />
            )}
        </div>
    );
}

// ─── Task Row Component ───────────────────────────────────────────
function TaskRow({ task, listName, spaceName, user, onClick }: { task: any; listName?: string; spaceName?: string; user: any; onClick?: () => void }) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && isPast(dueDate) && task.status !== 'DONE';
    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;

    return (
        <div
            onClick={onClick}
            className="group grid grid-cols-12 gap-2 px-6 py-2.5 border-b border-gray-900/20 hover:bg-gray-800/15 transition-all cursor-pointer items-center"
        >
            {/* Name Column */}
            <div className="col-span-4 flex items-center gap-2 min-w-0">
                <ChevronRight size={12} className="text-gray-700 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="min-w-0">
                    {/* Breadcrumb */}
                    {(spaceName || listName) && (
                        <div className="flex items-center gap-1 text-[9px] text-gray-600 mb-0.5">
                            {spaceName && <span className="hover:text-gray-400 cursor-pointer">{spaceName}</span>}
                            {spaceName && listName && <span>/</span>}
                            {listName && <span className="hover:text-gray-400 cursor-pointer">{listName}</span>}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <div className={clsx(
                            "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0",
                            task.status === 'DONE' ? "border-green-500 bg-green-500" : "border-gray-600"
                        )}>
                            {task.status === 'DONE' && <CheckCircle2 size={10} className="text-white" />}
                        </div>
                        <span className="text-sm text-gray-200 font-medium truncate group-hover:text-white transition-colors">
                            {task.title}
                        </span>
                    </div>
                </div>
            </div>

            {/* Assignee */}
            <div className="col-span-1 flex items-center">
                {task.assignee ? (
                    <div className="w-6 h-6 rounded-full bg-accent-600/20 flex items-center justify-center text-[9px] font-bold text-accent-400 border border-accent-500/20">
                        {task.assignee.name?.[0]?.toUpperCase()}
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full border border-dashed border-gray-700 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
                        <Users size={10} className="text-gray-600" />
                    </div>
                )}
            </div>

            {/* Due date */}
            <div className="col-span-2">
                {dueDate ? (
                    <span className={clsx(
                        "text-[11px] font-medium",
                        isOverdue ? "text-red-400" : "text-gray-500"
                    )}>
                        {formatDistanceToNow(dueDate, { addSuffix: false })}
                        {isOverdue && ' ago'}
                        {!isOverdue && `, ${format(dueDate, 'h:mma').toLowerCase()}`}
                    </span>
                ) : (
                    <span className="text-[11px] text-gray-700">—</span>
                )}
            </div>

            {/* Priority */}
            <div className="col-span-1 flex items-center">
                <div className={clsx("flex items-center gap-1", priorityConfig.color)}>
                    <Flag size={12} />
                </div>
            </div>

            {/* Time tracked */}
            <div className="col-span-2 flex items-center gap-1">
                <Clock size={11} className="text-gray-600" />
                <span className="text-[11px] text-gray-500 font-medium">
                    {task.timeTracked
                        ? `${Math.floor(task.timeTracked / 3600)}h ${Math.floor((task.timeTracked % 3600) / 60)}m`
                        : 'Add time'
                    }
                </span>
            </div>

            {/* Comments */}
            <div className="col-span-2 flex items-center gap-1">
                <MessageSquare size={11} className="text-gray-600" />
                <span className="text-[11px] text-gray-500">
                    {task._count?.TaskComment || task.commentsCount || 0}
                </span>
            </div>
        </div>
    );
}

// ─── Board Task Card Component ─────────────────────────────────────
function BoardTaskCard({ task, listName, onClick }: { task: any; listName?: string; onClick?: () => void }) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && isPast(dueDate) && task.status !== 'DONE';
    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;

    return (
        <div
            onClick={onClick}
            className="group bg-[#0d0d0d] border border-gray-800/80 hover:border-gray-700 rounded-lg p-3 transition-all cursor-pointer shadow-sm hover:shadow-md hover:shadow-black/50"
        >
            {/* Context Breadcrumb */}
            {listName && (
                <div className="flex items-center gap-1.5 text-[9px] font-medium text-gray-500 mb-2">
                    <Hash size={10} className="text-gray-600" />
                    <span className="truncate hover:underline">{listName}</span>
                </div>
            )}

            {/* Title */}
            <div className="text-[13px] font-medium text-gray-200 leading-snug mb-3 group-hover:text-white transition-colors">
                {task.title}
            </div>

            {/* Footer metadata */}
            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                    {/* Assignee */}
                    {task.assignee ? (
                        <div className="w-5 h-5 rounded-full bg-accent-600/20 border border-accent-500/20 text-accent-400 flex items-center justify-center text-[8px] font-bold" title={task.assignee.name}>
                            {task.assignee.name?.[0]?.toUpperCase()}
                        </div>
                    ) : (
                        <div className="w-5 h-5 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-gray-600 opacity-50 group-hover:opacity-100">
                            <Users size={10} />
                        </div>
                    )}

                    {/* Due Date */}
                    {dueDate && (
                        <div className={clsx(
                            "flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded",
                            isOverdue ? "bg-red-500/10 text-red-400" : "bg-gray-800 text-gray-400"
                        )}>
                            <Calendar size={10} />
                            {format(dueDate, 'MMM d')}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Priority */}
                    <div className={clsx("flex items-center", priorityConfig.color)} title={priorityConfig.label}>
                        <Flag size={11} />
                    </div>

                    {/* Comments */}
                    {(task._count?.TaskComment > 0 || task.commentsCount > 0) && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <MessageSquare size={10} />
                            {task._count?.TaskComment || task.commentsCount || 0}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Task Modal Component ──────────────────────────────────────────
function TaskModal({ task, onClose, spaceName }: { task: any; onClose: () => void; spaceName?: string }) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && isPast(dueDate) && task.status !== 'DONE';
    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
    const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#0f0f0f] border border-gray-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80">
                    <div className="flex items-center gap-3">
                        <div className={clsx("px-2.5 py-1 rounded text-[10px] font-bold tracking-wider text-white", statusConfig.bgColor)}>
                            {statusConfig.label}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                            {spaceName} {task.listName && `› ${task.listName}`}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-100">{task.title}</h1>

                    {/* Meta Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Assignee</span>
                            <div className="flex items-center gap-2">
                                {task.assignee ? (
                                    <>
                                        <div className="w-6 h-6 rounded-full bg-accent-600/20 border border-accent-500/20 text-accent-400 flex items-center justify-center text-[10px] font-bold">
                                            {task.assignee.name?.[0]?.toUpperCase()}
                                        </div>
                                        <span className="text-sm text-gray-300 font-medium">{task.assignee.name}</span>
                                    </>
                                ) : (
                                    <span className="text-sm text-gray-600 italic flex items-center gap-1">
                                        <Users size={12} />
                                        Unassigned
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Due Date</span>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className={isOverdue ? "text-red-500" : "text-gray-500"} />
                                <span className={clsx("text-sm font-medium", isOverdue ? "text-red-400" : "text-gray-300")}>
                                    {dueDate ? format(dueDate, 'MMM d, yyyy') : 'No date'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Priority</span>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                <div className={priorityConfig.color}><Flag size={14} /></div>
                                {priorityConfig.label}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Time Tracked</span>
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                <Clock size={14} className="text-gray-500" />
                                {task.timeTracked
                                    ? `${Math.floor(task.timeTracked / 3600)}h ${Math.floor((task.timeTracked % 3600) / 60)}m`
                                    : 'None'
                                }
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-800" />

                    {/* Description */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-gray-400 flex items-center gap-2">
                            <AlignLeft size={16} /> Description
                        </h3>
                        {task.description ? (
                            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-gray-900/30 p-4 rounded-xl border border-gray-800/50">
                                {task.description}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-600 italic">No description provided.</div>
                        )}
                    </div>
                </div>

                {/* Footer (Activity / Comments placeholder) */}
                <div className="bg-gray-900/40 p-4 border-t border-gray-800 flex items-center justify-between">
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                        <MessageSquare size={14} /> {(task._count?.TaskComment || task.commentsCount || 0)} Comments
                    </div>
                    <div className="text-xs text-gray-600">
                        Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                    </div>
                </div>
            </div>
        </div>
    );
}
