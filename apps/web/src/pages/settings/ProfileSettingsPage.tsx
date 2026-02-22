import { useState, FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, usersApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { User, Mail, Camera, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfileSettingsPage() {
    const { user, setUser } = useAuthStore();
    const qc = useQueryClient();
    const [form, setForm] = useState({
        name: user?.name || '',
        avatarUrl: user?.avatarUrl || '',
    });

    const updateMutation = useMutation({
        mutationFn: (data: typeof form) => usersApi.updateProfile(data),
        onSuccess: (res) => {
            const updated = res.data.data;
            setUser({ ...user!, ...updated });
            toast.success('Profile updated!');
        },
        onError: () => toast.error('Failed to update profile'),
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        updateMutation.mutate(form);
    };

    return (
        <div className="max-w-lg mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-100">Profile Settings</h1>
                <p className="text-gray-500 text-sm mt-0.5">Update your personal information</p>
            </div>

            <div className="card p-6 space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        {form.avatarUrl ? (
                            <img
                                src={form.avatarUrl}
                                alt="Avatar"
                                className="w-16 h-16 rounded-2xl object-cover border border-gray-700"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-accent-600/20 border border-accent-500/20 flex items-center justify-center text-2xl font-bold text-accent-400 uppercase">
                                {user?.name?.[0] ?? '?'}
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-200">{user?.email}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{user?.isEmailVerified ? '✅ Email verified' : '⚠️ Email not verified'}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                        <div className="relative">
                            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                className="input pl-9"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                placeholder="Your name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                        <div className="relative">
                            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="email"
                                className="input pl-9 opacity-50 cursor-not-allowed"
                                value={user?.email || ''}
                                disabled
                            />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Avatar URL</label>
                        <div className="relative">
                            <Camera size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="url"
                                className="input pl-9"
                                value={form.avatarUrl}
                                onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <button type="submit" disabled={updateMutation.isPending} className="btn-primary btn-md w-full">
                        {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}
