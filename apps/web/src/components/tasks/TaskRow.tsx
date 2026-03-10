import { useState } from 'react';
import {
    Users, Calendar, Flag, Clock, MessageSquare, CheckCircle2, X, Hash
} from 'lucide-react';
import { clsx } from 'clsx';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export const STATUS_CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    TODO: { label: 'TO DO', color: 'text-gray-400', bgColor: 'bg-gray-600' },
    IN_PROGRESS: { label: 'IN PROGRESS', color: 'text-blue-400', bgColor: 'bg-blue-600' },
    IN_REVIEW: { label: 'PM REVIEW', color: 'text-orange-400', bgColor: 'bg-orange-600' },
    DONE: { label: 'DONE', color: 'text-green-400', bgColor: 'bg-green-600' },
    CANCELLED: { label: 'CANCELLED', color: 'text-red-400', bgColor: 'bg-red-600' },
};

export const PRIORITY_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    URGENT: { icon: '🚩', color: 'text-red-500', label: 'Urgent' },
    HIGH: { icon: '🔴', color: 'text-orange-500', label: 'High' },
    MEDIUM: { icon: '🟡', color: 'text-yellow-500', label: 'Medium' },
    LOW: { icon: '⚪', color: 'text-gray-500', label: 'Low' },
};

interface StatusObj { id: string; name: string; color?: string; category: string; order?: number; }

interface TaskRowProps {
    task: any;
    listName?: string;
    spaceName?: string;
    user: any;
    members?: any[];
    statuses?: StatusObj[];   // real status objects with .id (from fetched tasks)
    onClick?: () => void;
    onUpdate?: (taskId: string, data: any) => void;
}

