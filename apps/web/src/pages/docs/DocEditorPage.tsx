import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docsApi } from '../../lib/api';
import { ArrowLeft, GripVertical, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface Block {
    id: string;
    type: 'h1' | 'h2' | 'h3' | 'p' | 'quote';
    content: string;
}

export default function DocEditorPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [title, setTitle] = useState('');
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeout = useRef<NodeJS.Timeout>();

    const { data: doc, isLoading } = useQuery({
        queryKey: ['docs', id],
        queryFn: async () => {
            const res = await docsApi.get(id!);
            return res.data.data;
        }
    });

    useEffect(() => {
        if (doc) {
            setTitle(doc.title);
            try {
                const parsed = JSON.parse(doc.content);
                setBlocks(parsed.blocks?.length ? parsed.blocks : [{ id: crypto.randomUUID(), type: 'p', content: '' }]);
            } catch (e) {
                setBlocks([{ id: crypto.randomUUID(), type: 'p', content: '' }]);
            }
        }
    }, [doc]);

    const updateDoc = useMutation({
        mutationFn: (data: any) => docsApi.update(id!, data),
        onSuccess: () => setIsSaving(false)
    });

    // Auto-save logic
    const triggerSave = (newTitle: string, newBlocks: Block[]) => {
        setIsSaving(true);
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            updateDoc.mutate({
                title: newTitle,
                content: JSON.stringify({ blocks: newBlocks })
            });
        }, 1000);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = e.target.value;
        setTitle(t);
        triggerSave(t, blocks);
    };

    const handleBlockChange = (blockId: string, content: string, type: Block['type']) => {
        const newBlocks = blocks.map(b => b.id === blockId ? { ...b, content, type } : b);
        setBlocks(newBlocks);
        triggerSave(title, newBlocks);
    };

    const addBlock = (index: number) => {
        const newBlock: Block = { id: crypto.randomUUID(), type: 'p', content: '' };
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        setBlocks(newBlocks);
        triggerSave(title, newBlocks);
    };

    const removeBlock = (index: number) => {
        if (blocks.length <= 1) return;
        const newBlocks = blocks.filter((_, i) => i !== index);
        setBlocks(newBlocks);
        triggerSave(title, newBlocks);
    };

    // Keyboard navigation (simple Enter to create new block)
    const handleKeyDown = (e: React.KeyboardEvent, index: number, block: Block) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addBlock(index);
        } else if (e.key === 'Backspace' && block.content === '') {
            e.preventDefault();
            removeBlock(index);
        }
    };

    if (isLoading) return <div className="pt-20 text-center text-gray-500">Loading document...</div>;

    return (
        <div className="flex-1 flex flex-col pt-16 bg-white min-h-screen">
            {/* Toolbar */}
            <div className="sticky top-16 z-10 w-full bg-white/80 backdrop-blur border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/docs')} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-sm font-medium text-gray-500">
                        {doc?.space?.name ? `${doc.space.name} / ` : ''}Docs
                    </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    {isSaving ? (
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" /> Saving...</span>
                    ) : (
                        <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={16} /> Saved</span>
                    )}
                </div>
            </div>

            {/* Editor Canvas */}
            <div className="flex-1 overflow-y-auto pb-40">
                <div className="max-w-3xl mx-auto w-full px-8 py-12">
                    {/* Title */}
                    <input
                        className="w-full text-5xl font-extrabold text-gray-900 border-none outline-none placeholder-gray-300 mb-10 bg-transparent"
                        placeholder="Untitled"
                        value={title}
                        onChange={handleTitleChange}
                    />

                    {/* Blocks */}
                    <div className="space-y-1">
                        {blocks.map((block, i) => (
                            <div key={block.id} className="group relative flex items-start gap-2 -ml-8">
                                <div className="w-8 pt-1.5 opacity-0 group-hover:opacity-100 flex items-center justify-end gap-1 transition-opacity">
                                    <button onClick={() => addBlock(i)} className="text-gray-400 hover:text-gray-600">
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="flex-1 min-w-0 relative">
                                    <textarea
                                        className={clsx(
                                            "w-full resize-none border-none outline-none bg-transparent py-1.5 text-gray-800 focus:ring-0 leading-relaxed",
                                            block.type === 'h1' && "text-3xl font-bold mt-6 mb-2 text-gray-900",
                                            block.type === 'h2' && "text-2xl font-bold mt-4 mb-2 text-gray-900",
                                            block.type === 'h3' && "text-xl font-bold mt-3 mb-1 text-gray-900",
                                            block.type === 'p' && "text-base",
                                            block.type === 'quote' && "text-lg text-gray-600 italic border-l-4 border-gray-300 pl-4 py-2 my-2 bg-gray-50 rounded-r-lg"
                                        )}
                                        value={block.content}
                                        placeholder={block.type === 'p' ? "Type '/' for commands or start typing..." : `Heading ${block.type.replace('h', '')}`}
                                        onChange={(e) => {
                                            // Handle markdown-like shortcuts natively
                                            let val = e.target.value;
                                            let newType = block.type;

                                            // VERY basic pseudo-markdown parsing in real-time
                                            if (val.startsWith('# ') && newType !== 'h1') { val = val.substring(2); newType = 'h1'; }
                                            if (val.startsWith('## ') && newType !== 'h2') { val = val.substring(3); newType = 'h2'; }
                                            if (val.startsWith('### ') && newType !== 'h3') { val = val.substring(4); newType = 'h3'; }
                                            if (val.startsWith('> ') && newType !== 'quote') { val = val.substring(2); newType = 'quote'; }

                                            // Auto-resize textarea
                                            e.target.style.height = 'auto';
                                            e.target.style.height = `${e.target.scrollHeight}px`;

                                            handleBlockChange(block.id, val, newType);
                                        }}
                                        onKeyDown={(e) => handleKeyDown(e, i, block)}
                                        rows={1}
                                        autoFocus={i === blocks.length - 1} // autofocus last added block
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
