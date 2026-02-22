import { useParams, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ChatWindow from '../../components/chat/ChatWindow';
import { channelsApi, conversationsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function ChatPage() {
    const { channelId, conversationId } = useParams();
    const { user } = useAuthStore();
    const location = useLocation();
    const isChannel = !!channelId;
    const targetId = channelId || conversationId || '';

    const { data: channelRes } = useQuery({
        queryKey: ['channel', channelId],
        queryFn: () => channelsApi.get(channelId!),
        enabled: !!channelId,
    });

    const { data: conversationRes } = useQuery({
        queryKey: ['conversation', conversationId],
        queryFn: () => conversationsApi.get(conversationId!),
        enabled: !!conversationId,
    });

    if (!targetId) return null;

    let title = 'Chat';
    let subtitle = '';

    if (isChannel && channelRes?.data?.data) {
        title = channelRes.data.data.name;
        subtitle = channelRes.data.data.description || 'Public Channel';
    } else if (!isChannel && conversationRes?.data?.data) {
        const conv = conversationRes.data.data;
        const otherMember = conv.members.find((m: any) => m.userId !== user?.id)?.user;
        title = conv.isGroup ? (conv.name || 'Group Chat') : (otherMember?.name || 'Direct Message');
        subtitle = conv.isGroup ? `${conv.members.length} members` : 'Personal conversation';
    }

    return (
        <div className="h-[calc(100vh-64px)]">
            <ChatWindow
                targetId={targetId}
                targetType={isChannel ? 'CHANNEL' : 'CONVERSATION'}
                title={title}
                subtitle={subtitle}
            />
        </div>
    );
}
