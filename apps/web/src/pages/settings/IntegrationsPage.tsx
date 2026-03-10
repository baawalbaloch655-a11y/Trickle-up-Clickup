import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Webhook, Link2, Sparkles, Server } from 'lucide-react';
import { webhooksApi, integrationsApi, aiApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import clsx from 'clsx';

export default function IntegrationsPage() {
    const { activeOrg } = useAuthStore();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks' | 'ai'>('integrations');
    const [newWebhookUrl, setNewWebhookUrl] = useState('');

    const { data: webhooks = [] } = useQuery({
        queryKey: ['webhooks', activeOrg?.id],
        queryFn: () => webhooksApi.list(),
        enabled: !!activeOrg,
    });

    const { data: integrations = [] } = useQuery({
        queryKey: ['integrations', activeOrg?.id],
        queryFn: () => integrationsApi.list(),
        enabled: !!activeOrg,
    });

    const { data: aiOps = [] } = useQuery({
        queryKey: ['aiOperations', activeOrg?.id],
        queryFn: () => aiApi.list(),
        enabled: !!activeOrg,
    });

    const createWebhookMutation = useMutation({
        mutationFn: (url: string) => webhooksApi.create({ url, events: ['task.created', 'task.updated'] }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            setNewWebhookUrl('');
        },
    });

    const deleteWebhookMutation = useMutation({
        mutationFn: (id: string) => webhooksApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['webhooks'] }),
    });

    // Instead of mocking a naive post, we'll actually initiate the OAuth flow
    // by redirecting to the backend init endpoint or simulating it.
    const connectIntegrationMutation = useMutation({
        mutationFn: async (provider: string) => {
            // Initiate OAuth flow through the backend
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/integrations/${provider}/auth`, {
                headers: { 'x-org-id': activeOrg?.id || '', Authorization: `Bearer ${useAuthStore.getState().accessToken}` }
            });
            const data = await response.json();
            if (data.url) {
                // In a real app we redirect: window.location.href = data.url;
                // For simulator purposes, since we returned a callback URL right away:
                const cbResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${data.url}`, {
                    headers: { 'x-org-id': activeOrg?.id || '', Authorization: `Bearer ${useAuthStore.getState().accessToken}`, 'Content-Type': 'application/json' },
                });
                return cbResponse.json();
            }
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
    });

    const deleteIntegrationMutation = useMutation({
        mutationFn: (id: string) => integrationsApi.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integrations'] }),
    });

    const mockAiMutation = useMutation({
        mutationFn: () => aiApi.create({ action: 'summarize', prompt: 'Summarize the latest 5 tasks.' }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aiOperations'] }),
    });

    const tabs = [
        { id: 'integrations', label: 'Third-Party Apps', icon: Link2 },
        { id: 'webhooks', label: 'Webhooks', icon: Webhook },
        { id: 'ai', label: 'AI Operations', icon: Sparkles },
    ] as const;

    return (
        <div className="flex-1 overflow-auto bg-gray-50 flex flex-col h-full">
            <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Integrations & Workflows</h1>
                    <p className="text-gray-500">Manage third-party apps, custom webhooks, and view AI usage quotas.</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto w-full px-8 py-6">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mb-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                'flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                                activeTab === tab.id
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                            )}
                        >
                            <tab.icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {activeTab === 'integrations' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { provider: 'slack', name: 'Slack', desc: 'Send task notifications to Slack channels.', icon: "SL" },
                            { provider: 'github', name: 'GitHub', desc: 'Link pull requests to specific tasks.', icon: "GH" },
                            { provider: 'google_drive', name: 'Google Drive', desc: 'Attach files directly from Drive.', icon: "GD" }
                        ].map(app => {
                            const connected = integrations.find((i: any) => i.provider === app.provider);
                            return (
                                <div key={app.provider} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xl">
                                            {app.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{app.name}</h3>
                                            <p className="text-sm text-gray-500">{app.desc}</p>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-4 border-t border-gray-100 flex justify-end">
                                        {connected ? (
                                            <button
                                                onClick={() => deleteIntegrationMutation.mutate(connected.id)}
                                                className="text-red-600 hover:text-red-700 text-sm font-medium"
                                            >
                                                Disconnect
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => connectIntegrationMutation.mutate(app.provider)}
                                                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                            >
                                                Connect
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'webhooks' && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <Webhook className="w-5 h-5 mr-2 text-gray-500" />
                            Registered Webhooks
                        </h2>

                        <div className="flex space-x-3 mb-6">
                            <input
                                type="url"
                                placeholder="https://api.example.com/webhook"
                                value={newWebhookUrl}
                                onChange={(e) => setNewWebhookUrl(e.target.value)}
                                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                onClick={() => createWebhookMutation.mutate(newWebhookUrl)}
                                disabled={!newWebhookUrl || createWebhookMutation.isPending}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                            >
                                <Plus size={16} className="mr-1" />
                                Add Webhook
                            </button>
                        </div>

                        <div className="space-y-3">
                            {webhooks.length === 0 ? (
                                <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg">No webhooks registered.</p>
                            ) : (
                                webhooks.map((hook: any) => (
                                    <div key={hook.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <Server size={20} className="text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{hook.url}</p>
                                                <div className="flex space-x-2 mt-1">
                                                    {hook.events.map((e: string) => (
                                                        <span key={e} className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{e}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteWebhookMutation.mutate(hook.id)}
                                            className="text-gray-400 hover:text-red-500 p-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Sparkles className="w-5 h-5 mr-2 text-indigo-500" />
                                AI Usage Logs
                            </h2>
                            <button
                                onClick={() => mockAiMutation.mutate()}
                                className="text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-md font-medium"
                            >
                                Simulate AI Request
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg border-b border-gray-200">Date/Time</th>
                                        <th className="px-4 py-3 border-b border-gray-200">User</th>
                                        <th className="px-4 py-3 border-b border-gray-200">Action</th>
                                        <th className="px-4 py-3 border-b border-gray-200">Tokens</th>
                                        <th className="px-4 py-3 rounded-tr-lg border-b border-gray-200">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aiOps.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No AI requests logged.</td>
                                        </tr>
                                    ) : (
                                        aiOps.map((op: any) => (
                                            <tr key={op.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                                <td className="px-4 py-3 text-gray-600">{new Date(op.createdAt).toLocaleString()}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{op.user?.name || op.userId}</td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs">{op.action}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{op.tokens} tks</td>
                                                <td className="px-4 py-3">
                                                    <span className={clsx(
                                                        "px-2 py-0.5 rounded text-xs",
                                                        op.status === 'COMPLETED' ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                                                    )}>
                                                        {op.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
