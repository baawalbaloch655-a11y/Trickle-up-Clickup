import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Send, Hash, Users, Paperclip, Smile,
    MoreHorizontal, Phone, Video, Star,
    Bold, Italic, Link, List, ListOrdered, Code, Mic, AtSign
} from 'lucide-react';
import { messagesApi } from '../../lib/api';
import { getSocket, joinChatRoom, leaveChatRoom } from '../../lib/socket';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';
import { format, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';
import { useCallStore } from '../../store/useCallStore';

interface ChatWindowProps {
    targetId: string;
    targetType: 'CHANNEL' | 'CONVERSATION';
    title: string;
    subtitle?: string;
    otherUserId?: string;
}

const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
    if (isYesterday(date)) return `Yesterday at ${format(date, 'h:mm a')}`;
    return format(date, 'MMM d, yyyy h:mm a');
};

const formatTimeOnly = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
};

export default function ChatWindow({ targetId, targetType, title, subtitle, otherUserId }: ChatWindowProps) {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [messageText, setMessageText] = useState('');
    const [activeTab, setActiveTab] = useState('Chat');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch messages
    const { data: messagesRes, isLoading } = useQuery({
        queryKey: ['messages', targetType, targetId],
        queryFn: () => targetType === 'CHANNEL'
            ? messagesApi.listChannel(targetId)
            : messagesApi.listConversation(targetId),
        refetchOnWindowFocus: false,
    });

    const messages = messagesRes?.data?.data || [];

    // Send message mutation
    const sendMutation = useMutation({
        mutationFn: (content: string) => messagesApi.send({
            content,
            channelId: targetType === 'CHANNEL' ? targetId : undefined,
            conversationId: targetType === 'CONVERSATION' ? targetId : undefined,
        }),
        onSuccess: () => {
            setMessageText('');
        }
    });

    // Socket listeners
    useEffect(() => {
        const socket = getSocket();
        joinChatRoom(targetId, targetType);

        const handleNewMessage = (data: any) => {
            if (data.targetId === targetId) {
                queryClient.setQueryData(['messages', targetType, targetId], (old: any) => {
                    const oldData = old?.data?.data || [];
                    return {
                        ...old,
                        data: {
                            ...old.data,
                            data: [...oldData, data.message]
                        }
                    };
                });
            }
        };

        socket.on('message.new', handleNewMessage);

        return () => {
            socket.off('message.new', handleNewMessage);
            leaveChatRoom(targetId, targetType);
        };
    }, [targetId, targetType, queryClient]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageText.trim()) return;
        sendMutation.mutate(messageText);
    };

    // Helper to check if previous message is from same user within 5 minutes
    const isConsecutiveMessage = (currentIndex: number) => {
        if (currentIndex === 0) return false;
        const currentMsg = messages[currentIndex];
        const prevMsg = messages[currentIndex - 1];

        if (currentMsg.userId !== prevMsg.userId) return false;

        const currentTime = new Date(currentMsg.createdAt).getTime();
        const prevTime = new Date(prevMsg.createdAt).getTime();
        const diffMinutes = (currentTime - prevTime) / 1000 / 60;

        return diffMinutes < 5;
    };

    const { initiateCall } = useCallStore();

    const handleStartCall = (isVideo: boolean) => {
        if (targetType === 'CHANNEL') {
            toast.error("Multi-party channel calling coming soon. Use DMs for calls.");
            return;
        }
        if (!otherUserId) {
            toast.error("⚠️ Could not resolve the other user's ID. Please navigate back to the chat list and try again.");
            return;
        }
        // DIAGNOSTIC: Confirm who we're calling (remove after testing)
        toast(`📞 Calling user ID: ${otherUserId.slice(0, 8)}...`, { duration: 4000 });
        initiateCall(otherUserId, isVideo, title, '');
    };

    return (
        <div className="flex flex-col h-full bg-white text-gray-900 border-l border-gray-200">
            {/* Header */}
            <div className="flex flex-col border-b border-gray-200 bg-white">
                <div className="h-12 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 text-xs font-bold text-gray-700 uppercase">
                                {targetType === 'CHANNEL' ? <Hash size={14} /> : title[0]}
                            </div>
                            {/* Status Dot */}
                            {targetType === 'CONVERSATION' && (
                                <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1">
                                    {title}
                                </h2>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <Star size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Header Actions */}
                    <div className="flex items-center gap-3.5 pr-1">
                        <button
                            className="text-gray-500 hover:text-gray-800 transition-colors"
                            onClick={() => handleStartCall(false)}
                        >
                            <Phone size={16} strokeWidth={2.5} />
                        </button>
                        <button
                            className="flex items-center justify-center w-[26px] h-[26px] rounded-[7px] border-[2.5px] border-gray-900 bg-white hover:bg-gray-50 transition-colors ring-[3px] ring-[#a855f7] ring-offset-0 mx-1"
                            onClick={() => handleStartCall(true)}
                        >
                            <Video size={13} className="text-gray-800" strokeWidth={2.5} />
                        </button>
                        <button className="text-gray-500 hover:text-gray-800 transition-colors">
                            <MoreHorizontal size={18} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center px-4 gap-4">
                    {['Chat', 'Calendar', `${title}'s Assigned Tasks`].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "pb-2 text-xs font-medium transition-colors border-b-2 relative top-[1px]",
                                activeTab === tab
                                    ? "border-accent-600 text-gray-900"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar bg-white"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-600"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
                        <MessageSquare size={36} className="text-gray-400 mb-2" />
                        <p className="text-gray-500 text-sm font-medium">This is the very beginning of your direct message history with {title}.</p>
                    </div>
                ) : (
                    messages.map((msg: any, index: number) => {
                        const isConsecutive = isConsecutiveMessage(index);

                        return (
                            <div
                                key={msg.id}
                                className={clsx(
                                    "flex items-start gap-2 px-1 py-0.5 hover:bg-gray-50/80 rounded-md transition-colors group",
                                    !isConsecutive && "mt-2"
                                )}
                            >
                                {/* Avatar column */}
                                <div className="w-8 flex-shrink-0 flex justify-center">
                                    {isConsecutive ? (
                                        <div className="opacity-0 group-hover:opacity-100 text-[9px] text-gray-400 mt-0.5">
                                            {formatTimeOnly(msg.createdAt)}
                                        </div>
                                    ) : (
                                        <div className="w-7 h-7 mt-0.5 rounded-md bg-accent-100 flex items-center justify-center text-xs font-bold text-accent-700 uppercase">
                                            {msg.user?.name?.[0] || '?'}
                                        </div>
                                    )}
                                </div>

                                {/* Content column */}
                                <div className="flex-1 min-w-0 pb-0.5">
                                    {!isConsecutive && (
                                        <div className="flex items-baseline gap-2 mb-0">
                                            <span className="text-sm font-bold text-gray-900 leading-tight hover:underline cursor-pointer">
                                                {msg.user?.name || 'Unknown User'}
                                            </span>
                                            <span className="text-[11px] text-gray-500 hover:underline cursor-pointer">
                                                {formatMessageDate(msg.createdAt)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-gray-800 text-[13px] leading-snug break-words whitespace-pre-wrap">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white">
                <form
                    onSubmit={handleSend}
                    className="flex flex-col bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 transition-all"
                >
                    {/* Input Field */}
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={`Message ${title}...`}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2 text-gray-900 placeholder-gray-400 min-h-[36px]"
                        autoComplete="off"
                    />

                    {/* Toolbar & Send Actions */}
                    <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border-t border-gray-100">
                        {/* Formatting Tools */}
                        <div className="flex items-center gap-1 text-gray-500">
                            <button type="button" className="p-1 hover:bg-gray-200 rounded transition-colors"><Bold size={14} /></button>
                            <button type="button" className="p-1 hover:bg-gray-200 rounded transition-colors"><Italic size={14} /></button>
                            <button type="button" className="p-1 hover:bg-gray-200 rounded transition-colors"><Link size={14} /></button>
                            <div className="w-px h-3 bg-gray-300 mx-0.5"></div>
                            <button type="button" className="p-1 hover:bg-gray-200 rounded transition-colors"><List size={14} /></button>
                            <button type="button" className="p-1 hover:bg-gray-200 rounded transition-colors"><ListOrdered size={14} /></button>
                            <div className="w-px h-3 bg-gray-300 mx-0.5"></div>
                            <button type="button" className="p-1 hover:bg-gray-200 rounded transition-colors"><Code size={14} /></button>
                        </div>

                        {/* Right Tools & Send */}
                        <div className="flex items-center gap-1 border-l border-gray-200 pl-1.5">
                            <button type="button" className="p-1 text-gray-500 hover:bg-gray-200 rounded transition-colors" title="Mentions"><AtSign size={14} /></button>
                            <button type="button" className="p-1 text-gray-500 hover:bg-gray-200 rounded transition-colors" title="Emojis"><Smile size={14} /></button>
                            <button type="button" className="p-1 text-gray-500 hover:bg-gray-200 rounded transition-colors" title="Attach file"><Paperclip size={14} /></button>
                            <div className="w-px h-3 bg-gray-300 mx-0.5"></div>
                            <button
                                type="submit"
                                disabled={!messageText.trim() || sendMutation.isPending}
                                className={clsx(
                                    "p-1 ml-0.5 rounded transition-all flex items-center justify-center",
                                    messageText.trim() ? "bg-[#007a5a] text-white hover:bg-[#148567]" : "bg-gray-100 text-gray-400"
                                )}
                            >
                                <Send size={12} className="ml-0.5" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
            {/* Mention info below input */}
            <div className="px-4 pb-2 flex justify-end">
                <p className="text-[11px] text-gray-400 font-medium">
                    <span className="font-bold">Return</span> to send
                </p>
            </div>
        </div>
    );
}

// Missing icon used in empty state
function MessageSquare(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    )
}
