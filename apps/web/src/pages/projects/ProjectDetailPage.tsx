import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { tasksApi, listsApi, orgsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Plus, Loader2, GripVertical, User, Calendar, Flag } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import FavoriteStar from '../../components/common/FavoriteStar';
import { getSocket } from '../../lib/socket';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import TaskModal from '../../components/tasks/TaskModal';

const COLUMNS = [
    { key: 'TODO', label: 'To Do', color: 'border-gray-600', dot: 'bg-gray-500' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-500', dot: 'bg-blue-500' },
    { key: 'IN_REVIEW', label: 'In Review', color: 'border-yellow-500', dot: 'bg-yellow-500' },
    { key: 'DONE', label: 'Done', color: 'border-green-500', dot: 'bg-green-500' },
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    URGENT: { label: 'Urgent', color: 'text-red-400 bg-red-900/40' },
    HIGH: { label: 'High', color: 'text-orange-400 bg-orange-900/40' },
    MEDIUM: { label: 'Medium', color: 'text-yellow-400 bg-yellow-900/40' },
    LOW: { label: 'Low', color: 'text-gray-400 bg-gray-800' },
};

export default function ProjectDetailPage() {
    const { listId } = useParams<{ listId: string }>();
    const activeOrg = useAuthStore((s) => s.activeOrg);
    const qc = useQueryClient();

    const [addingToCol, setAddingToCol] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [overCol, setOverCol] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch list meta
    const { data: list } = useQuery({
        queryKey: ['list', listId],
        queryFn: () => listsApi.get(listId!).then((r: any) => r.data.data),
        enabled: !!listId,
    });

    // Fetch tasks
    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks', listId],
        queryFn: () => tasksApi.list(listId!).then((r: any) => r.data.data),
        enabled: !!listId,
    });

    // Fetch org statuses to get real statusIds
    const { data: statusesRes } = useQuery({
        queryKey: ['org-statuses', activeOrg?.id],
        queryFn: () => orgsApi.statuses(activeOrg!.id),
        enabled: !!activeOrg,
        staleTime: 120_000,
    });
    const orgStatuses: any[] = statusesRes?.data?.data || statusesRes?.data || [];

    // Helper: get real statusId by category key
    const getStatusId = (categoryKey: string) => {
        const match = orgStatuses.find((s: any) => s.category === categoryKey);
        return match?.id ?? categoryKey; // fallback to key if not loaded yet
    };

    // Realtime socket events
    useEffect(() => {
        if (!activeOrg) return;
        const socket = getSocket();

        const handleTaskCreated = ({ listId: evListId, task }: any) => {
            if (evListId === listId) {
                qc.setQueryData(['tasks', listId], (old: any) => {
                    if (!old) return [task];
                    if (old.some((t: any) => t.id === task.id)) return old;
                    return [...old, task];
                });
            }
        };
        const handleTaskUpdated = ({ listId: evListId, task }: any) => {
            if (evListId === listId) {
                qc.setQueryData(['tasks', listId], (old: any) => {
                    if (!old) return old;
                    return old.map((t: any) => t.id === task.id ? { ...t, ...task } : t);
                });
            }
        };
        const handleTaskDeleted = ({ taskId, listId: delListId }: any) => {
            if (delListId === listId) {
                qc.setQueryData(['tasks', listId], (old: any) => {
                    if (!old) return old;
                    return old.filter((t: any) => t.id !== taskId);
                });
            }
        };

        socket.on('task.created', handleTaskCreated);
        socket.on('task.updated', handleTaskUpdated);
        socket.on('task.deleted', handleTaskDeleted);
        return () => {
            socket.off('task.created', handleTaskCreated);
            socket.off('task.updated', handleTaskUpdated);
            socket.off('task.deleted', handleTaskDeleted);
        };
    }, [activeOrg, listId, qc]);

    // Create task
    const createTask = useMutation({
        mutationFn: (data: { title: string; statusId: string; colKey: string }) =>
            tasksApi.create(listId!, { title: data.title, statusId: data.statusId }),
        onSuccess: (res, variables) => {
            const newTask = res.data?.data ?? res.data;
            const targetStatus = orgStatuses.find((s: any) => s.id === variables.statusId);
            const enrichedTask = {
                ...newTask,
                status: targetStatus || variables.colKey // fallback to colKey if targetStatus not found
            };

            qc.setQueryData(['tasks', listId], (old: any) => {
                if (!old) return [enrichedTask];
                if (old.some((t: any) => t.id === newTask.id)) return old;
                return [...old, enrichedTask];
            });
            setNewTaskTitle('');
            setAddingToCol(null);
            toast.success('Task created!');
        },
        onError: () => toast.error('Failed to create task'),
    });

    // Move task (optimistic)
    const moveTask = useMutation({
        mutationFn: ({ taskId, statusId }: { taskId: string; statusId: string }) =>
            tasksApi.move(listId!, taskId, { statusId }),
        onMutate: async ({ taskId, statusId }) => {
            await qc.cancelQueries({ queryKey: ['tasks', listId] });
            const previousTasks = qc.getQueryData(['tasks', listId]);
            // Optimistically update the status object on the task
            const targetStatus = orgStatuses.find((s: any) => s.id === statusId);
            qc.setQueryData(['tasks', listId], (old: any) => {
                if (!old) return old;
                return old.map((t: any) =>
                    t.id === taskId
                        ? { ...t, status: targetStatus ?? t.status, statusId }
                        : t
                );
            });
            return { previousTasks };
        },
        onError: (_err, _vars, context: any) => {
            if (context?.previousTasks) {
                qc.setQueryData(['tasks', listId], context.previousTasks);
            }
            toast.error('Failed to move task');
        },
    });

    // Group tasks by status category
    const tasksByCol = (categoryKey: string) =>
        tasks.filter((t: any) => (t.status?.category ?? t.status) === categoryKey);

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
        setDraggingId(taskId);
    };
    const handleDragEnd = () => {
        setDraggingId(null);
        setOverCol(null);
    };
    const handleDragOver = (e: React.DragEvent, colKey: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverCol(colKey);
    };
    const handleDrop = (e: React.DragEvent, colKey: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            const statusId = getStatusId(colKey);
            moveTask.mutate({ taskId, statusId });
        }
        setOverCol(null);
        setDraggingId(null);
    };

    const handleAddClick = (colKey: string) => {
        setAddingToCol(colKey);
        setNewTaskTitle('');
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleCreate = (colKey: string) => {
        if (!newTaskTitle.trim()) return;
        createTask.mutate({ title: newTaskTitle.trim(), statusId: getStatusId(colKey), colKey });
    };

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                        {list?.name ?? '...'}
                        {listId && <FavoriteStar entityType="LIST" entityId={listId} />}
                    </h1>
                    {list?.description && (
                        <p className="text-gray-500 text-sm mt-0.5">{list.description}</p>
                    )}
                </div>
            </div>

            {/* Kanban board */}
            {isLoading ? (
                <div className="flex gap-4 flex-1">
                    {COLUMNS.map((c) => (
                        <div key={c.key} className="flex-1 h-full bg-gray-900 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
                    {COLUMNS.map((col) => {
                        const colTasks = tasksByCol(col.key);
                        const isOver = overCol === col.key;
                        const isAddingHere = addingToCol === col.key;

                        return (
                            <div
                                key={col.key}
                                className={clsx(
                                    'flex-shrink-0 w-72 flex flex-col rounded-2xl border transition-all duration-150',
                                    isOver
                                        ? 'bg-gray-800/70 border-gray-600 shadow-lg ring-1 ring-inset ring-gray-700'
                                        : 'bg-gray-900 border-gray-800'
                                )}
                                onDragOver={(e) => handleDragOver(e, col.key)}
                                onDragLeave={() => setOverCol(null)}
                                onDrop={(e) => handleDrop(e, col.key)}
                            >
                                {/* Column header */}
                                <div className={clsx('flex items-center justify-between px-4 py-3 border-b border-l-2 rounded-t-2xl', col.color, 'border-b-gray-800')}>
                                    <div className="flex items-center gap-2">
                                        <span className={clsx('w-2 h-2 rounded-full', col.dot)} />
                                        <span className="text-sm font-semibold text-gray-300">{col.label}</span>
                                        <span className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full font-medium">
                                            {colTasks.length}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleAddClick(col.key)}
                                        className="w-6 h-6 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-200 hover:bg-gray-700 transition-colors"
                                        title="Add task"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                {/* Task list */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-2">

                                    {/* Quick-add input */}
                                    {isAddingHere && (
                                        <div className="rounded-xl border border-accent-500/50 bg-gray-800/80 p-3 space-y-2 shadow-xl ring-1 ring-accent-500/20">
                                            <input
                                                ref={inputRef}
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 outline-none focus:border-accent-500 transition-colors"
                                                placeholder="Task title..."
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleCreate(col.key);
                                                    else if (e.key === 'Escape') {
                                                        setAddingToCol(null);
                                                        setNewTaskTitle('');
                                                    }
                                                }}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setAddingToCol(null); setNewTaskTitle(''); }}
                                                    className="flex-1 py-1.5 text-xs text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleCreate(col.key)}
                                                    disabled={!newTaskTitle.trim() || createTask.isPending}
                                                    className="flex-1 py-1.5 text-xs bg-accent-600 hover:bg-accent-500 disabled:opacity-40 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-1"
                                                >
                                                    {createTask.isPending
                                                        ? <Loader2 size={11} className="animate-spin" />
                                                        : <><Plus size={11} /> Add Task</>
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Task cards */}
                                    {colTasks.map((task: any) => {
                                        const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                                        const isDragging = draggingId === task.id;
                                        return (
                                            <div
                                                key={task.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task.id)}
                                                onDragEnd={handleDragEnd}
                                                onClick={() => setSelectedTaskId(task.id)}
                                                className={clsx(
                                                    'rounded-xl border bg-gray-850 p-3 cursor-grab active:cursor-grabbing transition-all group select-none',
                                                    isDragging
                                                        ? 'opacity-40 scale-95 border-gray-600'
                                                        : 'border-gray-800 hover:border-gray-600 hover:shadow-lg hover:bg-gray-800/50'
                                                )}
                                                style={{ background: isDragging ? undefined : 'rgb(17 24 39 / 0.5)' }}
                                            >
                                                {/* Drag handle + title */}
                                                <div className="flex items-start gap-2 mb-3">
                                                    <GripVertical
                                                        size={13}
                                                        className="text-gray-700 group-hover:text-gray-500 mt-0.5 flex-shrink-0 transition-colors"
                                                    />
                                                    <p className="text-sm text-gray-200 leading-snug flex-1 font-medium">
                                                        {task.title}
                                                    </p>
                                                </div>

                                                {/* Meta row */}
                                                <div className="flex items-center gap-1.5 flex-wrap ml-5">
                                                    {/* Priority */}
                                                    <span className={clsx('flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide', pCfg.color)}>
                                                        <Flag size={8} />
                                                        {pCfg.label}
                                                    </span>

                                                    {/* Assignee */}
                                                    {task.assignee && (
                                                        <div className="flex items-center gap-1 bg-gray-800 text-gray-400 text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                                                            <div className="w-3.5 h-3.5 rounded-full bg-accent-700 flex items-center justify-center text-[8px] font-bold text-white">
                                                                {task.assignee.name[0]}
                                                            </div>
                                                            {task.assignee.name.split(' ')[0]}
                                                        </div>
                                                    )}

                                                    {/* Due date */}
                                                    {task.dueDate && (
                                                        <div className="flex items-center gap-1 bg-gray-800 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                                                            <Calendar size={9} />
                                                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    )}

                                                    {/* Comment count */}
                                                    {task._count?.TaskComment > 0 && (
                                                        <span className="ml-auto text-[10px] text-gray-600 font-medium">
                                                            💬 {task._count.TaskComment}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Empty column drop zone */}
                                    {colTasks.length === 0 && !isAddingHere && (
                                        <div
                                            onClick={() => handleAddClick(col.key)}
                                            className={clsx(
                                                'h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all',
                                                isOver
                                                    ? 'border-accent-500/60 bg-accent-900/10 text-accent-400'
                                                    : 'border-gray-800 hover:border-gray-700 text-gray-700 hover:text-gray-600'
                                            )}
                                        >
                                            <Plus size={16} className="opacity-60" />
                                            <p className="text-xs font-medium">
                                                {isOver ? 'Drop here' : 'Click to add'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedTaskId && (
                <TaskModal
                    taskId={selectedTaskId}
                    listId={listId!}
                    onClose={() => setSelectedTaskId(null)}
                />
            )}
        </div>
    );
}
