import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docsApi } from '../../lib/api';
import { FileText, Plus, Search, Clock, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function DocsListPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    const { data: docs, isLoading } = useQuery({
        queryKey: ['docs'],
        queryFn: async () => {
            const res = await docsApi.list();
            return res.data.data;
        }
    });

    const createDoc = useMutation({
        mutationFn: () => docsApi.create({ title: 'Untitled Document' }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['docs'] });
            navigate(`/docs/${res.data.data.id}`);
        }
    });

    const deleteDoc = useMutation({
        mutationFn: (id: string) => docsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['docs'] });
            toast.success('Document deleted');
        }
    });

    const filteredDocs = docs?.filter((d: any) => d.title.toLowerCase().includes(search.toLowerCase())) || [];

    return (
        <div className="flex-1 flex flex-col pt-16 bg-white min-h-screen">
            <div className="px-8 py-6 max-w-6xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="text-blue-500" size={28} />
                            Docs
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Create, collaborate, and organize your knowledge.</p>
                    </div>
                    <button
                        onClick={() => createDoc.mutate()}
                        disabled={createDoc.isPending}
                        className="btn-primary flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={16} /> New Doc
                    </button>
                </div>

                <div className="mb-6 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search docs..."
                        className="input w-full max-w-md pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredDocs.map((doc: any) => (
                            <div
                                key={doc.id}
                                onClick={() => navigate(`/docs/${doc.id}`)}
                                className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative flex flex-col"
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteDoc.mutate(doc.id); }}
                                    className="absolute top-3 right-3 p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                                    <FileText className="text-blue-600" size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{doc.title}</h3>
                                <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-gray-500">
                                    <Clock size={12} />
                                    <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                        {filteredDocs.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <p className="text-gray-500">No documents found.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
