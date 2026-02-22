import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { orgsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function InviteEmployeeModal({ isOpen, onClose }: Props) {
    const { activeOrg } = useAuthStore();
    const qc = useQueryClient();
    const [email, setEmail] = useState('');
    const [roleId, setRoleId] = useState('');

    const { data: orgData, isLoading: loadingRoles } = useQuery({
        queryKey: ['org', activeOrg?.id],
        queryFn: () => orgsApi.get(activeOrg!.id).then((r) => r.data.data),
        enabled: isOpen && !!activeOrg,
    });

    const roles = orgData?.roles || [];

    useEffect(() => {
        if (!roleId && roles.length > 0) {
            const defaultRole = roles.find((r: any) => r.isDefault) || roles[0];
            if (defaultRole) setRoleId(defaultRole.id);
        }
    }, [roles, roleId]);

    const inviteMutation = useMutation({
        mutationFn: () => orgsApi.invite(activeOrg!.id, { email, roleId }),
        onSuccess: () => {
            toast.success('Employee invited successfully');
            qc.invalidateQueries({ queryKey: ['employees', activeOrg?.id] });
            onClose();
            setEmail('');
            setRoleId('');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to invite employee');
        }
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl relative animate-in slide-in-from-bottom-4 duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                        Invite Employee
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 mb-6">
                        Add a new member to your organization team.
                    </p>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (email && roleId) inviteMutation.mutate();
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="colleague@company.com"
                                className="input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                Role
                            </label>
                            {loadingRoles ? (
                                <div className="h-10 flex items-center text-sm text-gray-500">Loading roles...</div>
                            ) : (
                                <select
                                    required
                                    value={roleId}
                                    onChange={(e) => setRoleId(e.target.value)}
                                    className="input"
                                >
                                    <option value="" disabled>Select a role...</option>
                                    {roles.map((role: any) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={inviteMutation.isPending || !email || !roleId}
                                className="btn-primary"
                            >
                                {inviteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Send Invite'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
