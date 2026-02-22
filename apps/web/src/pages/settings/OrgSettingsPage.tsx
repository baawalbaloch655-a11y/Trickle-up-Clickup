import { useQuery } from '@tanstack/react-query';
import { orgsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Building2, Users, Crown, UserCog, Loader2, Mail } from 'lucide-react';

export default function OrgSettingsPage() {
    const activeOrg = useAuthStore((s) => s.activeOrg);

    const { data: members, isLoading } = useQuery({
        queryKey: ['org-members', activeOrg?.id],
        queryFn: () => orgsApi.members(activeOrg!.id).then((r) => r.data.data),
        enabled: !!activeOrg,
    });

    const ROLE_ICONS: Record<string, React.ReactNode> = {
        Owner: <Crown size={14} className="text-yellow-400" />,
        Admin: <UserCog size={14} className="text-accent-400" />,
        Member: <Users size={14} className="text-gray-400" />,
        Viewer: <Users size={14} className="text-gray-600" />,
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-100">Organization Settings</h1>
                <p className="text-gray-500 text-sm mt-0.5">Manage your workspace</p>
            </div>

            {/* Org info */}
            <div className="card p-5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent-600/20 border border-accent-500/20 flex items-center justify-center">
                        <Building2 size={20} className="text-accent-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-100">{activeOrg?.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="badge bg-accent-600/15 text-accent-400">{activeOrg?.plan} Plan</span>
                            <span className="text-xs text-gray-500">{activeOrg?.slug}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members */}
            <div className="card divide-y divide-gray-800">
                <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-gray-400" />
                        <h3 className="font-semibold text-gray-200">Members</h3>
                        <span className="text-xs bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
                            {members?.length ?? 0}
                        </span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="animate-spin text-accent-400" />
                    </div>
                ) : (
                    members?.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-800/40 transition-colors">
                            <div className="w-9 h-9 rounded-xl bg-accent-600/10 flex items-center justify-center text-sm font-bold text-accent-400 uppercase flex-shrink-0">
                                {m.user.name?.[0] ?? '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-200">{m.user.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Mail size={11} className="text-gray-600" />
                                    <p className="text-xs text-gray-500 truncate">{m.user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 badge bg-gray-800 text-gray-400">
                                {ROLE_ICONS[m.role.name] ?? null}
                                <span className="text-xs">{m.role.name}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
