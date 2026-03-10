import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { formsApi } from '../../lib/api';
import { useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export default function PublicFormPage() {
    const { id } = useParams();
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const { data: form, isLoading, error } = useQuery({
        queryKey: ['public-form', id],
        queryFn: () => formsApi.get(id!).then(r => r.data), // This uses the same helper, ensures backend allows public access
        enabled: !!id,
        retry: false,
    });

    const submitMutation = useMutation({
        mutationFn: (data: any) => formsApi.submit(id!, data),
        onSuccess: () => {
            setIsSubmitted(true);
            toast.success('Form submitted successfully!');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to submit form');
        }
    });

    const handleInputChange = (field: any, value: any) => {
        const key = field.mapping || field.label;
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submitMutation.mutate(formData);
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
        </div>
    );

    if (error || !form || !form.isActive) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-10 text-center space-y-6 shadow-2xl">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto">
                    <AlertCircle size={40} />
                </div>
                <h1 className="text-2xl font-black text-white">Form Not Available</h1>
                <p className="text-gray-400">This form does not exist or has been deactivated by the owner.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="btn-ghost text-sm font-bold uppercase tracking-widest"
                >
                    Try Again
                </button>
            </div>
        </div>
    );

    if (isSubmitted) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent">
            <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-10 text-center space-y-6 shadow-3xl animate-slide-in-up">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mx-auto shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                    <CheckCircle2 size={48} />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-white">Submitted!</h1>
                    <p className="text-gray-400">Thank you for your submission. Your request has been received and will be processed shortly.</p>
                </div>
                <button
                    onClick={() => {
                        setIsSubmitted(false);
                        setFormData({});
                    }}
                    className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-2xl font-black transition-all"
                >
                    Submit Another
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-gray-100 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />

            <div className="max-w-2xl w-full bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-[2.5rem] p-8 md:p-14 shadow-3xl animate-fade-in relative z-10">
                <header className="mb-12 space-y-4">
                    <div className="w-16 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-6" />
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                        {form.name}
                    </h1>
                    {form.description && (
                        <p className="text-lg text-gray-400 leading-relaxed font-medium max-w-lg">
                            {form.description}
                        </p>
                    )}
                </header>

                <form onSubmit={handleSubmit} className="space-y-10">
                    <div className="space-y-8">
                        {form.fields.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((field: any) => (
                            <div key={field.id} className="space-y-3 group">
                                <label className="text-sm font-bold text-gray-400 group-focus-within:text-indigo-400 transition-colors flex items-center gap-2">
                                    {field.label}
                                    {field.required && <span className="text-red-500 text-lg">*</span>}
                                </label>

                                {field.type === 'TEXTAREA' ? (
                                    <textarea
                                        required={field.required}
                                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                                        className="w-full bg-gray-900/80 border-2 border-gray-800 rounded-2xl p-4 text-white focus:border-indigo-500 focus:bg-gray-900 outline-none transition-all min-h-[120px] shadow-sm resize-none"
                                        onChange={(e) => handleInputChange(field, e.target.value)}
                                        value={formData[field.mapping || field.label] || ''}
                                    />
                                ) : field.type === 'DROPDOWN' ? (
                                    <select
                                        required={field.required}
                                        className="w-full bg-gray-900/80 border-2 border-gray-800 rounded-2xl p-4 text-white focus:border-indigo-500 focus:bg-gray-900 outline-none transition-all h-14 shadow-sm appearance-none cursor-pointer"
                                        onChange={(e) => handleInputChange(field, e.target.value)}
                                        value={formData[field.mapping || field.label] || ''}
                                    >
                                        <option value="">Select an option...</option>
                                        {(field.options || []).map((opt: string) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                                        required={field.required}
                                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                                        className="w-full bg-gray-900/80 border-2 border-gray-800 rounded-2xl p-4 text-white focus:border-indigo-500 focus:bg-gray-900 outline-none transition-all h-14 shadow-sm"
                                        onChange={(e) => handleInputChange(field, e.target.value)}
                                        value={formData[field.mapping || field.label] || ''}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={submitMutation.isPending}
                        className="w-full group relative overflow-hidden h-16 bg-white hover:bg-gray-100 text-black rounded-2xl font-black text-lg transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {submitMutation.isPending ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                <span>Submit Request</span>
                                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <footer className="mt-16 pt-8 border-t border-gray-800/30 text-center">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest flex items-center justify-center gap-2">
                        Powered by <span className="text-white">TrickleUp</span>
                    </p>
                </footer>
            </div>
        </div>
    );
}
