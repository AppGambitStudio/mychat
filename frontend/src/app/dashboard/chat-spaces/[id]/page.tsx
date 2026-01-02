/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Link as LinkIcon, Upload, Trash2, RefreshCw, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AnalyticsTab from '@/components/AnalyticsTab';
import { api } from '@/lib/api';
import { API_BASE_URL, API_DOMAIN_URL } from '@/lib/utils';

interface Document {
    id: string;
    type: 'pdf' | 'url';
    file_name?: string;
    text_content?: string;
    source_url?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error_message?: string;
    created_at: string;
}

interface ChatSpace {
    id: string;
    name: string;
    endpoint_slug: string;
    api_key: string;
    widget_config?: {
        theme: string;
        primaryColor: string;
        position: 'bottom-right' | 'bottom-left' | 'bottom-center' | 'top-right' | 'top-left' | 'top-center';
        allowedDomains?: string[];
        launcherType?: 'icon' | 'text';
        launcherText?: string;
        width?: 'small' | 'medium' | 'large';
        welcomeMessage?: string;
    };
    widget_status?: 'testing' | 'live' | 'maintenance';
    last_processed_at?: string;
    data_usage_bytes?: number;
    ai_config?: {
        openRouterApiKey?: string;
        openRouterModelId?: string;
        responseTone?: 'professional' | 'friendly' | 'concise' | 'detailed';
        safetyPrompt?: string;
    };
}

