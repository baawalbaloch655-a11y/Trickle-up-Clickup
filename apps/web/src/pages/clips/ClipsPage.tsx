import { Video } from 'lucide-react';

export default function ClipsPage() {
    return (
        <div className="flex-1 flex flex-col h-full bg-gray-950 overflow-y-auto">
            <div className="p-8 border-b border-gray-800 bg-gray-900/30">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-accent-600/20 text-accent-500 flex items-center justify-center">
                        <Video size={20} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-100 tracking-tight">Clips</h1>
                </div>
                <p className="text-gray-400">Record, share, and manage video clips with your team.</p>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
                <p className="text-gray-500">Clips feature coming soon.</p>
            </div>
        </div>
    );
}
