import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Hash, Users, Paperclip, Smile } from 'lucide-react';
import { messagesApi } from '../../lib/api';
import { getSocket, joinChatRoom, leaveChatRoom } from '../../lib/socket';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface ChatWindowProps {
    targetId: string;
    targetType: 'CHANNEL' | 'CONVERSATION';
    title: string;
    subtitle?: string;
}

export default function ChatWindow({ targetId, targetType, title, subtitle }: ChatWindowProps) {
    const { user, activeOrg } = useAuthStore();
    const queryClient = useQueryClient();
    const [messageText, setMessageText] = useState('');
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

    return (
        <div className="flex flex-col h-full bg-gray-900 overflow-hidden">
            {/* Header */}
            <div className="h-14 px-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700">
                        {targetType === 'CHANNEL' ? <Hash size={16} className="text-accent-400" /> : <Users size={16} className="text-accent-400" />}
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-100">{title}</h2>
                        <p className="text-[10px] text-gray-500">{subtitle || 'Messages are encrypted & secure'}</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-500"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-40">
                        <MessageSquare size={48} className="text-gray-600 mb-2" />
                        <p className="text-gray-400 font-medium">No messages yet</p>
                        <p className="text-xs text-gray-500 max-w-xs">Start the conversation by sending a message below!</p>
                    </div>
                ) : (
                    messages.map((msg: any) => (
                        <div
                            key={msg.id}
                            className={clsx(
                                "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                msg.userId === user?.id ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            <div className="w-8 h-8 rounded-full bg-accent-600/20 border border-accent-500/20 flex items-center justify-center text-[10px] font-bold text-accent-400 flex-shrink-0 uppercase">
                                {msg.user?.name?.[0] || '?'}
                            </div>
                            <div className={clsx(
                                "max-w-[70%] space-y-1",
                                msg.userId === user?.id ? "items-end text-right" : "items-start text-left"
                            )}>
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-[10px] font-bold text-gray-400">{msg.user?.name}</span>
                                    <span className="text-[9px] text-gray-600">{format(new Date(msg.createdAt), 'HH:mm')}</span>
                                </div>
                                <div className={clsx(
                                    "px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm",
                                    msg.userId === user?.id
                                        ? "bg-accent-600 text-white rounded-tr-none"
                                        : "bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700/50"
                                )}>
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                <form
                    onSubmit={handleSend}
                    className="relative flex items-center gap-2 bg-gray-800/50 border border-gray-700/50 rounded-2xl px-4 py-2 focus-within:border-accent-500/50 focus-within:bg-gray-800 transition-all shadow-inner"
                >
                    <button type="button" className="text-gray-500 hover:text-gray-300">
                        <Paperclip size={18} />
                    </button>
                    <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={`Message ${title}...`}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-gray-200 placeholder-gray-500"
                    />
                    <button type="button" className="text-gray-500 hover:text-gray-300">
                        <Smile size={18} />
                    </button>
                    <button
                        type="submit"
                        disabled={!messageText.trim() || sendMutation.isPending}
                        className={clsx(
                            "p-2 rounded-xl transition-all",
                            messageText.trim() ? "bg-accent-600 text-white shadow-glow" : "text-gray-600 bg-gray-800/50"
                        )}
                    >
                        <Send size={18} />
                    </button>
                </form>
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
