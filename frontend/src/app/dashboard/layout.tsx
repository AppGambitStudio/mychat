'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

import { ModeToggle } from '@/components/mode-toggle';
import { API_BASE_URL } from '@/lib/utils';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const validateSession = async () => {
            try {
                // We'll hit a lightweight protected endpoint to verify the token is valid.
                // If it fails with 401, the api utility (if used) or this check will redirect.
                // However, since we haven't refactored api.ts to be used here yet (and layout shouldn't depend on it circularly if possible),
                // we'll stick to simple fetch but handle 401 explicitly, OR use api.get if possible.
                // Using api.get('/auth/me') seems best, assuming such route exists or we use a simple one like /chat-spaces.
                // Let's use /auth/me if exists, or just /chat-spaces? 
                // We don't have /auth/me. Let's use /chat-spaces as a lightweight check.
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const res = await fetch(`${API_BASE_URL}/chat-spaces`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem('token');
                    router.push('/login');
                } else if (!res.ok) {
                    // Other errors (e.g. 500) might not mean the session is invalid, 
                    // but we should probably still consider redirecting if we can't verify.
                    // For now, if it's not unauthorized, we allow loading but logs will show issues.
                    setIsLoading(false);
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                // Network error? Allow load, other components will fail gracefully or show error.
                // Or better, just redirect to login if we can't verify? 
                // Let's be safe: if network error, maybe show loading or retry. 
                // For now, let's assume if token formats look ok, we proceed.
                setIsLoading(false);
            }
        };
        validateSession();
    }, [router]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-14 items-center gap-4 border-b bg-white/40 dark:bg-black/40 px-6 backdrop-blur-xl lg:h-[60px]">
                    <div className="flex-1">
                        {/* Add breadcrumbs or page title here if needed */}
                    </div>
                    <ModeToggle />
                </header>
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
