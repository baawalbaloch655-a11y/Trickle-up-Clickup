import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Box, ChevronRight, Loader2 } from 'lucide-react';
import { spacesApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

const SPACE_COLORS = [
    { label: 'Indigo', value: '#6366f1' },
    { label: 'Violet', value: '#8b5cf6' },
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Cyan', value: '#06b6d4' },
    { label: 'Teal', value: '#14b8a6' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Yellow', value: '#eab308' },
    { label: 'Orange', value: '#f97316' },
    { label: 'Red', value: '#ef4444' },
    { label: 'Pink', value: '#ec4899' },
    { label: 'Rose', value: '#f43f5e' },
    { label: 'Gray', value: '#6b7280' },
];

const SPACE_ICONS = ['📁', '🚀', '⚡', '🎯', '💡', '🔧', '🌟', '📊', '🎨', '🔬', '🏆', '💼'];

interface CreateSpaceModalProps {
    open: boolean;
    onClose: () => void;
}

export default function CreateSpaceModal({ open, onClose }: CreateSpaceModalProps) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [icon, setIcon] = useState('📁');
    const [showIconPicker, setShowIconPicker] = useState(false);

    const { mutate: createSpace, isPending } = useMutation({
        mutationFn: () =>
            spacesApi.create({ name: name.trim(), description: description.trim() || undefined, color }),
        onSuccess: (res) => {
            const space = res.data?.data;
            queryClient.invalidateQueries({ queryKey: ['spaces'] });
            toast.success(`Space "${name}" created!`);
            reset();
            onClose();
            if (space?.id) navigate(`/spaces/${space.id}`);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Failed to create space');
        },
    });

    const reset = () => {
        setName('');
        setDescription('');
        setColor('#6366f1');
        setIcon('📁');
        setShowIconPicker(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        createSpace();
    };

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
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}>
                            <Box size={16} style={{ color }} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-100">Create Space</h2>
                            <p className="text-xs text-gray-500">Organize your work into spaces</p>
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
                    {/* Icon + Name Row */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Space Name <span className="text-red-400">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            {/* Icon picker trigger */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowIconPicker(!showIconPicker)}
                                    className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors flex items-center justify-center text-xl flex-shrink-0"
                                    title="Choose icon"
                                >
                                    {icon}
                                </button>
                                {showIconPicker && (
                                    <div className="absolute top-12 left-0 z-10 bg-gray-900 border border-gray-700 rounded-xl p-2 shadow-xl grid grid-cols-6 gap-1 w-48">
                                        {SPACE_ICONS.map((ic) => (
                                            <button
                                                key={ic}
                                                type="button"
                                                onClick={() => { setIcon(ic); setShowIconPicker(false); }}
                                                className={clsx(
                                                    "w-8 h-8 rounded-lg text-lg flex items-center justify-center hover:bg-gray-700 transition-colors",
                                                    icon === ic && "bg-gray-700 ring-1 ring-accent-500"
                                                )}
                                            >
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Engineering, Marketing..."
                                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 transition-all"
                                autoFocus
                                maxLength={60}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Description <span className="text-gray-600">(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this space for?"
                            rows={2}
                            maxLength={200}
                            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 transition-all resize-none"
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SPACE_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    title={c.label}
                                    onClick={() => setColor(c.value)}
                                    className={clsx(
                                        "w-7 h-7 rounded-full transition-all duration-150 hover:scale-110",
                                        color === c.value && "ring-2 ring-white ring-offset-2 ring-offset-gray-950 scale-110"
                                    )}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                            style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                        >
                            {icon}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-200 truncate">
                                {name || <span className="text-gray-500">Space name</span>}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {description || 'No description'}
                            </p>
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
                                <>Create Space <ChevronRight size={14} /></>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
