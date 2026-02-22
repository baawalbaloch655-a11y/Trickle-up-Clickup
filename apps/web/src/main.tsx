import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { queryClient } from './lib/queryClient';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: '#1c1c28',
                        color: '#f0f0f8',
                        border: '1px solid #2a2a3d',
                        borderRadius: '12px',
                        fontSize: '14px',
                    },
                    success: { iconTheme: { primary: '#22c55e', secondary: '#1c1c28' } },
                    error: { iconTheme: { primary: '#ef4444', secondary: '#1c1c28' } },
                }}
            />
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    </React.StrictMode>,
);
