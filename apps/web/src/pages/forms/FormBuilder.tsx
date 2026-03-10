import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Plus, Trash2, GripVertical, Settings as SettingsIcon, Save, Eye } from 'lucide-react';
import { formsApi } from '../../lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export default function FormBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const { data: form, isLoading } = useQuery({
        queryKey: ['forms', id],
        queryFn: () => formsApi.get(id!).then(r => r.data),
        enabled: !!id,
    });

    const [fields, setFields] = useState<any[]>([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (form) {
            setFields(form.fields || []);
            setName(form.name || '');
            setDescription(form.description || '');
        }
    }, [form]);

    const saveMutation = useMutation({
        mutationFn: (data: any) => formsApi.update(id!, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['forms'] });
            toast.success('Form saved!');
        }
    });

    const addField = () => {
        const newField = {
            type: 'TEXT',
            label: `New Field ${fields.length + 1}`,
            required: false,
            mapping: 'description'
        };
        setFields([...fields, newField]);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const updateField = (index: number, data: any) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], ...data };
        setFields(newFields);
    };

    if (isLoading || !form) return <div className="p-8">Loading builder...</div>;

    return (
        <div className="flex flex-col h-screen bg-[#0a0a0a]">
            {/* Top Bar */}
            <div className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/forms')} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Form Builder</span>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-transparent border-none text-gray-100 font-bold p-0 focus:ring-0 text-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.open(`/f/${id}`, '_blank')}
                        className="btn-ghost btn-sm gap-2"
                    >
                        <Eye size={16} /> Preview
                    </button>
                    <button
                        onClick={() => saveMutation.mutate({ name, description, fields })}
                        className="btn-primary btn-sm gap-2 px-6"
                    >
                        <Save size={16} /> Save Changes
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Side: Field List / Editor */}
                <div className="w-1/2 overflow-y-auto p-12 border-r border-gray-800 bg-[#0f0f0f]/50">
                    <div className="max-w-xl mx-auto space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4">Form Customization</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block ml-1">Form Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-800 rounded-xl p-4 text-white focus:border-indigo-500 outline-none min-h-[100px] transition-all"
                                        placeholder="Add instructions for your users..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-white">Fields</h3>
                                <button
                                    onClick={addField}
                                    className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-2 text-xs font-bold uppercase"
                                >
                                    <Plus size={14} /> Add Field
                                </button>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={index} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 relative group hover:border-gray-700 transition-all shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="cursor-grab text-gray-600 hover:text-gray-400">
                                                    <GripVertical size={18} />
                                                </div>
                                                <input
                                                    value={field.label}
                                                    onChange={(e) => updateField(index, { label: e.target.value })}
                                                    className="bg-transparent border-none text-white font-bold p-0 focus:ring-0 text-sm flex-1"
                                                    placeholder="Field Label"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeField(index)}
                                                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Type</label>
                                                <select
                                                    value={field.type}
                                                    onChange={(e) => updateField(index, { type: e.target.value })}
                                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm text-gray-300 outline-none focus:border-indigo-500"
                                                >
                                                    <option value="TEXT">Short Text</option>
                                                    <option value="TEXTAREA">Long Text</option>
                                                    <option value="NUMBER">Number</option>
                                                    <option value="DATE">Date</option>
                                                    <option value="DROPDOWN">Dropdown</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">Map to Task</label>
                                                <select
                                                    value={field.mapping}
                                                    onChange={(e) => updateField(index, { mapping: e.target.value })}
                                                    className="w-full bg-gray-950 border border-gray-800 rounded-lg p-2 text-sm text-gray-300 outline-none focus:border-indigo-500"
                                                >
                                                    <option value="title">Task Title</option>
                                                    <option value="description">Description</option>
                                                    <option value="priority">Priority</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                            <input
                                                type="checkbox"
                                                checked={field.required}
                                                onChange={(e) => updateField(index, { required: e.target.checked })}
                                                className="rounded bg-gray-950 border-gray-800 text-indigo-500 focus:ring-0"
                                            />
                                            Required field
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Visual Preview */}
                <div className="w-1/2 bg-[#050505] overflow-y-auto p-12">
                    <div className="max-w-md mx-auto">
                        <div className="text-center mb-8">
                            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-[0.2em] mb-2 block">Live Preview</span>
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-10 shadow-3xl space-y-8 min-h-[600px]">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-black text-white">{name || 'Form Title'}</h1>
                                <p className="text-sm text-gray-400">{description || 'Form description preview...'}</p>
                            </div>

                            <div className="space-y-6">
                                {fields.map((field, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <label className="text-sm font-bold text-gray-300">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        {field.type === 'TEXTAREA' ? (
                                            <div className="h-24 w-full bg-gray-950 border border-gray-800 rounded-2xl" />
                                        ) : (
                                            <div className="h-12 w-full bg-gray-950 border border-gray-800 rounded-2xl" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-white shadow-glow mt-8">
                                Submit Task
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
