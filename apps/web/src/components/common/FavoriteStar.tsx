import { Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '../../lib/api';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface FavoriteStarProps {
    entityType: 'SPACE' | 'FOLDER' | 'LIST' | 'TASK';
    entityId: string;
    className?: string;
}

export default function FavoriteStar({ entityType, entityId, className }: FavoriteStarProps) {
    const queryClient = useQueryClient();

    const { data: favoritesRes } = useQuery({
        queryKey: ['favorites'],
        queryFn: () => favoritesApi.list(),
    });

    const isFavorite = favoritesRes?.data?.data?.some(
        (f: any) => f.entityType === entityType && f.entityId === entityId
    );

    const toggleMutation = useMutation({
        mutationFn: () => favoritesApi.toggle({ entityType, entityId }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
            if (res.data.data.id) {
                toast.success('Added to favorites');
            } else {
                toast.success('Removed from favorites');
            }
        },
        onError: () => {
            toast.error('Failed to update favorite');
        }
    });

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleMutation.mutate();
            }}
            disabled={toggleMutation.isPending}
            className={clsx(
                "p-1 rounded-md transition-all hover:bg-gray-800/50",
                isFavorite ? "text-yellow-500" : "text-gray-500 hover:text-yellow-400/70",
                className
            )}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
            <Star
                size={16}
                className={clsx(isFavorite && "fill-yellow-500")}
            />
        </button>
    );
}
