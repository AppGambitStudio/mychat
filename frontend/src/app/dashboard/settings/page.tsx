'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/utils';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        responseTone: 'professional',
        kbConnectorUrl: '',
        kbConnectorApiKey: '',
        kbConnectorActive: false
    });
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSettings({
                    responseTone: data.responseTone || 'professional',
                    kbConnectorUrl: data.kbConnectorUrl || '',
                    kbConnectorApiKey: data.kbConnectorApiKey || '',
                    kbConnectorActive: data.kbConnectorActive || false
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error('Failed to save');
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const isPremium = user?.subscription_tier === 'pro' || user?.subscription_tier === 'enterprise';

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8 pb-24">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">Manage your preferences and integrations.</p>
            </div>

            <div className="grid gap-8">
                {/* Tone Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Response Tone</CardTitle>
                        <CardDescription>Customize how the bot communicates with users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 max-w-xl">
                            <div className="space-y-2">
                                <Label htmlFor="tone">Tone Style</Label>
                                <select
                                    id="tone"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={settings.responseTone}
                                    onChange={(e) => setSettings({ ...settings, responseTone: e.target.value })}
                                >
                                    <option value="professional">Professional - Formal and objective</option>
                                    <option value="friendly">Friendly - Casual and approachable</option>
                                    <option value="concise">Concise - Short and to the point</option>
                                    <option value="detailed">Detailed - Comprehensive explanations</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Knowledgebase Connector Section */}
                <Card className="relative overflow-hidden border-blue-100 dark:border-blue-900/50">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle>Knowledgebase Connector</CardTitle>
                                <CardDescription>Connect external APIs to answer questions when context is missing.</CardDescription>
                            </div>
                            {!isPremium && <Badge variant="secondary" className="h-6">Premium</Badge>}
                        </div>
                    </CardHeader>
                    <CardContent className={!isPremium ? "opacity-50 blur-[2px] pointer-events-none transition-all duration-300" : ""}>
                        <div className="space-y-6 max-w-xl">
                            <div className="flex items-center space-x-2 border p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                                <input
                                    type="checkbox"
                                    id="kbActive"
                                    checked={settings.kbConnectorActive}
                                    onChange={(e) => setSettings({ ...settings, kbConnectorActive: e.target.checked })}
                                    disabled={!isPremium}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <Label htmlFor="kbActive" className="font-medium cursor-pointer">Enable External Knowledge Connector</Label>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="kbUrl">Connector Endpoint URL</Label>
                                    <Input
                                        id="kbUrl"
                                        placeholder="https://api.example.com/search"
                                        value={settings.kbConnectorUrl}
                                        onChange={(e) => setSettings({ ...settings, kbConnectorUrl: e.target.value })}
                                        disabled={!isPremium}
                                    />
                                    <p className="text-xs text-muted-foreground">The AI will send a POST request with <code>{`{ query: "user question" }`}</code> to this URL.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="kbKey">API Key (Optional)</Label>
                                    <Input
                                        id="kbKey"
                                        type="password"
                                        placeholder="sk-..."
                                        value={settings.kbConnectorApiKey}
                                        onChange={(e) => setSettings({ ...settings, kbConnectorApiKey: e.target.value })}
                                        disabled={!isPremium}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>

                    {!isPremium && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="text-center p-6 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 max-w-sm mx-4">
                                <div className="mb-4 text-4xl">🔒</div>
                                <h3 className="text-lg font-bold mb-2">Unlock Premium Features</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Upgrade to Pro to connect your own external knowledge bases and APIs.</p>
                                <Button variant="default" className="w-full">Upgrade Now</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Sticky Footer for Save */}
            <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex justify-end items-center gap-4 z-50">
                <p className="text-sm text-muted-foreground hidden md:block">
                    {saving ? 'Saving changes...' : 'Unsaved changes will be lost.'}
                </p>
                <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[120px]">
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    );
}
