import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { orgsApi, authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Zap, Plus, Building2, Loader2, ArrowRight, LogOut } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { disconnectSocket } from '../../lib/socket';

export default function OrgSelectPage() {
    const { setActiveOrg, logout } = useAuthStore();
    const navigate = useNavigate();
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ name: '', slug: '' });

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['orgs'],
        queryFn: () => orgsApi.list().then((r) => r.data.data),
    });

    const createMutation = useMutation({
        mutationFn: (d: { name: string; slug: string }) => orgsApi.create(d),
        onSuccess: () => {
            toast.success('Organization created!');
            setCreating(false);
            refetch();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create org'),
    });

    const handleSelect = (membership: any) => {
        setActiveOrg({ ...membership.org, role: membership.role });
        navigate('/dashboard');
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.slug) return;
        createMutation.mutate(form);
    };

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch { }
        disconnectSocket();
        logout();
        navigate('/login');
        toast.success('Logged out successfully');
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-950/20 via-gray-950 to-gray-950 pointer-events-none" />

            <button
                onClick={handleLogout}
                className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all shadow-xl z-10 backdrop-blur-sm"
            >
                <LogOut size={16} />
                <span className="text-sm font-medium">Logout</span>
            </button>

            <div className="relative w-full max-w-md animate-slide-in-up">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-accent-600 flex items-center justify-center shadow-glow mb-4">
                        <Zap size={22} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-100">Select workspace</h1>
                    <p className="text-sm text-gray-500 mt-1">Choose an organization to continue</p>
                </div>

                <div className="card-glass p-4 space-y-2">
                    {isLoading ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-accent-400" /></div>
                    ) : data?.length === 0 ? (
                        <p className="text-center text-gray-500 py-6 text-sm">No organizations yet. Create one below!</p>
                    ) : (
                        data?.map((membership: any) => (
                            <button
                                key={membership.id}
                                onClick={() => handleSelect(membership)}
                                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-800 transition-colors group text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-accent-600/20 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                                    <Building2 size={18} className="text-accent-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-200 group-hover:text-white">{membership.org.name}</p>
                                    <p className="text-xs text-gray-500">{membership.role.name} • {membership.org.plan} plan</p>
                                </div>
                                <ArrowRight size={16} className="text-gray-600 group-hover:text-accent-400 transition-colors" />
                            </button>
                        ))
                    )}

                    {/* Create new org */}
                    {!creating ? (
                        <button
                            onClick={() => setCreating(true)}
                            className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-gray-700 hover:border-accent-600/50 hover:bg-gray-800/40 transition-colors text-gray-500 hover:text-gray-300"
                        >
                            <Plus size={18} />
                            <span className="text-sm font-medium">Create new organization</span>
                        </button>
                    ) : (
                        <form onSubmit={handleCreate} className="p-4 rounded-xl border border-gray-700 bg-gray-800/40 space-y-3">
                            <p className="text-sm font-semibold text-gray-300">New Organization</p>
                            <input
                                className="input text-sm"
                                placeholder="Acme Corp"
                                value={form.name}
                                onChange={(e) => setForm({ name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                            />
                            <input
                                className="input text-sm"
                                placeholder="acme-corp"
                                value={form.slug}
                                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setCreating(false)} className="btn-secondary btn-sm flex-1">Cancel</button>
                                <button type="submit" disabled={createMutation.isPending} className="btn-primary btn-sm flex-1">
                                    {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