export default function ChatSpaceDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [chatSpace, setChatSpace] = useState<ChatSpace | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [url, setUrl] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
    const [chatInput, setChatInput] = useState('');

    const [manualText, setManualText] = useState('');
    const [processing, setProcessing] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showProcessConfirm, setShowProcessConfirm] = useState(false);

    const fetchChatSpace = async () => {
        try {
            const data = await api.get<ChatSpace>(`/chat-spaces/${id}`);
            setChatSpace(data);
        } catch (error) {
            console.error('Failed to fetch chat space', error);
        }
    };

    const fetchDocuments = async () => {
        try {
            const data = await api.get<Document[]>(`/chat-spaces/${id}/documents`);
            setDocuments(data);
        } catch (error) {
            console.error('Failed to fetch documents', error);
        }
    };

    useEffect(() => {
        fetchChatSpace();
        fetchDocuments();
    }, [id]);

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            await api.post(`/chat-spaces/${id}/documents`, { type: 'url', source_url: url });
            setUrl('');
            fetchDocuments();
            toast.success('URL added successfully');
        } catch (error: any) {
            console.error('Failed to add URL', error);
            toast.error(`Failed to add URL: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleManualTextSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            await api.post(`/chat-spaces/${id}/documents`, {
                type: 'text',
                text_content: manualText,
                file_name: manualText.split(/\s+/).slice(0, 5).join(' ') + (manualText.split(/\s+/).length > 5 ? '...' : '')
            });
            setManualText('');
            fetchDocuments();
            toast.success('Text added successfully');
        } catch (error: any) {
            console.error('Failed to add text', error);
            toast.error(`Failed to add text: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.postForm(`/chat-spaces/${id}/documents/upload`, formData);
            setFile(null);
            const fileInput = document.getElementById('file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            fetchDocuments();
            toast.success('Document uploaded successfully');
        } catch (error: any) {
            console.error('Upload failed', error);
            toast.error(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = (docId: string) => {
        setDeleteId(docId);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/documents/${deleteId}`);
            fetchDocuments();
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Delete failed');
        }
        setDeleteId(null);
    };

    const handleProcess = async () => {
        setShowProcessConfirm(false);
        setProcessing(true);
        try {
            await api.post(`/chat-spaces/${id}/process`, {});
            await fetchChatSpace(); // Refresh to get updated last_processed_at
            await fetchDocuments(); // Refresh to show new recursively scraped documents
            toast.success('Processing completed successfully!');
        } catch (error) {
            console.error('Processing error', error);
            toast.error('Processing error.');
        } finally {
            setProcessing(false);
        }
    };

    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const handleClearDocuments = async () => {
        try {
            await api.delete(`/chat-spaces/${id}/documents`);
            toast.success('All documents cleared');
            fetchDocuments();
            fetchChatSpace(); // to reset usage stats
            setShowClearConfirm(false);
        } catch (error) {
            console.error('Clear failed', error);
            toast.error('Clear failed');
        }
    };

    const [chatLoading, setChatLoading] = useState(false);

    const handleChat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !chatSpace) return;

        const userMsg = { role: 'user', content: chatInput };
        setChatHistory([...chatHistory, userMsg]);
        setChatInput('');
        setChatLoading(true);

        try {
            // Widget API might be different (public?), check if it needs auth. 
            // Usually widget is public but here we are previewing in dashboard.
            // Using fetch explicitly here if it's external or api wrapper if internal. 
            // Based on previous code: http://localhost:6002/api/widget... which IS internal API but maybe public route?
            // Assuming we use api wrapper for consistency but widget routes might not require auth.
            // Let's stick to fetch for widget if it doesn't need auth, merging api.ts might attach auth which is fine, 
            // but api.ts handles 401. If widget returns 401 because we sent auth token to public route? Unlikely.
            // Let's use api.post but we need to check if endpoint matches.
            // Actually, let's keep it as fetch to be safe about public/private separation, 
            // OR use api.post if we consider this a dashboard action.
            // Since it is a PREVIEW, we can use api.post. However, the route is /api/widget/...

            const res = await fetch(`${API_BASE_URL}/widget/${chatSpace.endpoint_slug}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg.content }),
            });

            if (res.ok) {
                const data = await res.json();
                setChatHistory((prev) => [...prev, { role: 'assistant', content: data.message.content }]);
            } else {
                toast.error('Failed to send message');
            }
        } catch (error) {
            console.error('Chat failed', error);
            toast.error('Chat failed');
        } finally {
            setChatLoading(false);
        }
    };

    if (!chatSpace) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{chatSpace.name}</h1>
                    <p className="text-muted-foreground">Endpoint Slug: {chatSpace.endpoint_slug}</p>
                    {chatSpace.last_processed_at && (
                        <p className="text-sm text-green-600 mt-1">
                            Last Processed: {new Date(chatSpace.last_processed_at).toLocaleString()}
                        </p>
                    )}

                    {/* Usage Stats */}
                    <div className="mt-4 flex gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Links:</span>
                            <Badge variant={documents.filter(d => d.type === 'url').length >= 10 ? "destructive" : "secondary"}>
                                {documents.filter(d => d.type === 'url').length} / 10
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Documents:</span>
                            <Badge variant={documents.filter(d => d.type !== 'url').length >= 5 ? "destructive" : "secondary"}>
                                {documents.filter(d => d.type !== 'url').length} / 5
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Data Usage:</span>
                            <span className={((chatSpace.data_usage_bytes || 0) / (5 * 1024 * 1024)) > 0.9 ? "text-red-600 font-bold" : "text-muted-foreground"}>
                                {((chatSpace.data_usage_bytes || 0) / (1024 * 1024)).toFixed(2)} MB / 5 MB
                            </span>
                        </div>
                    </div>
                </div>
                <Button onClick={() => setShowProcessConfirm(true)} disabled={processing || !documents.some(d => d.status === 'pending')} className="bg-green-600 hover:bg-green-700 text-white">
                    {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    {processing ? 'Processing...' : 'Process & Train'}
                </Button>
            </div>

            <Tabs defaultValue="knowledge-base">
                <TabsList>
                    <TabsTrigger value="knowledge-base">Knowledge Base</TabsTrigger>
                    {chatSpace.last_processed_at && <TabsTrigger value="chat">Preview Chat</TabsTrigger>}
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="knowledge-base" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add URL</CardTitle>
                                <CardDescription>Scrape content from a website.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleUrlSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="url">URL</Label>
                                        <Input
                                            id="url"
                                            placeholder="https://example.com"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={uploading || documents.filter(d => d.type === 'url').length >= 10}>
                                        {uploading ? 'Processing...' : documents.filter(d => d.type === 'url').length >= 10 ? 'Limit Reached' : 'Add URL'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Fixed Text</CardTitle>
                                <CardDescription>Paste or type content directly.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleManualTextSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="manualText">Content</Label>
                                        <Textarea
                                            id="manualText"
                                            placeholder="Paste text here..."
                                            value={manualText}
                                            onChange={(e) => setManualText(e.target.value)}
                                            required
                                            className="min-h-[100px]"
                                            maxLength={2000}
                                        />
                                        <p className="text-xs text-muted-foreground text-right">
                                            {manualText.length} / 2000 characters
                                        </p>
                                    </div>
                                    <Button type="submit" disabled={uploading}>
                                        {uploading ? 'Saving...' : 'Add Text'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Upload Documents</CardTitle>
                                <CardDescription>Upload PDF, DOCX, HTML, Markdown, or Text files to train your AI.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row items-end gap-4">
                                    <div className="space-y-2 flex-1 w-full">
                                        <Label htmlFor="file">Document File</Label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="file"
                                                type="file"
                                                accept=".pdf,.docx,.html,.txt,.md"
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                                required
                                                className="cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={uploading || documents.filter(d => d.type !== 'url').length >= 5} className="w-full sm:w-auto min-w-[120px]">
                                        {uploading ? 'Uploading...' : documents.filter(d => d.type !== 'url').length >= 5 ? 'Limit Reached' : 'Upload'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Documents</CardTitle>
                            {documents.length > 0 && (
                                <Button variant="destructive" size="sm" onClick={() => setShowClearConfirm(true)}>
                                    Clear All
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            {doc.type === 'pdf' ? <FileText className="h-6 w-6" /> : doc.type === 'url' ? <LinkIcon className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                                            <div>
                                                <p className="font-medium">{doc.file_name || doc.source_url || 'Untitled'}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="capitalize">{doc.type}</Badge>
                                                    {doc.status === 'completed' && <Badge className="bg-green-500 hover:bg-green-600">Processed</Badge>}
                                                    {doc.status === 'processing' && <Badge className="bg-blue-500 hover:bg-blue-600">Processing</Badge>}
                                                    {doc.status === 'pending' && <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 dark:text-yellow-400">Pending</Badge>}
                                                    {doc.status === 'failed' && (
                                                        <Badge variant="destructive" title={doc.error_message}>
                                                            Failed
                                                        </Badge>
                                                    )}
                                                    {doc.status === 'failed' && doc.error_message && (
                                                        <span className="text-xs text-red-500 truncate max-w-[200px]" title={doc.error_message}>
                                                            {doc.error_message}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                                {documents.length === 0 && <p className="text-muted-foreground text-center py-4">No documents added yet.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {chatSpace.last_processed_at && (
                    <TabsContent value="chat">
                        <Card className="h-[calc(100vh-280px)] min-h-[400px] flex flex-col">
                            <CardHeader>
                                <CardTitle>Chat Preview</CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto space-y-4">
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                            <div className="prose dark:prose-invert text-sm max-w-none break-words">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {msg.content}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {chatLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter>
                                <form onSubmit={handleChat} className="flex w-full space-x-2">
                                    <Input
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Type your message..."
                                    />
                                    <Button type="submit">Send</Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                )}

                <TabsContent value="analytics">
                    <AnalyticsTab chatSpaceId={id} />
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Settings</CardTitle>
                            <CardDescription>Configure your chat widget.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="widgetStatus">Widget Status</Label>
                                <select
                                    id="widgetStatus"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={chatSpace.widget_status || 'testing'}
                                    onChange={async (e) => {
                                        const newStatus = e.target.value;
                                        // Optimistic update
                                        setChatSpace({ ...chatSpace, widget_status: newStatus } as any);

                                        try {
                                            const res = await fetch(`${API_BASE_URL}/chat-spaces/${id}`, {
                                                method: 'PATCH',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({ widget_status: newStatus }),
                                            });
                                            if (res.ok) {
                                                toast.success('Status updated');
                                            } else {
                                                const data = await res.json().catch(() => ({}));
                                                toast.error(`Failed to update status: ${data.error || res.statusText}`);
                                                fetchChatSpace(); // Revert
                                            }
                                        } catch (err: any) {
                                            toast.error(`Failed to update status: ${err.message}`);
                                            fetchChatSpace(); // Revert
                                        }
                                    }}
                                >
                                    <option value="testing">Testing (Badge Visible)</option>
                                    <option value="live">Live (Normal Operation)</option>
                                    <option value="maintenance">Maintenance (Chat Disabled)</option>
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Control the visibility and behavior of the widget on your site.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Embed Code</Label>
                                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md font-mono text-sm overflow-x-auto">
                                    {`<script src="${API_DOMAIN_URL || 'http://localhost:6002'}/widget.js" data-chat-space="${chatSpace.endpoint_slug}"></script>`}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Widget Appearance</CardTitle>
                            <CardDescription>
                                Customize how the chat widget appears on your website.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="position">Position</Label>
                                    <select
                                        id="position"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={chatSpace.widget_config?.position || 'bottom-right'}
                                        onChange={(e) => {
                                            const newConfig = { ...chatSpace.widget_config, position: e.target.value };
                                            setChatSpace({ ...chatSpace, widget_config: newConfig, ai_config: chatSpace.ai_config } as any);
                                        }}
                                    >
                                        <option value="bottom-right">Bottom Right</option>
                                        <option value="bottom-center">Bottom Center</option>
                                        <option value="bottom-left">Bottom Left</option>
                                        <option value="top-right">Top Right</option>
                                        <option value="top-center">Top Center</option>
                                        <option value="top-left">Top Left</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="width">Window Width</Label>
                                    <select
                                        id="width"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={chatSpace.widget_config?.width || 'small'}
                                        onChange={(e) => {
                                            const newConfig = { ...chatSpace.widget_config, width: e.target.value };
                                            setChatSpace({ ...chatSpace, widget_config: newConfig, ai_config: chatSpace.ai_config } as any);
                                        }}
                                    >
                                        <option value="small">Small (350px)</option>
                                        <option value="medium">Medium (450px)</option>
                                        <option value="large">Large (550px)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="launcherType">Launcher Style</Label>
                                    <select
                                        id="launcherType"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={chatSpace.widget_config?.launcherType || 'icon'}
                                        onChange={(e) => {
                                            const newConfig = { ...chatSpace.widget_config, launcherType: e.target.value };
                                            setChatSpace({ ...chatSpace, widget_config: newConfig, ai_config: chatSpace.ai_config } as any);
                                        }}
                                    >
                                        <option value="icon">Icon Only</option>
                                        <option value="text">Text & Icon</option>
                                    </select>
                                </div>

                                {chatSpace.widget_config?.launcherType === 'text' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="launcherText">Launcher Text</Label>
                                        <Input
                                            id="launcherText"
                                            placeholder="Ask me anything..."
                                            value={chatSpace.widget_config?.launcherText || ''}
                                            onChange={(e) => {
                                                const newConfig = { ...chatSpace.widget_config, launcherText: e.target.value };
                                                setChatSpace({ ...chatSpace, widget_config: newConfig, ai_config: chatSpace.ai_config } as any);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                                <Input
                                    id="welcomeMessage"
                                    placeholder="Hi! How can I help you?"
                                    value={chatSpace.widget_config?.welcomeMessage || ''}
                                    onChange={(e) => {
                                        const newConfig = { ...chatSpace.widget_config, welcomeMessage: e.target.value };
                                        setChatSpace({ ...chatSpace, widget_config: newConfig, ai_config: chatSpace.ai_config } as any);
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    The initial message displayed to users when the chat opens.
                                </p>
                            </div>

                            <Button
                                onClick={async () => {
                                    try {
                                        await api.patch(`/chat-spaces/${id}`, {
                                            widget_config: chatSpace.widget_config
                                        });
                                        toast.success('Appearance settings saved');
                                    } catch (error: any) {
                                        toast.error(`Failed to save settings: ${error.message}`);
                                    }
                                }}
                            >
                                Save Appearance
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>OpenRouter AI Configuration</CardTitle>
                            <CardDescription>
                                Customize the AI model and behavior for this chat space.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="openRouterApiKey">API Key (Optional)</Label>
                                        <Input
                                            id="openRouterApiKey"
                                            type="password"
                                            placeholder="sk-or-..."
                                            value={chatSpace.ai_config?.openRouterApiKey || ''}
                                            onChange={(e) => {
                                                const newConfig = { ...chatSpace.ai_config, openRouterApiKey: e.target.value };
                                                setChatSpace({ ...chatSpace, ai_config: newConfig } as any);
                                            }}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave blank to use the system default key. Always create key with Daily/Weekly limits.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="openRouterModelId">Model ID (Optional)</Label>
                                        <Input
                                            id="openRouterModelId"
                                            placeholder="google/gemini-2.5-flash"
                                            value={chatSpace.ai_config?.openRouterModelId || ''}
                                            onChange={(e) => {
                                                const newConfig = { ...chatSpace.ai_config, openRouterModelId: e.target.value };
                                                setChatSpace({ ...chatSpace, ai_config: newConfig } as any);
                                            }}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave blank to use the default model (google/gemini-2.5-flash).
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="responseTone">Response Tone</Label>
                                        <select
                                            id="responseTone"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                            value={chatSpace.ai_config?.responseTone || ''}
                                            onChange={(e) => {
                                                const newConfig = { ...chatSpace.ai_config, responseTone: e.target.value };
                                                setChatSpace({ ...chatSpace, ai_config: newConfig } as any);
                                            }}
                                        >
                                            <option value="">Default (Use Global Setting)</option>
                                            <option value="professional">Professional</option>
                                            <option value="friendly">Friendly</option>
                                            <option value="concise">Concise</option>
                                            <option value="detailed">Detailed</option>
                                        </select>
                                        <p className="text-xs text-muted-foreground">
                                            Select the tone for the AI's responses.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="safetyPrompt">Safety Instructions</Label>
                                        <Textarea
                                            id="safetyPrompt"
                                            placeholder="e.g. Do not mention competitors. Keep responses under 50 words."
                                            value={chatSpace.ai_config?.safetyPrompt || ''}
                                            onChange={(e) => {
                                                const newConfig = { ...chatSpace.ai_config, safetyPrompt: e.target.value };
                                                setChatSpace({ ...chatSpace, ai_config: newConfig } as any);
                                            }}
                                            className="min-h-[100px]"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Additional safety instructions to be injected into the system prompt.
                                        </p>
                                    </div>

                                    <Button
                                        onClick={async () => {
                                            try {
                                                await api.patch(`/chat-spaces/${id}`, {
                                                    ai_config: chatSpace.ai_config
                                                });
                                                toast.success('AI settings saved successfully');
                                            } catch (error: any) {
                                                toast.error(`Failed to save settings: ${error.message}`);
                                            }
                                        }}
                                    >
                                        Save AI Settings
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Security & Restrictions</CardTitle>
                            <CardDescription>
                                Control where your chat widget can be used.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="allowedDomains">Allowed Domains (Optional)</Label>
                                <Textarea
                                    id="allowedDomains"
                                    placeholder="example.com, my-website.com"
                                    value={Array.isArray(chatSpace.widget_config?.allowedDomains) ? chatSpace.widget_config.allowedDomains.join(', ') : ''}
                                    onChange={(e) => {
                                        const domains = e.target.value.split(',').map(d => d.trim());
                                        const newConfig = { ...chatSpace.widget_config, allowedDomains: domains };
                                        setChatSpace({ ...chatSpace, widget_config: newConfig } as any);
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Comma-separated list of domains allowed to use this widget (e.g., example.com). Leave blank to allow all.
                                </p>
                            </div>
                            <Button
                                onClick={async () => {
                                    try {
                                        // Ensure we filter out empty strings before saving
                                        const domains = chatSpace.widget_config?.allowedDomains?.filter((d: string) => d.length > 0) || [];
                                        const newConfig = { ...chatSpace.widget_config, allowedDomains: domains };

                                        await api.patch(`/chat-spaces/${id}`, {
                                            widget_config: newConfig
                                        });
                                        toast.success('Security settings saved successfully');

                                        // Update state with clean array
                                        setChatSpace({ ...chatSpace, widget_config: newConfig } as any);
                                    } catch (error: any) {
                                        toast.error(`Failed to save settings: ${error.message}`);
                                    }
                                }}
                            >
                                Save Security Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the document.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showProcessConfirm} onOpenChange={setShowProcessConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Start Processing?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will scrape URLs, chunk text, and generate embeddings for all pending documents. This process may take a few moments.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleProcess} className="bg-green-600 hover:bg-green-700 text-white">Start Processing</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Clear all documents?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove all documents, chunks, and reset your data usage. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearDocuments} className="bg-red-600 hover:bg-red-700 text-white">Clear All</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
