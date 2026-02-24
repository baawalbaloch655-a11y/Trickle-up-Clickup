import { useState } from 'react';
import { X, Users, Hash, Lock } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { channelsApi } from '../../lib/api';
import toast from 'react-hot-toast';

interface CreateTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateTeamModal({ isOpen, onClose }: CreateTeamModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const queryClient = useQueryClient();

    const createMutation = useMutation({
        mutationFn: () => channelsApi.create({ name, description, isPrivate }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            toast.success('Team created successfully!');
            onClose();
            setName('');
            setDescription('');
            setIsPrivate(false);
        },
        onError: () => {
            toast.error('Failed to create team');
        }
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        createMutation.mutate();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center text-accent-600">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Create a Team</h2>
                            <p className="text-sm text-gray-500">Teams are where your members communicate.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Name</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Hash size={16} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Marketing, Engineering"
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition-all placeholder:text-gray-400"
                                autoFocus
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this team about?"
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition-all placeholder:text-gray-400 resize-none h-24"
                        />
                    </div>

                    <div className="pt-2">
                        <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                            <div className="flex items-center h-5">
                                <input
                                    type="checkbox"
                                    checked={isPrivate}
                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                    className="w-4 h-4 text-accent-600 border-gray-300 rounded focus:ring-accent-500"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                    Make Private
                                    {isPrivate && <Lock size={14} className="text-gray-500" />}
                                </span>
                                <span className="text-xs text-gray-500">Only invited members can view and join this team.</span>
                            </div>
                        </label>
                    </div>

                    <div className="pt-6 flex gap-3 justify-end">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || createMutation.isPending}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Team'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
