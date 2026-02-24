import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, MessageSquare, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { employeesApi, conversationsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

interface NewMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NewMessageModal({ isOpen, onClose }: NewMessageModalProps) {
    const { activeOrg, user } = useAuthStore();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

    const { data: employeesRes, isLoading } = useQuery({
        queryKey: ['employees', activeOrg?.id],
        queryFn: () => employeesApi.getAll(activeOrg?.id!),
        enabled: !!activeOrg && isOpen,
    });

    const employees = employeesRes?.data?.data || [];

    // Filter out current user and map to users
    const availableUsers = employees
        .filter((emp: any) => emp.user.id !== user?.id)
        .map((emp: any) => emp.user)
        .filter((u: any) =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const createMutation = useMutation({
        mutationFn: () => conversationsApi.create({
            userIds: selectedUsers.map(u => u.id),
            isGroup: selectedUsers.length > 1
        }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            toast.success('Conversation started!');
            navigate(`/conversations/${res.data.data.id}`);
            onClose();
            setSelectedUsers([]);
            setSearchQuery('');
        },
        onError: () => {
            toast.error('Failed to start conversation');
        }
    });

    if (!isOpen) return null;

    const toggleUser = (user: any) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleCreate = () => {
        if (selectedUsers.length === 0) return;
        createMutation.mutate();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col h-[600px] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5 px-2">
                        <MessageSquare size={20} className="text-gray-900" />
                        <h2 className="text-lg font-bold text-gray-900">New Message</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {selectedUsers.map(u => (
                            <div key={u.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-50 text-accent-700 rounded-full text-sm font-medium">
                                <div className="w-5 h-5 rounded-full bg-accent-200 flex items-center justify-center text-[10px] text-accent-800 uppercase">
                                    {u.name[0]}
                                </div>
                                {u.name}
                                <button onClick={() => toggleUser(u)} className="ml-1 text-accent-400 hover:text-accent-600">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Type a name to search..."
                            className="w-full pl-9 pr-4 py-2 border-none bg-gray-50 focus:bg-gray-100 rounded-xl outline-none transition-colors placeholder:text-gray-400 text-sm"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-400"></div>
                        </div>
                    ) : availableUsers.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 text-sm">
                            No matching users found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {availableUsers.map((u: any) => {
                                const isSelected = selectedUsers.some(su => su.id === u.id);
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => toggleUser(u)}
                                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 uppercase flex-shrink-0">
                                            {u.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                        </div>
                                        <div className={clsx(
                                            "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                                            isSelected ? "bg-accent-600 border-accent-600" : "bg-white border-gray-300"
                                        )}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={handleCreate}
                        disabled={selectedUsers.length === 0 || createMutation.isPending}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-accent-600 hover:bg-accent-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                    >
                        {createMutation.isPending ? 'Starting...' : 'Start Chat'}
                    </button>
                </div>
            </div>
        </div>
    );
}
