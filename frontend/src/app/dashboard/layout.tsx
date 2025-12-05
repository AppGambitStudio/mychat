'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

import { ModeToggle } from '@/components/mode-toggle';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        } else {
            setIsLoading(false);
        }
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
