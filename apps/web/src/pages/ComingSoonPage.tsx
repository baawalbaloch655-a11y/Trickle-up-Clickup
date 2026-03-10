import { Link, useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function ComingSoonPage() {
    const location = useLocation();
    const featureName = location.pathname.split('/')[1] || 'Feature';
    const formattedName = featureName.charAt(0).toUpperCase() + featureName.slice(1);

    return (
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] flex items-center justify-center p-8 custom-scrollbar">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-24 h-24 bg-accent-500/10 rounded-3xl mx-auto flex items-center justify-center border border-accent-500/20">
                    <Construction className="w-12 h-12 text-accent-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-100 mb-3 tracking-tight">{formattedName} is coming soon</h1>
                    <p className="text-gray-400 text-lg">
                        We are actively building this module to bring you the best experience to match ClickUp. Stay tuned for Epic 5 & 6!
                    </p>
                </div>
                <Link to="/home" className="btn-primary px-8 py-2.5 inline-flex mt-4 shadow-glow font-bold">
                    Return Home
                </Link>
            </div>
        </div>
    );
}
