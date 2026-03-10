import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Layout, ExternalLink, MoreVertical, Trash2, Edit2, Play, Pause } from 'lucide-react';
import { formsApi, listsApi } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx'; // Added missing import for clsx

export default function FormsListPage() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newFormName, setNewFormName] = useState('');
    const [selectedListId, setSelectedListId] = useState('');

    const { data: forms, isLoading, error: formsError } = useQuery({
        queryKey: ['forms'],
        queryFn: () => formsApi.list().then(r => Array.isArray(r.data) ? r.data : r.data.data || []),
    });

    // Fetch available lists in organization
    const { data: lists, error: listsError } = useQuery({
        queryKey: ['org-lists'],
        queryFn: () => listsApi.listAll().then(r => Array.isArray(r.data) ? r.data : r.data.data || []),
    });
    // Actually, let's just fetch from org lists if available or similar.
    // For now, let's assume we can get lists.

    if (formsError) {
        console.error('Forms Query Error:', formsError);
        toast.error('Failed to load forms.');
    }
    if (listsError) {
        console.error('Lists Query Error:', listsError);
        toast.error('Failed to load lists.');
    }
    console.log('Forms:', forms);
    console.log('Lists:', lists);

    const createForm = useMutation({
        mutationFn: (data: any) => formsApi.create(data),
        onSuccess: (res) => {
            qc.invalidateQueries({ queryKey: ['forms'] });
            setIsCreateModalOpen(false);
            navigate(`/forms/${res.id}/edit`);
            toast.success('Form created!');
        },
        onError: (err: any) => {
            console.error('Create Form Error:', err);
            toast.error(err.response?.data?.message || 'Failed to create form');
        }
    });

    const deleteForm = useMutation({
        mutationFn: (id: string) => formsApi.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['forms'] });
            toast.success('Form deleted');
        }
    });

    const toggleActive = useMutation({
        mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => formsApi.update(id, { isActive }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['forms'] })
    });

    if (isLoading) return <div className="p-8 animate-pulse">Loading forms...</div>;

    const publicUrl = (id: string) => `${window.location.origin}/f/${id}`;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">External Forms</h1>
                    <p className="text-gray-400 mt-1">Capture tasks from anyone with a simple link.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-glow"
                >
                    <Plus size={18} />
                    <span>Create Form</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {forms?.map((form: any) => (
                    <div key={form.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-all group shadow-sm hover:shadow-indigo-500/5">
                        <div className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                                    <Layout size={24} />
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => toggleActive.mutate({ id: form.id, isActive: !form.isActive })}
                                        className={clsx(
                                            "p-2 rounded-lg transition-colors",
                                            form.isActive ? "text-green-500 hover:bg-green-500/10" : "text-gray-500 hover:bg-gray-800"
                                        )}
                                        title={form.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {form.isActive ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                                    </button>
                                    <button
                                        onClick={() => navigate(`/forms/${form.id}/edit`)}
                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => deleteForm.mutate(form.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-100">{form.name}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2 mt-1">{form.description || 'No description'}</p>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Submits to:</span>
                                <span className="text-xs text-indigo-400 font-medium px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                                    {form.list?.name || 'Unknown List'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-950/50 px-6 py-4 border-t border-gray-800 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Public URL</span>
                                <span className="text-xs text-gray-400 font-mono truncate max-w-[150px]">{publicUrl(form.id)}</span>
                            </div>
                            <a
                                href={publicUrl(form.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
                            >
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                ))}

                {forms?.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-gray-900/10 border-2 border-dashed border-gray-800 rounded-3xl">
                        <Layout className="mx-auto text-gray-700 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-gray-300">No forms yet</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mt-2">Create your first form to start collecting tasks from clients or team members.</p>
                    </div>
                )}
            </div>

            {/* Simple Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                        <h2 className="text-2xl font-bold text-white mb-4">New External Form</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Form Name</label>
                                <input
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                                    placeholder="e.g. Website Bug Report"
                                    value={newFormName}
                                    onChange={(e) => setNewFormName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Target List</label>
                                <select
                                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all"
                                    value={selectedListId}
                                    onChange={(e) => setSelectedListId(e.target.value)}
                                >
                                    <option value="">Select a list...</option>
                                    {(lists || []).map((list: any) => (
                                        <option key={list.id} value={list.id}>{list.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-8">
                            <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-all">Cancel</button>
                            <button
                                onClick={() => createForm.mutate({ name: newFormName, listId: selectedListId, fields: [{ type: 'TEXT', label: 'Task Title', required: true, mapping: 'title' }] })}
                                disabled={!newFormName || !selectedListId}
                                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                            >
                                Create & Edit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
