import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, User, Clock, CheckSquare, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { tasksApi, usersApi, orgsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import TimeTracking from './TimeTracking';

export default function TaskModal({ taskId, listId, onClose }: { taskId: string, listId: string, onClose: () => void }) {
    const qc = useQueryClient();

    const { data: task, isLoading } = useQuery({
        queryKey: ['task', taskId],
        queryFn: () => tasksApi.get(listId, taskId).then(r => r.data.data),
        enabled: !!taskId && !!listId,
    });

    const activeOrg = useAuthStore(s => s.activeOrg);

    const { data: usersRes } = useQuery({
        queryKey: ['org-users', activeOrg?.id],
        queryFn: () => usersApi.search(''),
        enabled: !!activeOrg,
    });
    const users = usersRes?.data?.data || [];

    const { data: statusesRes } = useQuery({
        queryKey: ['org-statuses', activeOrg?.id],
        queryFn: () => orgsApi.statuses(activeOrg!.id),
        enabled: !!activeOrg,
        staleTime: 120_000,
    });
    const orgStatuses: any[] = statusesRes?.data?.data || statusesRes?.data || [];

    const updateTask = useMutation({
        mutationFn: (data: any) => tasksApi.update(listId, taskId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['task', taskId] });
            qc.invalidateQueries({ queryKey: ['tasks', listId] });
        }
    });

    const addChecklist = useMutation({
        mutationFn: (name: string) => tasksApi.addChecklist(listId, taskId, { name }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] })
    });

    const removeChecklist = useMutation({
        mutationFn: (checklistId: string) => tasksApi.removeChecklist(listId, taskId, checklistId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] })
    });

    const addChecklistItem = useMutation({
        mutationFn: ({ checklistId, name }: { checklistId: string, name: string }) => tasksApi.addChecklistItem(listId, taskId, checklistId, { name }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] })
    });

    const toggleChecklistItem = useMutation({
        mutationFn: ({ checklistId, itemId, isResolved }: { checklistId: string, itemId: string, isResolved: boolean }) => tasksApi.updateChecklistItem(listId, taskId, checklistId, itemId, { isResolved }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] })
    });

    const removeChecklistItem = useMutation({
        mutationFn: ({ checklistId, itemId }: { checklistId: string, itemId: string }) => tasksApi.removeChecklistItem(listId, taskId, checklistId, itemId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] })
    });

    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newChecklistName, setNewChecklistName] = useState('');
    const [newItemNames, setNewItemNames] = useState<Record<string, string>>({});

    const createSubtask = useMutation({
        mutationFn: (title: string) => tasksApi.create(listId, { title, parentId: taskId }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['task', taskId] });
            qc.invalidateQueries({ queryKey: ['tasks', listId] });
            setNewSubtaskTitle('');
        }
    });

    const deleteSubtask = useMutation({
        mutationFn: (subtaskId: string) => tasksApi.delete(listId, subtaskId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['task', taskId] });
            qc.invalidateQueries({ queryKey: ['tasks', listId] });
        }
    });

    const [newDepId, setNewDepId] = useState('');
    const [newDepType, setNewDepType] = useState<'BLOCKING' | 'WAITING_ON'>('WAITING_ON');

    const addDependency = useMutation({
        mutationFn: () => tasksApi.addDependency(listId, taskId, { dependentTaskId: newDepId, type: newDepType }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['task', taskId] });
            setNewDepId('');
        }
    });

    const removeDependency = useMutation({
        mutationFn: (depId: string) => tasksApi.removeDependency(listId, taskId, depId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] })
    });

    if (isLoading || !task) return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-gray-900 rounded-2xl w-full max-w-4xl h-[80vh] flex items-center justify-center animate-pulse border border-gray-800">
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gray-900 shadow-2xl rounded-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden border border-gray-800 animate-slide-in-up">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex items-center gap-3 w-full">
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">{task.id.slice(0, 8)}</span>
                        <input
                            defaultValue={task.title}
                            onBlur={(e) => updateTask.mutate({ title: e.target.value })}
                            className="bg-transparent border-none text-xl font-bold text-gray-100 flex-1 focus:outline-none focus:ring-0"
                        />
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors ml-4 p-2 rounded-lg hover:bg-gray-800">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 flex gap-8">
                    {/* Left Column: Description, Subtasks, Checklists, Dependencies */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Description</h3>
                            <textarea
                                defaultValue={task.description || ''}
                                onBlur={(e) => updateTask.mutate({ description: e.target.value })}
                                placeholder="Add a description..."
                                className="w-full bg-gray-950/50 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 min-h-[120px] focus:outline-none focus:border-indigo-500 transition-colors resize-y"
                            />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                                <LinkIcon size={14} /> Subtasks
                            </h3>
                            <div className="space-y-2">
                                {(task.subtasks || []).map((subtask: any) => (
                                    <div key={subtask.id} className="flex items-center justify-between bg-gray-800/30 border border-gray-800 rounded-lg p-3 hover:border-gray-700 transition-colors">
                                        <div className="flex items-center gap-3">
                                            {subtask.assignee && (
                                                <div className="flex items-center gap-1.5 badge bg-gray-900 text-gray-400">
                                                    <User size={12} />
                                                    <span className="text-xs">{subtask.assignee.name}</span>
                                                </div>
                                            )}
                                            <button onClick={() => deleteSubtask.mutate(subtask.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Subtask */}
                                <div className="flex gap-2 items-center bg-gray-950/50 border border-gray-800 rounded-lg px-3 py-2">
                                    <input
                                        placeholder="Add a subtask..."
                                        className="bg-transparent border-none text-sm text-gray-300 flex-1 focus:outline-none focus:ring-0"
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newSubtaskTitle) {
                                                createSubtask.mutate(newSubtaskTitle);
                                            }
                                        }}
                                    />
                                    {newSubtaskTitle && (
                                        <button onClick={() => createSubtask.mutate(newSubtaskTitle)} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Create</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Checklists Section Placeholder */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide flex items-center justify-between">
                                <span className="flex items-center gap-2"><CheckSquare size={14} /> Checklists</span>
                            </h3>
                            <div className="space-y-4">
                                {(task.checklists || []).map((checklist: any) => (
                                    <div key={checklist.id} className="bg-gray-800/30 border border-gray-800 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                                            <span className="font-medium text-gray-200 text-sm">{checklist.name}</span>
                                            <button onClick={() => removeChecklist.mutate(checklist.id)} className="text-gray-500 hover:text-red-400">
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {(checklist.items || []).sort((a: any, b: any) => a.order - b.order).map((item: any) => (
                                                <div key={item.id} className="flex items-center gap-2 text-sm text-gray-300 hover:bg-gray-800/50 p-1.5 rounded -mx-1.5 group">
                                                    <input
                                                        type="checkbox"
                                                        checked={item.isResolved}
                                                        onChange={(e) => toggleChecklistItem.mutate({ checklistId: checklist.id, itemId: item.id, isResolved: e.target.checked })}
                                                        className="rounded bg-gray-900 border-gray-600 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                                    />
                                                    <span className={clsx("flex-1", item.isResolved && "line-through text-gray-500")}>
                                                        {item.name}
                                                    </span>
                                                    <button onClick={() => removeChecklistItem.mutate({ checklistId: checklist.id, itemId: item.id })} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex gap-2 mt-2">
                                                <input
                                                    placeholder="Add an item..."
                                                    className="w-full bg-transparent border-none text-sm text-gray-400 focus:text-gray-200 focus:outline-none focus:ring-0"
                                                    value={newItemNames[checklist.id] || ''}
                                                    onChange={(e) => setNewItemNames(prev => ({ ...prev, [checklist.id]: e.target.value }))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && newItemNames[checklist.id]) {
                                                            addChecklistItem.mutate({ checklistId: checklist.id, name: newItemNames[checklist.id] });
                                                            setNewItemNames(prev => ({ ...prev, [checklist.id]: '' }));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add New Checklist */}
                                <div className="flex gap-2 items-center bg-gray-950/50 border border-gray-800 rounded-lg px-3 py-2">
                                    <input
                                        placeholder="Add a new checklist..."
                                        className="bg-transparent border-none text-sm text-gray-300 flex-1 focus:outline-none focus:ring-0"
                                        value={newChecklistName}
                                        onChange={(e) => setNewChecklistName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newChecklistName) {
                                                addChecklist.mutate(newChecklistName);
                                                setNewChecklistName('');
                                            }
                                        }}
                                    />
                                    {newChecklistName && (
                                        <button onClick={() => { addChecklist.mutate(newChecklistName); setNewChecklistName(''); }} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Add</button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dependencies Section Placeholder */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                                <AlertCircle size={14} /> Dependencies
                            </h3>
                            <div className="space-y-4">
                                {task.waitingOnTasks?.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500 font-medium">WAITING ON</p>
                                        {task.waitingOnTasks.map((dep: any) => (
                                            <div key={dep.id} className="flex justify-between items-center bg-gray-800/30 p-2 rounded border border-gray-800">
                                                <span className="text-sm text-gray-300">{dep.blockingTask?.title || dep.blockingId}</span>
                                                <button onClick={() => removeDependency.mutate(dep.id)} className="text-gray-600 hover:text-red-400"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {task.blockingTasks?.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500 font-medium">BLOCKING</p>
                                        {task.blockingTasks.map((dep: any) => (
                                            <div key={dep.id} className="flex justify-between items-center bg-gray-800/30 p-2 rounded border border-gray-800">
                                                <span className="text-sm text-gray-300">{dep.waitingOnTask?.title || dep.waitingOnId}</span>
                                                <button onClick={() => removeDependency.mutate(dep.id)} className="text-gray-600 hover:text-red-400"><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add new Dependency */}
                                <div className="flex gap-2 items-center bg-gray-950/50 border border-gray-800 rounded-lg px-3 py-2">
                                    <select
                                        className="bg-transparent text-xs text-gray-400 border-none outline-none focus:ring-0"
                                        value={newDepType}
                                        onChange={(e: any) => setNewDepType(e.target.value)}
                                    >
                                        <option value="WAITING_ON">Waiting On</option>
                                        <option value="BLOCKING">Blocking</option>
                                    </select>
                                    <input
                                        placeholder="Task ID..."
                                        className="bg-transparent border-none text-sm text-gray-300 flex-1 focus:outline-none focus:ring-0"
                                        value={newDepId}
                                        onChange={(e) => setNewDepId(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newDepId) {
                                                addDependency.mutate();
                                            }
                                        }}
                                    />
                                    {newDepId && (
                                        <button onClick={() => addDependency.mutate()} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Add</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Properties Sidebar */}
                    <div className="w-72 flex-shrink-0 space-y-6 bg-gray-900/40 p-5 rounded-xl border border-gray-800 h-fit">
                        {/* Status */}
                        <div>
                            <span className="text-xs text-gray-500 font-medium mb-1.5 block">STATUS</span>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.status?.color || '#3b82f6' }} />
                                </div>
                                <select
                                    value={task.statusId}
                                    onChange={(e) => updateTask.mutate({ statusId: e.target.value })}
                                    className="bg-gray-800/50 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-0 focus:border-indigo-500 block w-full pl-8 p-2 appearance-none outline-none cursor-pointer font-medium"
                                >
                                    {orgStatuses.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Assignee */}
                        <div>
                            <span className="text-xs text-gray-500 font-medium mb-1.5 block">ASSIGNEE</span>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={14} className="text-gray-400" />
                                </div>
                                <select
                                    value={task.assigneeId || ''}
                                    onChange={(e) => updateTask.mutate({ assigneeId: e.target.value || null })}
                                    className="bg-gray-800/50 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-0 focus:border-indigo-500 block w-full pl-8 p-2 appearance-none outline-none cursor-pointer"
                                >
                                    <option value="">Unassigned</option>
                                    {users.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <span className="text-xs text-gray-500 font-medium mb-1.5 block">PRIORITY</span>
                            <select
                                value={task.priority}
                                onChange={(e) => updateTask.mutate({ priority: e.target.value })}
                                className="bg-gray-800/50 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-0 focus:border-indigo-500 block w-full p-2 outline-none"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>

                        {/* Dates */}
                        <div>
                            <span className="text-xs text-gray-500 font-medium mb-3 block flex items-center gap-1.5">
                                <Calendar size={12} /> DATES
                            </span>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Start:</span>
                                    <input
                                        type="date"
                                        value={task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => updateTask.mutate({ startDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                        className="bg-gray-800/50 text-gray-200 border border-gray-700 rounded-md py-1 px-2 text-xs outline-none cursor-pointer"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Due:</span>
                                    <input
                                        type="date"
                                        value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                                        onChange={(e) => updateTask.mutate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                        className="bg-gray-800/50 text-gray-200 border border-gray-700 rounded-md py-1 px-2 text-xs outline-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Estimates */}
                        <div>
                            <span className="text-xs text-gray-500 font-medium mb-1.5 block flex items-center gap-1.5">
                                <Clock size={12} /> ESTIMATE (MINS)
                            </span>
                            <input
                                type="number"
                                placeholder="e.g. 60"
                                defaultValue={task.timeEstimate || ''}
                                onBlur={(e) => updateTask.mutate({ timeEstimate: e.target.value ? parseInt(e.target.value) : null })}
                                className="w-full bg-gray-800/30 border border-gray-800 rounded-lg p-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                            />
                        </div>

                        {/* Implementation: Time Tracking */}
                        <div className="pt-4 border-t border-gray-800">
                            <TimeTracking taskId={taskId} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
