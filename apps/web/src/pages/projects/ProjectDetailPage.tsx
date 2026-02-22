import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { tasksApi, listsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Plus, Loader2, GripVertical, User, Calendar, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import FavoriteStar from '../../components/common/FavoriteStar';
import { getSocket } from '../../lib/socket';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const COLUMNS = [
    { key: 'TODO', label: 'To Do', color: 'border-gray-600' },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-500' },
    { key: 'IN_REVIEW', label: 'In Review', color: 'border-yellow-500' },
    { key: 'DONE', label: 'Done', color: 'border-green-500' },
];

export default function ProjectDetailPage() {
    const { listId } = useParams<{ listId: string }>();
    const activeOrg = useAuthStore((s) => s.activeOrg);
    const qc = useQueryClient();
    const [addingToCol, setAddingToCol] = useState<string | null>(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const { data: list } = useQuery({
        queryKey: ['list', listId],
        queryFn: () => listsApi.get(listId!).then((r: any) => r.data.data),
        enabled: !!listId,
    });

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks', listId],
        queryFn: () => tasksApi.list(listId!).then((r: any) => r.data.data),
        enabled: !!listId,
    });

    // Realtime: listen for task events
    // Realtime: listen for task events
    useEffect(() => {
        if (!activeOrg) return;
        const socket = getSocket();

        const handleTaskCreated = ({ listId: eventListId, task }: any) => {
            if (eventListId === listId) {
                qc.setQueryData(['tasks', listId], (old: any) => {
                    if (!old) return [task];
                    // Prevent duplicate drops if we already optimism-added it
                    if (old.some((t: any) => t.id === task.id)) return old;
                    return [...old, task];
                });
            }
        };

        const handleTaskUpdated = ({ listId: eventListId, task }: any) => {
            if (eventListId === listId) {
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

    const createTask = useMutation({
        mutationFn: (data: { title: string; status: string }) =>
            tasksApi.create(listId!, data),
        onSuccess: (res) => {
            const newTask = res.data.data;
            qc.setQueryData(['tasks', listId], (old: any) => {
                if (!old) return [newTask];
                if (old.some((t: any) => t.id === newTask.id)) return old;
                return [...old, newTask];
            });
            setNewTaskTitle('');
            setAddingToCol(null);
            toast.success('Task created!');
        },
        onError: () => toast.error('Failed to create task'),
    });

    const moveTask = useMutation({
        mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
            tasksApi.move(listId!, taskId, { status }),
        onMutate: async ({ taskId, status }) => {
            await qc.cancelQueries({ queryKey: ['tasks', listId] });
            const previousTasks = qc.getQueryData(['tasks', listId]);
            qc.setQueryData(['tasks', listId], (old: any) => {
                if (!old) return old;
                return old.map((t: any) => t.id === taskId ? { ...t, status } : t);
            });
            return { previousTasks };
        },
        onError: (err, variables, context: any) => {
            if (context?.previousTasks) {
                qc.setQueryData(['tasks', listId], context.previousTasks);
            }
            toast.error('Failed to move task');
        },
    });

    const tasksByCol = (status: string) =>
        tasks.filter((t: any) => t.status === status);

    const handleDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) moveTask.mutate({ taskId, status });
    };

    const PRIORITY_COLORS: Record<string, string> = {
        LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high', URGENT: 'badge-urgent',
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div>
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
                    {COLUMNS.map((col) => (
                        <div
                            key={col.key}
                            className="flex-shrink-0 w-72 flex flex-col rounded-2xl bg-gray-900 border border-gray-800"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, col.key)}
                        >
                            {/* Column header */}
                            <div className={clsx('flex items-center justify-between px-4 py-3 border-b border-gray-800 border-l-2', col.color)}>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-300">{col.label}</span>
                                    <span className="text-xs bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-full">
                                        {tasksByCol(col.key).length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setAddingToCol(col.key)}
                                    className="btn-ghost p-1 rounded-lg"
                                    title="Add task"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            {/* Tasks */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                {/* Quick add */}
                                {addingToCol === col.key && (
                                    <div className="card p-3 space-y-2 animate-slide-in-up">
                                        <input
                                            className="input text-sm py-1.5"
                                            placeholder="Task title..."
                                            value={newTaskTitle}
                                            onChange={(e) => setNewTaskTitle(e.target.value)}
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && newTaskTitle) {
                                                    createTask.mutate({ title: newTaskTitle, status: col.key });
                                                } else if (e.key === 'Escape') {
                                                    setAddingToCol(null);
                                                    setNewTaskTitle('');
                                                }
                                            }}
                                        />
                                        <div className="flex gap-1.5">
                                            <button onClick={() => { setAddingToCol(null); setNewTaskTitle(''); }} className="btn-ghost btn-sm text-xs">Cancel</button>
                                            <button
                                                onClick={() => newTaskTitle && createTask.mutate({ title: newTaskTitle, status: col.key })}
                                                disabled={!newTaskTitle || createTask.isPending}
                                                className="btn-primary btn-sm text-xs"
                                            >
                                                {createTask.isPending ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {tasksByCol(col.key).map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="card p-3 hover:border-gray-700 transition-all cursor-grab active:cursor-grabbing hover:shadow-card"
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
                                    >
                                        <div className="flex items-start gap-2 mb-2">
                                            <GripVertical size={13} className="text-gray-700 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-gray-200 leading-snug flex-1">{task.title}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={PRIORITY_COLORS[task.priority] || 'badge'}>
                                                {task.priority.toLowerCase()}
                                            </span>
                                            {task.assignee && (
                                                <div className="flex items-center gap-1 badge bg-gray-800 text-gray-400">
                                                    <User size={10} />
                                                    <span>{task.assignee.name}</span>
                                                </div>
                                            )}
                                            {task.dueDate && (
                                                <div className="flex items-center gap-1 badge bg-gray-800 text-gray-500">
                                                    <Calendar size={10} />
                                                    <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {tasksByCol(col.key).length === 0 && !addingToCol && (
                                    <div
                                        className="h-20 border-2 border-dashed border-gray-800 rounded-xl flex items-center justify-center cursor-pointer hover:border-gray-700 transition-colors"
                                        onClick={() => setAddingToCol(col.key)}
                                    >
                                        <p className="text-xs text-gray-700">Drop here or click to add</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
