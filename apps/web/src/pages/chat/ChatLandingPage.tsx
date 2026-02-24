import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, Search, Users, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { conversationsApi, channelsApi, employeesApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import NewMessageModal from '../../components/chat/NewMessageModal';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export default function ChatLandingPage() {
    const { activeOrg, user } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

    // Queries
    const { data: conversationsRes, isLoading: loadingConvs } = useQuery({
        queryKey: ['conversations', activeOrg?.id],
        queryFn: () => conversationsApi.list(),
        enabled: !!activeOrg,
    });

    const { data: channelsRes, isLoading: loadingChannels } = useQuery({
        queryKey: ['channels', activeOrg?.id],
        queryFn: () => channelsApi.list(),
        enabled: !!activeOrg,
    });

    const { data: employeesRes, isLoading: loadingEmployees } = useQuery({
        queryKey: ['employees', activeOrg?.id],
        queryFn: () => employeesApi.getAll(activeOrg?.id!),
        enabled: !!activeOrg,
    });

    const conversations = conversationsRes?.data?.data || [];
    const channels = channelsRes?.data?.data || [];
    const employees = employeesRes?.data?.data || [];

    // Sort recent chats
    const sortedConversations = [...conversations].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // Filter conversations
    const filteredConversations = sortedConversations.filter((conv: any) => {
        const otherMembers = conv.members.filter((m: any) => m.userId !== user?.id).map((m: any) => m.user.name).join(', ');
        const name = conv.isGroup ? (conv.name || 'Group Chat') : otherMembers;
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Filter channels
    const filteredChannels = channels.filter((channel: any) =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (channel.description && channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Filter employees (excluding myself)
    const availableUsers = employees
        .filter((emp: any) => emp.user.id !== user?.id)
        .map((emp: any) => emp.user)
        .filter((u: any) =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

    // Mutation to start new chat
    const createMutation = useMutation({
        mutationFn: (userIds: string[]) => conversationsApi.create({
            userIds,
            isGroup: false
        }),
        onSuccess: (res, userIds) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            const convId = res.data?.id || res.data?.data?.id || res.data;
            // Find the target user to pass as state
            const targetUser = employees?.find((e: any) => userIds.includes(e.user?.id))?.user;
            navigate(`/conversations/${convId}`, { state: { otherUserId: targetUser?.id, otherUserName: targetUser?.name } });
        },
        onError: () => {
            toast.error('Failed to start conversation');
        }
    });

    const handleUserClick = (targetUser: any) => {
        // Check if a 1-on-1 already exists
        const existingConv = conversations.find((c: any) =>
            !c.isGroup &&
            c.members.length === 2 &&
            c.members.some((m: any) => m.userId === targetUser.id)
        );

        if (existingConv) {
            navigate(`/conversations/${existingConv.id}`, { state: { otherUserId: targetUser.id, otherUserName: targetUser.name } });
        } else {
            createMutation.mutate([targetUser.id]);
        }
    };

    const isLoading = loadingConvs || loadingChannels || loadingEmployees;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f6f8f9] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-8 bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center">
                                <MessageSquare size={24} />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Chat Dashboard</h1>
                        </div>
                        <p className="text-gray-500 text-lg">Connect with your teams and colleagues instantly.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-full sm:w-72">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search everything..."
                                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-accent-500 focus:bg-white focus:border-accent-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => setIsNewMessageModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-600 hover:bg-accent-700 text-white rounded-xl font-semibold transition-all shadow-sm active:scale-95 flex-shrink-0"
                            title="New Group Chat"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Group Chat</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-5xl mx-auto space-y-10 pb-8">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Section: Recent Chats */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
                                    <MessageSquare size={18} className="text-accent-500" />
                                    Recent Chats
                                </h2>
                                {filteredConversations.length === 0 ? (
                                    <p className="text-sm text-gray-500 px-1 border border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50/50">
                                        No recent chats found.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredConversations.map((conv: any) => {
                                            const otherMembers = conv.members.filter((m: any) => m.userId !== user?.id);
                                            const title = conv.isGroup
                                                ? (conv.name || `${otherMembers.map((m: any) => m.user.name).join(', ')}`)
                                                : (otherMembers[0]?.user.name || 'Unknown User');

                                            const initials = conv.isGroup ? 'G' : (otherMembers[0]?.user.name[0] || '?');
                                            const membersCount = conv.members.length;

                                            return (
                                                <div
                                                    key={conv.id}
                                                    onClick={() => navigate(`/conversations/${conv.id}`)}
                                                    className="p-4 bg-white border border-gray-200 rounded-2xl hover:border-accent-400 hover:shadow-md cursor-pointer transition-all group flex items-start gap-4"
                                                >
                                                    <div className="relative mt-1">
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center text-lg font-bold text-accent-700 uppercase flex-shrink-0 border border-accent-100">
                                                            {conv.isGroup ? <Users size={20} /> : initials}
                                                        </div>
                                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline justify-between mb-1">
                                                            <h3 className="text-sm font-bold text-gray-900 truncate pr-2 group-hover:text-accent-600 transition-colors">
                                                                {title}
                                                            </h3>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                            {conv.isGroup && (
                                                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                                    Group • {membersCount}
                                                                </span>
                                                            )}
                                                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                                                {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 truncate leading-relaxed">
                                                            {conv.messages && conv.messages.length > 0
                                                                ? conv.messages[0].content
                                                                : 'No messages yet.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            <hr className="border-gray-200" />

                            {/* Section: All Teams */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
                                    <Hash size={18} className="text-blue-500" />
                                    All Teams
                                </h2>
                                {filteredChannels.length === 0 ? (
                                    <p className="text-sm text-gray-500 px-1 border border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50/50">
                                        No teams found.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {filteredChannels.map((channel: any) => {
                                            const isMember = channel.members?.some((m: any) => m.userId === user?.id);
                                            return (
                                                <div
                                                    key={channel.id}
                                                    onClick={() => navigate(isMember ? `/channels/${channel.id}` : '/teams')}
                                                    className="p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group flex flex-col"
                                                >
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 flex-shrink-0">
                                                            <Hash size={18} />
                                                        </div>
                                                        <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                                            {channel.name}
                                                        </h3>
                                                    </div>
                                                    <p className="text-xs text-gray-500 line-clamp-2 flex-1 mb-3">
                                                        {channel.description || 'No description provided.'}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-auto">
                                                        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                                                            <Users size={12} />
                                                            {channel._count?.members || 0} members
                                                        </span>
                                                        {isMember && (
                                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">
                                                                Joined
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            <hr className="border-gray-200" />

                            {/* Section: All Members */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 mb-4 px-1 flex items-center gap-2">
                                    <Users size={18} className="text-green-500" />
                                    All Members
                                </h2>
                                {availableUsers.length === 0 ? (
                                    <p className="text-sm text-gray-500 px-1 border border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50/50">
                                        No other members found.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {availableUsers.map((u: any) => (
                                            <div
                                                key={u.id}
                                                onClick={() => handleUserClick(u)}
                                                className={clsx(
                                                    "p-4 bg-white border border-gray-200 rounded-2xl cursor-pointer hover:border-green-400 hover:shadow-md transition-all group flex flex-col items-center text-center",
                                                    createMutation.isPending && "opacity-50 pointer-events-none"
                                                )}
                                                title={`Message ${u.name}`}
                                            >
                                                <div className="relative mb-3">
                                                    {u.avatarUrl ? (
                                                        <img src={u.avatarUrl} alt={u.name} className="w-14 h-14 rounded-full object-cover border border-gray-200" />
                                                    ) : (
                                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-lg font-bold text-gray-600 uppercase border border-gray-200">
                                                            {u.name[0]}
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-900 truncate w-full group-hover:text-green-600 transition-colors">
                                                    {u.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate w-full mt-0.5" title={u.email}>
                                                    {u.email}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                        </>
                    )}
                </div>
            </div>

            <NewMessageModal
                isOpen={isNewMessageModalOpen}
                onClose={() => setIsNewMessageModalOpen(false)}
            />
        </div>
    );
}
