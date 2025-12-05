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
    widget_status?: 'testing' | 'live' | 'maintenance';
    last_processed_at?: string;
    data_usage_bytes?: number;
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
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:6002/api/chat-spaces/${id}?t=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setChatSpace(await res.json());
    };

    const fetchDocuments = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:6002/api/chat-spaces/${id}/documents?t=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setDocuments(await res.json());
    };

    useEffect(() => {
        fetchChatSpace();
        fetchDocuments();
    }, [id]);

    const handleUrlSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:6002/api/chat-spaces/${id}/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ type: 'url', source_url: url }),
            });
            if (res.ok) {
                setUrl('');
                fetchDocuments();
                toast.success('URL added successfully');
            } else {
                const data = await res.json();
                toast.error(`Failed to add URL: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to add URL', error);
            toast.error('Failed to add URL');
        } finally {
            setUploading(false);
        }
    };

    const handleManualTextSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:6002/api/chat-spaces/${id}/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: 'text',
                    text_content: manualText,
                    file_name: manualText.split(/\s+/).slice(0, 5).join(' ') + (manualText.split(/\s+/).length > 5 ? '...' : '')
                }),
            });
            if (res.ok) {
                setManualText('');
                fetchDocuments();
                toast.success('Text added successfully');
            } else {
                const data = await res.json();
                toast.error(`Failed to add text: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to add text', error);
            toast.error('Failed to add text');
        } finally {
            setUploading(false);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);

        const token = localStorage.getItem('token');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`http://localhost:6002/api/chat-spaces/${id}/documents/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (res.ok) {
                setFile(null);
                // Reset file input value if possible, or just rely on state
                const fileInput = document.getElementById('file') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

                fetchDocuments();
                toast.success('Document uploaded successfully');
            } else {
                const data = await res.json();
                toast.error(`Failed to upload: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = (docId: string) => {
        setDeleteId(docId);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:6002/api/documents/${deleteId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) fetchDocuments();
        setDeleteId(null);
    };

    const handleProcess = async () => {
        setShowProcessConfirm(false);
        setProcessing(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:6002/api/chat-spaces/${id}/process`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                await fetchChatSpace(); // Refresh to get updated last_processed_at
                await fetchDocuments(); // Refresh to show new recursively scraped documents
                toast.success('Processing completed successfully!');
            } else {
                toast.error('Processing failed.');
            }
        } catch (error) {
            console.error('Processing error', error);
            toast.error('Processing error.');
        } finally {
            setProcessing(false);
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
            const res = await fetch(`http://localhost:6002/api/widget/${chatSpace.endpoint_slug}/chat`, {
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
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
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

                <TabsContent value="settings">
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

                                        const token = localStorage.getItem('token');
                                        try {
                                            const res = await fetch(`http://localhost:6002/api/chat-spaces/${id}`, {
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
                                    {`<script src="http://localhost:6002/widget.js" data-chat-space="${chatSpace.endpoint_slug}"></script>`}
                                </div>
                            </div>
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
        </div>
    );
}
