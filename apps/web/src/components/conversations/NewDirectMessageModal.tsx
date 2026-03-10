import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, UserPlus, Users, Loader2, ChevronRight, Check } from 'lucide-react';
import { conversationsApi, usersApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

interface User {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
}

interface NewDirectMessageModalProps {
    open: boolean;
    onClose: () => void;
}

export default function NewDirectMessageModal({ open, onClose }: NewDirectMessageModalProps) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [selected, setSelected] = useState<User[]>([]);
    const [groupName, setGroupName] = useState('');
    const [searching, setSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const isGroup = selected.length > 1;

    useEffect(() => {
        if (open) {
            setQuery('');
            setResults([]);
            setSelected([]);
            setGroupName('');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open]);

    const handleSearch = (value: string) => {
        setQuery(value);
        clearTimeout(debounceRef.current);
        if (!value.trim()) { setResults([]); return; }
        setSearching(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await usersApi.search(value.trim());
                // API returns OrgMember[] with nested `user`
                const members: any[] = res.data?.data || res.data || [];
                const users: User[] = members.map((m: any) => m.user ?? m).filter((u: any) =>
                    u?.id &&
                    u.id !== currentUser?.id &&
                    !selected.find(s => s.id === u.id)
                );
                setResults(users);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);
    };


    const toggleUser = (user: User) => {
        setSelected(prev => {
            const exists = prev.find(u => u.id === user.id);
            return exists ? prev.filter(u => u.id !== user.id) : [...prev, user];
        });
        setQuery('');
        setResults([]);
        inputRef.current?.focus();
    };

    const removeSelected = (userId: string) => {
        setSelected(prev => prev.filter(u => u.id !== userId));
    };

    const { mutate: startConversation, isPending } = useMutation({
        mutationFn: () =>
            conversationsApi.create({
                userIds: selected.map(u => u.id),
                isGroup,
                name: isGroup ? (groupName.trim() || undefined) : undefined,
            }),
        onSuccess: (res) => {
            const conv = res.data?.data;
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            const label = isGroup
                ? `Group chat created!`
                : `DM with ${selected[0]?.name} started!`;
            toast.success(label);
            onClose();
            if (conv?.id) navigate(`/conversations/${conv.id}`);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to start conversation');
        },
    });

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-[460px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-800/60">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/30 flex items-center justify-center">
                            {isGroup
                                ? <Users size={16} className="text-accent-400" />
                                : <UserPlus size={16} className="text-accent-400" />
                            }
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-100">
                                {isGroup ? 'New Group Chat' : 'New Direct Message'}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {isGroup
                                    ? `${selected.length} people selected`
                                    : 'Search for a person to message'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Group name (only visible when 2+ selected) */}
                    {isGroup && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Group Name <span className="text-gray-600">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="e.g. Design Team, Sprint Crew..."
                                maxLength={60}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 transition-all"
                            />
                        </div>
                    )}

                    {/* Selected users chips */}
                    {selected.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selected.map(u => (
                                <span
                                    key={u.id}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-accent-600/15 border border-accent-500/30 rounded-full text-xs font-medium text-accent-300"
                                >
                                    <span className="w-4 h-4 rounded-full bg-accent-600/40 flex items-center justify-center text-[8px] font-bold">
                                        {u.name[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || '?'}
                                    </span>
                                    {(u.name || u.email || 'Unknown').split(' ')[0]}
                                    <button
                                        onClick={() => removeSelected(u.id)}
                                        className="text-accent-400/60 hover:text-accent-300 ml-0.5 transition-colors"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            {selected.length === 0 ? 'To' : 'Add more people'}
                        </label>
                        <div className="relative">
                            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 transition-all"
                            />
                            {searching && (
                                <Loader2 size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
                            )}
                        </div>

                        {/* Search results dropdown */}
                        {results.length > 0 && (
                            <div className="mt-1 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                                {results.map((user) => {
                                    const isSelected = !!selected.find(s => s.id === user.id);
                                    return (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => toggleUser(user)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-accent-600/20 border border-accent-500/20 flex items-center justify-center text-sm font-bold text-accent-400 flex-shrink-0">
                                                {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-200 truncate">{user.name || user.email}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                            {isSelected && <Check size={14} className="text-accent-400 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* No results */}
                        {query.trim() && !searching && results.length === 0 && (
                            <div className="mt-2 text-center py-4 text-sm text-gray-500">
                                No users found for "<span className="text-gray-400">{query}</span>"
                            </div>
                        )}
                    </div>

                    {/* Tip */}
                    {selected.length === 0 && !query && (
                        <p className="text-xs text-gray-600 text-center">
                            💡 Select multiple people to create a group chat
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={() => startConversation()}
                            disabled={selected.length === 0 || isPending}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-accent-600 hover:bg-accent-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
                        >
                            {isPending ? (
                                <><Loader2 size={14} className="animate-spin" /> Starting...</>
                            ) : (
                                <>{isGroup ? 'Create Group' : 'Open Chat'} <ChevronRight size={14} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
