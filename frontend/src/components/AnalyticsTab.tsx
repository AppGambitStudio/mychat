import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, MessageSquare, Eye, Activity } from 'lucide-react';


interface AnalyticsTabProps {
    chatSpaceId: string;
}

export default function AnalyticsTab({ chatSpaceId }: AnalyticsTabProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`http://localhost:6002/api/chat-spaces/${chatSpaceId}/analytics`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch analytics:', err);
                setError('Failed to load analytics data.');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [chatSpaceId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">
                {error}
            </div>
        );
    }

    if (!stats) return null;

    const { aggregates, daily, topQuestions } = stats;

    // Calculate max value for bar chart scaling
    const maxDailyChats = Math.max(...daily.map((d: any) => d.total_chats), 1);

    return (
        <div className="space-y-6">
            {/* Aggregate Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{aggregates.totalLoads}</div>
                        <p className="text-xs text-muted-foreground">Widget loads</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{aggregates.totalChats}</div>
                        <p className="text-xs text-muted-foreground">Conversations started</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Messages</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{aggregates.totalMessages}</div>
                        <p className="text-xs text-muted-foreground">Total messages exchanged</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{aggregates.uniqueUsers}</div>
                        <p className="text-xs text-muted-foreground">Estimated unique visitors</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Activity Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Daily Activity (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-end gap-1 overflow-x-auto pb-2">
                            {daily.length === 0 && (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    No activity yet
                                </div>
                            )}
                            {daily.map((day: any) => (
                                <div key={day.date} className="flex flex-col items-center gap-1 min-w-[20px] flex-1 group relative">
                                    <div
                                        className="w-full bg-blue-500/20 hover:bg-blue-500/40 rounded-t transition-all relative"
                                        style={{ height: `${(day.total_chats / maxDailyChats) * 100}%`, minHeight: '4px' }}
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                                            {day.date}: {day.total_chats} chats
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground rotate-0 truncate w-full text-center">
                                        {new Date(day.date).getDate()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Questions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {topQuestions.length === 0 && (
                                <div className="text-sm text-muted-foreground text-center py-4">
                                    No questions recorded yet
                                </div>
                            )}
                            {topQuestions.map((q: any, i: number) => (
                                <div key={i} className="flex items-start justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
                                    <p className="text-sm font-medium line-clamp-2" title={q.question}>
                                        {q.question || 'Unknown'}
                                    </p>
                                    <Badge variant="secondary" className="shrink-0">
                                        {q.count}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
