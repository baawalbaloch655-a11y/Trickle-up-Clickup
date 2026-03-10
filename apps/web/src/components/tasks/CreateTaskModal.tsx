import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    X, Plus, Loader2, ChevronRight, Flag, Calendar,
    Hash, AlignLeft, User, ListTodo
} from 'lucide-react';
import { tasksApi, usersApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface List { id: string; name: string; folderName?: string; }

interface CreateTaskModalProps {
    open: boolean;
    lists: List[];            // All lists available in the space
    defaultListId?: string;   // Pre-selected list
    defaultStatus?: string;
    onClose: () => void;
}

const STATUSES = [
    { value: 'TODO', label: 'To Do', color: 'bg-gray-600' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-500' },
    { value: 'IN_REVIEW', label: 'In Review', color: 'bg-orange-500' },
    { value: 'DONE', label: 'Done', color: 'bg-green-500' },
];

const PRIORITIES = [
    { value: 'URGENT', label: 'Urgent', icon: '🚩', color: 'text-red-400' },
    { value: 'HIGH', label: 'High', icon: '🔴', color: 'text-orange-400' },
    { value: 'MEDIUM', label: 'Medium', icon: '🟡', color: 'text-yellow-400' },
    { value: 'LOW', label: 'Low', icon: '⚪', color: 'text-gray-500' },
];

export default function CreateTaskModal({ open, lists, defaultListId, defaultStatus, onClose }: CreateTaskModalProps) {
    const queryClient = useQueryClient();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [listId, setListId] = useState(defaultListId || lists[0]?.id || '');
    const [status, setStatus] = useState(defaultStatus || 'TODO');
    const [priority, setPriority] = useState('MEDIUM');
    const [dueDate, setDueDate] = useState('');
    const [assigneeId, setAssigneeId] = useState('');

    // Reset when opening
    const reset = () => {
        setTitle('');
        setDescription('');
        setListId(defaultListId || lists[0]?.id || '');
        setStatus(defaultStatus || 'TODO');
        setPriority('MEDIUM');
        setDueDate('');
        setAssigneeId('');
    };

    const handleClose = () => { reset(); onClose(); };

    // Fetch assignable org members
    const { data: membersRes } = useQuery({
        queryKey: ['users-search', ''],
        queryFn: () => usersApi.search(''),
        staleTime: 60_000,
    });
    const members: any[] = (membersRes?.data?.data || membersRes?.data || []).map((m: any) => m.user ?? m).filter(Boolean);

    const { mutate: createTask, isPending } = useMutation({
        mutationFn: () =>
            tasksApi.create(listId, {
                title: title.trim(),
                description: description.trim() || undefined,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                assigneeId: assigneeId || undefined,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['space-tasks'] });
            queryClient.invalidateQueries({ queryKey: ['tasks', listId] });
            toast.success('Task created!');
            reset();
            onClose();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to create task');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !listId) return;
        createTask();
    };

    const selectedStatus = STATUSES.find(s => s.value === status) || STATUSES[0];
    const selectedPriority = PRIORITIES.find(p => p.value === priority) || PRIORITIES[2];

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-[540px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/30 flex items-center justify-center">
                            <ListTodo size={15} className="text-accent-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-100">Create Task</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Add a new task to your workspace</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title..."
                            autoFocus
                            maxLength={200}
                            className="w-full bg-transparent border-b border-gray-800 focus:border-accent-500/60 pb-2 text-lg font-semibold text-gray-100 placeholder-gray-600 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div className="relative">
                        <AlignLeft size={13} className="absolute left-0 top-1 text-gray-600" />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description..."
                            rows={3}
                            maxLength={2000}
                            className="w-full bg-gray-900/60 border border-gray-800 rounded-xl pl-6 pr-4 pt-2 pb-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all resize-none"
                        />
                    </div>

                    {/* Row: List, Status, Priority */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* List */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                <Hash size={9} className="inline mr-1" />List
                            </label>
                            <select
                                value={listId}
                                onChange={(e) => setListId(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all"
                            >
                                {lists.map(l => (
                                    <option key={l.id} value={l.id}>
                                        {l.folderName ? `${l.folderName} / ${l.name}` : l.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all"
                            >
                                {STATUSES.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                <Flag size={9} className="inline mr-1" />Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all"
                            >
                                {PRIORITIES.map(p => (
                                    <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row: Due Date + Assignee */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Due Date */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                <Calendar size={9} className="inline mr-1" />Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all"
                            />
                        </div>

                        {/* Assignee */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                <User size={9} className="inline mr-1" />Assignee
                            </label>
                            <select
                                value={assigneeId}
                                onChange={(e) => setAssigneeId(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-2 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-accent-500/40 focus:border-accent-500/40 transition-all"
                            >
                                <option value="">Unassigned</option>
                                {members.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.name || m.email}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Preview pill row */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white', selectedStatus.color)}>
                            {selectedStatus.label}
                        </span>
                        <span className={clsx('text-[11px] font-medium', selectedPriority.color)}>
                            {selectedPriority.icon} {selectedPriority.label}
                        </span>
                        {dueDate && (
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <Calendar size={9} />
                                {new Date(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-800/60">
                        <p className="text-[10px] text-gray-600">Press <kbd className="bg-gray-800 text-gray-400 px-1 py-0.5 rounded text-[9px]">Esc</kbd> to cancel</p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim() || !listId || isPending}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-accent-600 hover:bg-accent-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
                            >
                                {isPending
                                    ? <><Loader2 size={14} className="animate-spin" /> Creating...</>
                                    : <><Plus size={14} /> Create Task</>
                                }
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
