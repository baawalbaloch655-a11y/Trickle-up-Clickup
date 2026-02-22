import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Zap, Loader2 } from 'lucide-react';
import { authApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const { setUser, setTokens, setActiveOrg } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password) return toast.error('Please fill in all fields');
        setLoading(true);
        try {
            const res = await authApi.login({ email, password });
            const { user, accessToken, refreshToken, expiresIn } = res.data.data;
            setUser(user);
            setTokens(accessToken, refreshToken, expiresIn);

            // Set first org as active if available
            if (user.orgMembers?.length > 0) {
                const m = user.orgMembers[0];
                setActiveOrg({ ...m.org, role: m.role });
                navigate('/dashboard');
            } else {
                navigate('/select-org');
            }
            toast.success(`Welcome back, ${user.name}! 👋`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-950/30 via-gray-950 to-gray-950 pointer-events-none" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative w-full max-w-sm animate-slide-in-up">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-accent-600 flex items-center justify-center shadow-glow mb-4">
                        <Zap size={22} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-100">Welcome back</h1>
                    <p className="text-sm text-gray-500 mt-1">Sign in to your TrickleUp account</p>
                </div>

                {/* Card */}
                <form onSubmit={handleSubmit} className="card-glass p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showPw ? 'text' : 'password'}
                                className="input pr-11"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                            >
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary btn-md w-full mt-2">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-accent-400 hover:text-accent-300 font-medium">
                        Create one
                    </Link>
                </p>

                {/* Demo credentials */}
                <div className="mt-4 p-3 rounded-xl bg-gray-900/60 border border-gray-700/40 text-center">
                    <p className="text-xs text-gray-500">Demo: <span className="text-gray-400">admin@trickleup.io</span> / <span className="text-gray-400">Admin123!</span></p>
                </div>
            </div>
        </div>
    );
}
