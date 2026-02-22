import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Loader2, User } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const { setUser, setTokens } = useAuthStore();
    const navigate = useNavigate();

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
        setLoading(true);
        try {
            const res = await authApi.register(form);
            const { user, accessToken, refreshToken, expiresIn } = res.data.data;
            setUser(user);
            setTokens(accessToken, refreshToken, expiresIn);
            navigate('/select-org');
            toast.success(`Account created! Welcome, ${user.name} 🎉`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-950/20 via-gray-950 to-gray-950 pointer-events-none" />

            <div className="relative w-full max-w-sm animate-slide-in-up">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-accent-600 flex items-center justify-center shadow-glow mb-4">
                        <Zap size={22} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-100">Create account</h1>
                    <p className="text-sm text-gray-500 mt-1">Start your TrickleUp journey</p>
                </div>

                <form onSubmit={handleSubmit} className="card-glass p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                        <div className="relative">
                            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input type="text" className="input pl-9" placeholder="Jane Doe" value={form.name} onChange={set('name')} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                        <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={set('email')} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="input pr-11"
                                placeholder="Min. 8 characters"
                                value={form.password}
                                onChange={set('password')}
                                minLength={8}
                                required
                            />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary btn-md w-full mt-2">
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Already have an account?{' '}
                    <Link to="/login" className="text-accent-400 hover:text-accent-300 font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
