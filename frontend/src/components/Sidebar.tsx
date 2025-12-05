'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const links = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="flex flex-col h-screen w-64 border-r border-gray-200 dark:border-white/10 bg-white dark:bg-black/50 backdrop-blur-xl text-gray-900 dark:text-white transition-colors duration-300">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-600">MyChat</h1>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                'flex items-center px-4 py-3 rounded-lg transition-all duration-200',
                                pathname === link.href
                                    ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-600/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                            )}
                        >
                            <Icon className="w-5 h-5 mr-3" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-white/10">
                <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                    onClick={handleLogout}
                >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                </Button>
                <div className="mt-4 text-xs text-center text-gray-400 dark:text-gray-500">
                    &copy; {new Date().getFullYear()} APPGAMBiT MyChat
                </div>
            </div>
        </div>
    );
}
