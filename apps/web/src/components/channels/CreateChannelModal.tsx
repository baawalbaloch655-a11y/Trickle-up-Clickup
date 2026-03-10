import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Hash, Lock, Globe, Loader2, ChevronRight } from 'lucide-react';
import { channelsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

interface CreateChannelModalProps {
    open: boolean;
    onClose: () => void;
}

export default function CreateChannelModal({ open, onClose }: CreateChannelModalProps) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    const { mutate: createChannel, isPending } = useMutation({
        mutationFn: () =>
            channelsApi.create({
                name: name.trim().toLowerCase().replace(/\s+/g, '-'),
                description: description.trim() || undefined,
                isPrivate,
            }),
        onSuccess: (res) => {
            const channel = res.data?.data;
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            toast.success(`#${name} channel created!`);
            reset();
            onClose();
            if (channel?.id) navigate(`/channels/${channel.id}`);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to create channel');
        },
    });

    const reset = () => {
        setName('');
        setDescription('');
        setIsPrivate(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        createChannel();
    };

    // Clean slug preview
    const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
            <div className="bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-800/60">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-500/10 border border-accent-500/30 flex items-center justify-center">
                            <Hash size={16} className="text-accent-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-100">Create Channel</h2>
                            <p className="text-xs text-gray-500">For team conversations & announcements</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Channel Name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Channel Name <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">#</span>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. general, announcements..."
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 transition-all"
                                autoFocus
                                maxLength={50}
                            />
                        </div>
                        {name && slug !== name.trim() && (
                            <p className="text-xs text-gray-500 mt-1 ml-1">
                                Channel will be created as <span className="text-accent-400 font-mono">#{slug}</span>
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Description <span className="text-gray-600">(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this channel about?"
                            rows={2}
                            maxLength={200}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 transition-all resize-none"
                        />
                    </div>

                    {/* Privacy */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            Privacy
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setIsPrivate(false)}
                                className={clsx(
                                    "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all text-left",
                                    !isPrivate
                                        ? "bg-accent-600/10 border-accent-500/40 shadow-sm"
                                        : "bg-gray-900 border-gray-800 hover:border-gray-700"
                                )}
                            >
                                <Globe size={16} className={clsx("mt-0.5 flex-shrink-0", !isPrivate ? "text-accent-400" : "text-gray-500")} />
                                <div>
                                    <p className={clsx("text-sm font-semibold", !isPrivate ? "text-gray-100" : "text-gray-400")}>Public</p>
                                    <p className="text-[10px] text-gray-500 leading-snug mt-0.5">Everyone can join</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsPrivate(true)}
                                className={clsx(
                                    "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all text-left",
                                    isPrivate
                                        ? "bg-accent-600/10 border-accent-500/40 shadow-sm"
                                        : "bg-gray-900 border-gray-800 hover:border-gray-700"
                                )}
                            >
                                <Lock size={16} className={clsx("mt-0.5 flex-shrink-0", isPrivate ? "text-accent-400" : "text-gray-500")} />
                                <div>
                                    <p className={clsx("text-sm font-semibold", isPrivate ? "text-gray-100" : "text-gray-400")}>Private</p>
                                    <p className="text-[10px] text-gray-500 leading-snug mt-0.5">Invite only</p>
                                </div>
                            </button>
                        </div>
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
                                <>Create Channel <ChevronRight size={14} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
