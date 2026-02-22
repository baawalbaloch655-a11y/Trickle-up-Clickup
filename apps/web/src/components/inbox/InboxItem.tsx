import { format } from 'date-fns';
import {
    Check,
    Clock,
    MessageSquare,
    UserPlus,
    ClipboardCheck,
    AlertCircle,
    MoreHorizontal,
    Reply,
    AtSign,
    CheckCircle2
} from 'lucide-react';
import { clsx } from 'clsx';
import { notificationsApi } from '../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface InboxItemProps {
    notification: any;
}

export default function InboxItem({ notification }: InboxItemProps) {
    const queryClient = useQueryClient();

    const clearMutation = useMutation({
        mutationFn: () => notificationsApi.clear(notification.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Cleared from inbox');
        }
    });

    const laterMutation = useMutation({
        mutationFn: () => notificationsApi.updateCategory(notification.id, 'LATER'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Moved to Later');
        }
    });

    const getStatusIcon = () => {
        switch (notification.type) {
            case 'TASK_ASSIGNED': return <div className="w-4 h-4 rounded-full border border-blue-500/50 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /></div>;
            case 'TASK_COMPLETED': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'MENTION': return <div className="w-4 h-4 rounded-full border border-purple-500/50 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-purple-500" /></div>;
            case 'COMMENT_REPLY': return <MessageSquare size={14} className="text-indigo-400" />;
            case 'COMMENT_ASSIGNED': return <div className="w-4 h-4 rounded-full border border-orange-500/50 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" /></div>;
            default: return <div className="w-4 h-4 rounded-full border border-gray-700" />;
        }
    };

    const getActorInfo = () => {
        const actor = notification.metadata?.actor;
        if (!actor) return null;
        return (
            <div className="flex items-center gap-2 flex-shrink-0">
                {actor.avatarUrl ? (
                    <img src={actor.avatarUrl} alt={actor.name} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                    <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-400 border border-gray-700">
                        {actor.name?.[0].toUpperCase()}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={clsx(
            "group relative flex items-center gap-4 px-4 py-3 bg-[#0d0d0d]/40 border-b border-gray-900/50 hover:bg-gray-800/20 transition-all cursor-pointer",
            !notification.isRead && "bg-accent-500/5"
        )}>
            {/* Status Indicator */}
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                {getStatusIcon()}
            </div>

            {/* Title / Resource */}
            <div className="flex-[0.35] min-w-0">
                <h4 className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                    {notification.metadata?.taskTitle || notification.title}
                </h4>
            </div>

            {/* Actor & Activity Snippet */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
                {getActorInfo()}
                <p className="text-xs text-gray-500 truncate mt-0.5 leading-relaxed">
                    <span className="text-gray-400">{notification.body}</span>
                </p>
            </div>

            {/* Metadata & Actions */}
            <div className="flex items-center gap-4 flex-shrink-0">
                {notification.metadata?.count && (
                    <div className="w-5 h-5 rounded-full border border-gray-800 flex items-center justify-center text-[10px] text-gray-500 font-medium">
                        {notification.metadata.count}
                    </div>
                )}

                <span className="text-[11px] font-medium text-gray-600 min-w-[45px] text-right">
                    {format(new Date(notification.createdAt), 'MMM d')}
                </span>

                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        className="p-1.5 rounded-md hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            laterMutation.mutate();
                        }}
                    >
                        <Clock size={14} />
                    </button>
                    <button
                        className="p-1.5 rounded-md hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            clearMutation.mutate();
                        }}
                    >
                        <CheckCircle2 size={14} className="group-hover:text-accent-500" />
                    </button>
                </div>
            </div>
        </div>
    );
}
