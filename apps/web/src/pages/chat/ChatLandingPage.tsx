import { MessageSquare } from 'lucide-react';

export default function ChatLandingPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full bg-gray-950 p-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-6">
                <MessageSquare size={32} className="text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Welcome to Chat</h2>
            <p className="text-gray-500 max-w-md text-center">
                Select a channel or direct message from the sidebar to start collaborating with your team.
            </p>
        </div>
    );
}
