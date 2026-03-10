import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Activity, Plus, Layout, MoreVertical, Trash2 } from 'lucide-react';
import { dashboardsApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export default function DashboardsListPage() {
    const qc = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    const { data: res, isLoading } = useQuery({
        queryKey: ['dashboards'],
        queryFn: dashboardsApi.list,
    });

    const dashboards = res?.data?.data || [];

    const createMutation = useMutation({
        mutationFn: (name: string) => dashboardsApi.create({ name }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['dashboards'] });
            setIsCreating(false);
            setNewName('');
            toast.success('Dashboard created');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => dashboardsApi.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['dashboards'] });
            toast.success('Dashboard deleted');
        }
    });

    return (
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-8 custom-scrollbar">
            <div className="max-w-[1200px] mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-100 flex items-center gap-3 tracking-tight">
                            <Activity className="text-accent-500" />
                            Dashboards
                        </h1>
                        <p className="text-gray-500 mt-1">Create custom views and analytics</p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn-primary flex items-center gap-2 px-4 py-2"
                    >
                        <Plus size={16} /> New Dashboard
                    </button>
                </div>

                {isCreating && (
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-xl flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
                        <input
                            autoFocus
                            placeholder="Dashboard Name..."
                            className="input-primary flex-1"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newName) createMutation.mutate(newName);
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                        />
                        <button
                            onClick={() => { if (newName) createMutation.mutate(newName); }}
                            className="btn-primary px-4 py-2"
                            disabled={!newName || createMutation.isPending}
                        >
                            Create
                        </button>
                        <button
                            onClick={() => setIsCreating(false)}
                            className="btn-ghost px-4 py-2"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-gray-800 border-t-accent-500 animate-spin" /></div>
                ) : dashboards.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl bg-gray-900/30">
                        <Layout size={48} className="mx-auto text-gray-700 mb-4" />
                        <h3 className="text-lg font-bold text-gray-300">No dashboards yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2">Create a dashboard to track project metrics, visualize workload, and build custom reports.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="btn-primary mt-6 px-6 py-2 shadow-glow"
                        >
                            Create First Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dashboards.map((board: any) => (
                            <div key={board.id} className="group relative bg-gray-900 border border-gray-800 rounded-xl hover:border-accent-500/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)] transition-all overflow-hidden">
                                <Link to={`/dashboards/${board.id}`} className="block p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                                                <Layout size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-200">{board.name}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">{board.widgets?.length || 0} widgets</p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (confirm('Are you sure you want to delete this dashboard?')) {
                                            deleteMutation.mutate(board.id);
                                        }
                                    }}
                                    className="absolute top-4 right-4 p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 rounded-md"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
