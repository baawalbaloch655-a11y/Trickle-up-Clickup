import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Hash, Lock, Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { channelsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import CreateTeamModal from '../../components/teams/CreateTeamModal';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import { format } from 'date-fns';

export default function TeamsPage() {
    const { activeOrg, user } = useAuthStore();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data: channelsRes, isLoading } = useQuery({
        queryKey: ['channels', activeOrg?.id],
        queryFn: () => channelsApi.list(),
        enabled: !!activeOrg,
    });

    const channels = channelsRes?.data?.data || [];

    const filteredChannels = channels.filter((channel: any) =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (channel.description && channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const joinMutation = useMutation({
        mutationFn: (channelId: string) => channelsApi.join(channelId),
        onSuccess: (res, channelId) => {
            queryClient.invalidateQueries({ queryKey: ['channels'] });
            toast.success('Joined team successfully!');
            navigate(`/channels/${channelId}`);
        },
        onError: () => {
            toast.error('Failed to join team');
        }
    });

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f6f8f9] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-8 bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center">
                                <Users size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Teams Directory</h1>
                        </div>
                        <p className="text-gray-500 text-lg">Browse and join teams across your organization to collaborate.</p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-accent-600 hover:bg-accent-700 text-white rounded-xl font-semibold transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={18} />
                        Create Team
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Search Bar */}
                    <div className="relative max-w-xl">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search teams by name or description..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition-all shadow-sm"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-600"></div>
                        </div>
                    ) : filteredChannels.length === 0 ? (
                        <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center max-w-2xl mx-auto mt-12 shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Hash size={40} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No teams found</h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                {searchQuery ? `We couldn't find any teams matching "${searchQuery}".` : "There are no teams in this organization yet."}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="px-6 py-3 bg-accent-50 text-accent-700 hover:bg-accent-100 font-semibold rounded-xl transition-colors"
                                >
                                    Create the first team
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredChannels.map((channel: any) => {
                                const isMember = channel.members?.some((m: any) => m.userId === user?.id);
                                const memberCount = channel._count?.members || channel.members?.length || 0;

                                return (
                                    <div key={channel.id} className="bg-white border border-gray-200 rounded-3xl p-6 hover:shadow-md transition-shadow flex flex-col group relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:scale-105 transition-transform flex-shrink-0">
                                                {channel.isPrivate ? <Lock size={20} className="text-gray-400" /> : <Hash size={24} className="text-gray-400" />}
                                            </div>
                                            {isMember && (
                                                <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">
                                                    Joined
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 mb-6">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{channel.name}</h3>
                                            <p className="text-gray-500 text-sm line-clamp-2 min-h-[40px]">
                                                {channel.description || 'No description provided.'}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                                                <Users size={16} />
                                                <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                                            </div>

                                            {isMember ? (
                                                <button
                                                    onClick={() => navigate(`/channels/${channel.id}`)}
                                                    className="flex items-center gap-1.5 text-sm font-bold text-accent-600 hover:text-accent-700 transition-colors"
                                                >
                                                    Open Chat <ArrowRight size={16} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => joinMutation.mutate(channel.id)}
                                                    disabled={joinMutation.isPending}
                                                    className="px-4 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {joinMutation.isPending ? 'Joining...' : 'Join Team'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <CreateTeamModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
