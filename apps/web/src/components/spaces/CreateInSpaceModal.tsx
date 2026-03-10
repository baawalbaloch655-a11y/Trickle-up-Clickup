import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Folder, Hash, Loader2, ChevronRight } from 'lucide-react';
import { foldersApi, listsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

type CreateType = 'folder' | 'list';

interface CreateInSpaceModalProps {
    open: boolean;
    spaceId: string;
    spaceName: string;
    folderId?: string;
    folderName?: string;
    onClose: () => void;
}

const LIST_COLORS = [
    '#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4',
    '#10b981', '#eab308', '#f97316', '#ef4444', '#ec4899',
];

export default function CreateInSpaceModal({ open, spaceId, spaceName, folderId, folderName, onClose }: CreateInSpaceModalProps) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [type, setType] = useState<CreateType>('list');
    const [name, setName] = useState('');
    const [color, setColor] = useState('#6366f1');

    const reset = () => { setName(''); setColor('#6366f1'); };

    const handleClose = () => { reset(); onClose(); };

    const { mutate: createFolder, isPending: folderPending } = useMutation({
        mutationFn: () => foldersApi.create(spaceId, { name: name.trim() }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['spaces'] });
            queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
            toast.success(`Folder "${name}" created!`);
            reset();
            onClose();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to create folder');
        },
    });

    const { mutate: createList, isPending: listPending } = useMutation({
        mutationFn: () => listsApi.create({ name: name.trim(), spaceId, folderId, color }),
        onSuccess: (res) => {
            const list = res.data?.data;
            queryClient.invalidateQueries({ queryKey: ['spaces'] });
            queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
            toast.success(`List "${name}" created!`);
            reset();
            onClose();
            if (list?.id) navigate(`/lists/${list.id}`);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to create list');
        },
    });

    const isPending = folderPending || listPending;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        if (type === 'folder') createFolder();
        else createList();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-[420px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-800/60">
                    <div>
                        <h2 className="text-lg font-bold text-gray-100">Add to {folderId ? 'Folder' : 'Space'}</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Inside <span className="text-accent-400 font-medium">{folderName || spaceName}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Type Selector */}
                    {!folderId && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('list')}
                                className={clsx(
                                    "flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                                    type === 'list'
                                        ? "bg-accent-600/10 border-accent-500/40 shadow-sm"
                                        : "bg-gray-900 border-gray-800 hover:border-gray-700"
                                )}
                            >
                                <Hash size={16} className={type === 'list' ? "text-accent-400" : "text-gray-500"} />
                                <div className="text-left">
                                    <p className={clsx("text-sm font-semibold", type === 'list' ? "text-gray-100" : "text-gray-400")}>List</p>
                                    <p className="text-[10px] text-gray-500">For tasks & work</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('folder')}
                                className={clsx(
                                    "flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                                    type === 'folder'
                                        ? "bg-accent-600/10 border-accent-500/40 shadow-sm"
                                        : "bg-gray-900 border-gray-800 hover:border-gray-700"
                                )}
                            >
                                <Folder size={16} className={type === 'folder' ? "text-accent-400" : "text-gray-500"} />
                                <div className="text-left">
                                    <p className={clsx("text-sm font-semibold", type === 'folder' ? "text-gray-100" : "text-gray-400")}>Folder</p>
                                    <p className="text-[10px] text-gray-500">Group lists together</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            {type === 'folder' ? 'Folder' : 'List'} Name <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={type === 'folder' ? 'e.g. Sprint 1, Q1 Projects...' : 'e.g. Backend Tasks, Design Assets...'}
                            autoFocus
                            maxLength={60}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 transition-all"
                        />
                    </div>

                    {/* Color (only for lists) */}
                    {type === 'list' && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Color
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {LIST_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={clsx(
                                            "w-6 h-6 rounded-full transition-all duration-150 hover:scale-110",
                                            color === c && "ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-110"
                                        )}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Preview */}
                    <div className="flex items-center gap-2.5 bg-gray-900/60 border border-gray-800 rounded-xl px-3 py-2.5">
                        {type === 'list'
                            ? <Hash size={14} style={{ color }} />
                            : <Folder size={14} className="text-gray-400" />
                        }
                        <span className="text-sm text-gray-300 truncate">
                            {name || <span className="text-gray-500 italic">{type === 'folder' ? 'Folder name' : 'List name'}</span>}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isPending}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-accent-600 hover:bg-accent-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
                        >
                            {isPending ? (
                                <><Loader2 size={14} className="animate-spin" /> Creating...</>
                            ) : (
                                <>Create {type === 'folder' ? 'Folder' : 'List'} <ChevronRight size={14} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