export default function TaskRow({ task, listName, spaceName, user, members = [], statuses = [], onClick, onUpdate }: TaskRowProps) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const isOverdue = dueDate && isPast(dueDate) && task.status?.category !== 'DONE';
    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;

    // Which popover is open: 'status' | 'assignee' | 'priority' | 'due' | 'time' | null
    const [openPopover, setOpenPopover] = useState<string | null>(null);
    const [timeInput, setTimeInput] = useState('');

    const togglePopover = (name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenPopover(prev => prev === name ? null : name);
    };
    const closeAll = () => setOpenPopover(null);

    const update = (data: any, e?: React.MouseEvent) => {
        e?.stopPropagation();
        onUpdate?.(task.id, data);
        closeAll();
    };

    // Status circle border color based on category
    const statusCategory = task.status?.category || 'TODO';
    const statusCircleClass = clsx(
        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110",
        statusCategory === 'DONE' ? "border-green-500 bg-green-500"
            : statusCategory === 'IN_PROGRESS' ? "border-blue-500"
                : statusCategory === 'IN_REVIEW' ? "border-orange-500"
                    : statusCategory === 'CANCELLED' ? "border-red-500 bg-red-500/20"
                        : "border-gray-600 hover:border-gray-400"
    );

    // Sort statuses by order for the popover
    const sortedStatuses = [...statuses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
        <div
            onClick={onClick}
            className="group grid grid-cols-12 gap-2 px-6 py-2.5 border-b border-gray-900/20 hover:bg-gray-800/15 transition-all cursor-pointer items-center relative"
        >
            {/* Overlay to close popovers when clicking outside */}
            {openPopover && (
                <div
                    className="fixed inset-0 z-[15]"
                    onClick={(e) => { e.stopPropagation(); closeAll(); }}
                />
            )}

            {/* ── Name Column ──────────────────────────────────────────── */}
            <div className="col-span-4 flex items-center gap-2 min-w-0">
                {/* Clickable Status Circle */}
                <div className="relative flex-shrink-0 z-20">
                    <button
                        onClick={(e) => togglePopover('status', e)}
                        title={`Status: ${task.status?.name || 'To Do'}`}
                        className={statusCircleClass}
                    >
                        {statusCategory === 'DONE' && <CheckCircle2 size={10} className="text-white" />}
                    </button>

                    {openPopover === 'status' && (
                        <div
                            className="absolute left-0 top-6 z-30 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-1.5 min-w-[170px]"
                            onClick={e => e.stopPropagation()}
                        >
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider px-2 pt-1 pb-2">Change Status</p>
                            {sortedStatuses.length > 0 ? (
                                sortedStatuses.map((s) => {
                                    const catCfg = STATUS_CATEGORY_CONFIG[s.category] || STATUS_CATEGORY_CONFIG.TODO;
                                    const isCurrent = task.status?.id === s.id;
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={(e) => update({ statusId: s.id }, e)}
                                            className={clsx(
                                                "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-gray-800",
                                                isCurrent ? "bg-gray-800/80 text-white" : "text-gray-400"
                                            )}
                                        >
                                            <span
                                                className="w-2 h-2 rounded-sm flex-shrink-0"
                                                style={{ backgroundColor: s.color || '#6b7280' }}
                                            />
                                            {s.name}
                                            {isCurrent && <CheckCircle2 size={10} className="text-green-400 ml-auto" />}
                                        </button>
                                    );
                                })
                            ) : (
                                // Fallback: if no statuses yet (empty space), use categories
                                Object.entries(STATUS_CATEGORY_CONFIG).map(([cat, cfg]) => (
                                    <button
                                        key={cat}
                                        onClick={(e) => update({ status: cat }, e)}
                                        className={clsx(
                                            "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-gray-800",
                                            statusCategory === cat ? "bg-gray-800/80 text-white" : "text-gray-400"
                                        )}
                                    >
                                        <span className={clsx("w-2 h-2 rounded-sm", cfg.bgColor)} />
                                        {cfg.label}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    {/* Breadcrumb */}
                    {(spaceName || listName) && (
                        <div className="flex items-center gap-1 text-[9px] text-gray-600 mb-0.5">
                            {spaceName && <span>{spaceName}</span>}
                            {spaceName && listName && <span>/</span>}
                            {listName && <span><Hash size={8} className="inline" />{listName}</span>}
                        </div>
                    )}
                    <span className="text-sm text-gray-200 font-medium truncate group-hover:text-white transition-colors block">
                        {task.title}
                    </span>
                </div>
            </div>

            {/* ── Assignee ─────────────────────────────────────────────── */}
            <div className="col-span-1 flex items-center">
                <div className="relative z-20">
                    <button
                        onClick={(e) => togglePopover('assignee', e)}
                        title={task.assignee ? `Assigned: ${task.assignee.name}` : "Assign someone"}
                        className="hover:scale-110 transition-transform"
                    >
                        {task.assignee ? (
                            <div className="w-6 h-6 rounded-full bg-accent-600/20 flex items-center justify-center text-[9px] font-bold text-accent-400 border border-accent-500/30 hover:border-accent-400">
                                {(task.assignee.name || task.assignee.email)?.[0]?.toUpperCase()}
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full border border-dashed border-gray-700 hover:border-gray-500 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-all">
                                <Users size={10} className="text-gray-500" />
                            </div>
                        )}
                    </button>

                    {openPopover === 'assignee' && (
                        <div
                            className="absolute left-0 top-8 z-30 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-1.5 min-w-[190px]"
                            onClick={e => e.stopPropagation()}
                        >
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider px-2 pt-1 pb-2">Assign to</p>
                            <button
                                onClick={(e) => update({ assigneeId: null }, e)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-gray-800 transition-colors"
                            >
                                <div className="w-5 h-5 rounded-full border border-dashed border-gray-600 flex items-center justify-center">
                                    <X size={9} />
                                </div>
                                Unassigned
                                {!task.assignee && <CheckCircle2 size={10} className="text-green-400 ml-auto" />}
                            </button>
                            {members.map((m: any) => (
                                <button
                                    key={m.id}
                                    onClick={(e) => update({ assigneeId: m.id }, e)}
                                    className={clsx(
                                        "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-gray-800",
                                        task.assignee?.id === m.id ? "bg-gray-800/80 text-white" : "text-gray-400"
                                    )}
                                >
                                    <div className="w-5 h-5 rounded-full bg-accent-600/30 flex items-center justify-center text-[9px] font-bold text-accent-300 flex-shrink-0">
                                        {(m.name || m.email)?.[0]?.toUpperCase()}
                                    </div>
                                    <span className="truncate">{m.name || m.email}</span>
                                    {task.assignee?.id === m.id && <CheckCircle2 size={10} className="text-green-400 ml-auto flex-shrink-0" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Due Date ─────────────────────────────────────────────── */}
            <div className="col-span-2">
                <div className="relative z-20">
                    <button
                        onClick={(e) => togglePopover('due', e)}
                        className="flex items-center gap-1 text-left hover:bg-gray-800/50 px-1.5 py-0.5 rounded transition-colors"
                        title="Set due date"
                    >
                        {dueDate ? (
                            <span className={clsx("text-[11px] font-medium flex items-center gap-1", isOverdue ? "text-red-400" : "text-gray-400")}>
                                <Calendar size={10} className="opacity-60" />
                                {isOverdue ? `${formatDistanceToNow(dueDate)} ago` : format(dueDate, 'MMM d')}
                            </span>
                        ) : (
                            <span className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors flex items-center gap-1">
                                <Calendar size={10} />
                                Set date
                            </span>
                        )}
                    </button>

                    {openPopover === 'due' && (
                        <div
                            className="absolute left-0 top-8 z-30 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-3 min-w-[200px]"
                            onClick={e => e.stopPropagation()}
                        >
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">Due Date</p>
                            <input
                                type="date"
                                defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    if (e.target.value) {
                                        update({ dueDate: new Date(e.target.value).toISOString() });
                                    }
                                }}
                                className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-accent-500 cursor-pointer"
                            />
                            {task.dueDate && (
                                <button
                                    onClick={(e) => update({ dueDate: null }, e)}
                                    className="mt-2 w-full text-xs text-red-400 hover:text-red-300 hover:bg-gray-800 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                >
                                    <X size={10} /> Clear date
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Priority ─────────────────────────────────────────────── */}
            <div className="col-span-1">
                <div className="relative z-20">
                    <button
                        onClick={(e) => togglePopover('priority', e)}
                        title={`Priority: ${priorityConfig.label}`}
                        className={clsx("flex items-center gap-1 hover:bg-gray-800/50 px-1.5 py-0.5 rounded transition-colors", priorityConfig.color)}
                    >
                        <Flag size={12} />
                    </button>

                    {openPopover === 'priority' && (
                        <div
                            className="absolute left-0 top-8 z-30 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-1.5 min-w-[140px]"
                            onClick={e => e.stopPropagation()}
                        >
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider px-2 pt-1 pb-2">Priority</p>
                            {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    onClick={(e) => update({ priority: key }, e)}
                                    className={clsx(
                                        "w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-gray-800",
                                        task.priority === key ? "bg-gray-800/80 text-white" : "text-gray-400",
                                        cfg.color
                                    )}
                                >
                                    <Flag size={11} />
                                    {cfg.label}
                                    {task.priority === key && <CheckCircle2 size={10} className="text-green-400 ml-auto" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Time Estimate ────────────────────────────────────────── */}
            <div className="col-span-2">
                <div className="relative z-20">
                    <button
                        onClick={(e) => togglePopover('time', e)}
                        className="flex items-center gap-1 hover:bg-gray-800/50 px-1.5 py-0.5 rounded transition-colors"
                        title="Set time estimate"
                    >
                        <Clock size={11} className="text-gray-600" />
                        <span className="text-[11px] font-medium">
                            {task.timeEstimate
                                ? <span className="text-gray-400">{Math.floor(task.timeEstimate / 60)}h {task.timeEstimate % 60}m est.</span>
                                : <span className="text-gray-700 hover:text-gray-500 transition-colors">Add time</span>
                            }
                        </span>
                    </button>

                    {openPopover === 'time' && (
                        <div
                            className="absolute left-0 top-8 z-30 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-3 min-w-[220px]"
                            onClick={e => e.stopPropagation()}
                        >
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Time Estimate</p>
                            <p className="text-[10px] text-gray-600 mb-2">Enter minutes (e.g. 90 = 1h 30m)</p>
                            {task.timeEstimate > 0 && (
                                <p className="text-[10px] text-gray-500 mb-2 bg-gray-800/50 px-2 py-1 rounded">
                                    <Clock size={9} className="inline mr-1" />
                                    Current: {Math.floor(task.timeEstimate / 60)}h {task.timeEstimate % 60}m
                                </p>
                            )}
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Minutes"
                                    min="1"
                                    value={timeInput}
                                    onChange={(e) => { e.stopPropagation(); setTimeInput(e.target.value); }}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter' && timeInput) {
                                            update({ timeEstimate: parseInt(timeInput) });
                                            setTimeInput('');
                                        }
                                    }}
                                    className="flex-1 bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-accent-500"
                                    autoFocus
                                />
                                <button
                                    onClick={(e) => {
                                        if (timeInput) {
                                            update({ timeEstimate: parseInt(timeInput) }, e);
                                            setTimeInput('');
                                        }
                                    }}
                                    className="px-3 py-1.5 text-xs bg-accent-600 hover:bg-accent-500 text-white rounded-lg transition-colors font-medium"
                                >
                                    Set
                                </button>
                            </div>
                            {task.timeEstimate > 0 && (
                                <button
                                    onClick={(e) => update({ timeEstimate: null }, e)}
                                    className="mt-2 w-full text-xs text-red-400 hover:text-red-300 hover:bg-gray-800 py-1 rounded-lg transition-colors"
                                >
                                    Clear estimate
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Comments ─────────────────────────────────────────────── */}
            <div className="col-span-2 flex items-center gap-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onClick?.(); }}
                    className="flex items-center gap-1.5 hover:bg-gray-800/50 px-1.5 py-0.5 rounded transition-colors group/comments"
                    title="Open task & view comments"
                >
                    <MessageSquare size={11} className="text-gray-600 group-hover/comments:text-accent-400 transition-colors" />
                    <span className="text-[11px] text-gray-500 group-hover/comments:text-gray-300 transition-colors">
                        {task._count?.TaskComment || task.commentsCount || 0}
                    </span>
                </button>
            </div>
        </div>
    );
}
