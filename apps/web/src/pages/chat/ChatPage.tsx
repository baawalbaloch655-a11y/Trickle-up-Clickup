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

    // Prefer otherUserId passed via navigation state (reliable - avoids API parsing)
    const stateOtherUserId: string | undefined = (location.state as any)?.otherUserId;
    const stateOtherUserName: string | undefined = (location.state as any)?.otherUserName;

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

    let title = stateOtherUserName || 'Chat';
    let subtitle = '';
    let otherUserId: string | undefined = stateOtherUserId;

    if (isChannel) {
        // Try both data shapes (wrapped and direct)
        const channelData = channelRes?.data?.data || channelRes?.data;
        if (channelData) {
            title = channelData.name || 'Channel';
            subtitle = channelData.description || 'Public Channel';
        }
    } else {
        // Try both data shapes
        const conv = conversationRes?.data?.data || conversationRes?.data;
        if (conv) {
            const otherMember = conv.members?.find((m: any) => m.userId !== user?.id)?.user;
            title = conv.isGroup
                ? (conv.name || 'Group Chat')
                : (otherMember?.name || stateOtherUserName || 'Direct Message');
            subtitle = conv.isGroup ? `${conv.members?.length} members` : 'Personal conversation';
            // Prefer navigation state, fall back to parsed member
            if (!otherUserId) {
                otherUserId = otherMember?.id;
            }
        }
    }

    return (
        <div className="h-[calc(100vh-64px)]">
            <ChatWindow
                targetId={targetId}
                targetType={isChannel ? 'CHANNEL' : 'CONVERSATION'}
                title={title}
                subtitle={subtitle}
                otherUserId={otherUserId}
            />
        </div>
    );
}
