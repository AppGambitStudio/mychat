'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, MessageSquare, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

interface ChatSpace {
    id: string;
    name: string;
    description: string;
    status: string;
    message_count: number;
    endpoint_slug: string;
}

export default function DashboardPage() {
    const [chatSpaces, setChatSpaces] = useState<ChatSpace[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const fetchChatSpaces = async () => {
        try {
            const data = await api.get<ChatSpace[]>('/chat-spaces');
            setChatSpaces(data);
        } catch (error) {
            console.error('Failed to fetch chat spaces', error);
        }
    };

    useEffect(() => {
        fetchChatSpaces();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/chat-spaces', { name: newName, description: newDescription });
            setIsCreateOpen(false);
            setNewName('');
            setNewDescription('');
            fetchChatSpaces();
        } catch (error) {
            console.error('Failed to create chat space', error);
            toast.error('Failed to create chat space');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/chat-spaces/${deleteId}`);
            fetchChatSpaces();
            toast.success('Chat space deleted successfully');
        } catch (error) {
            console.error('Failed to delete chat space', error);
            toast.error('Failed to delete chat space');
        } finally {
            setDeleteId(null);
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'published': return 'default';
            case 'processing': return 'secondary';
            case 'draft': return 'outline';
            default: return 'secondary';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'published': return 'Published';
            case 'processing': return 'Processing';
            case 'draft': return 'New';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Manage your chat spaces and knowledge bases.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    {chatSpaces.length >= 1 ? (
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">
                                Free Plan Limit Reached
                            </Badge>
                            <Button disabled>
                                <Plus className="mr-2 h-4 w-4" /> New Chat Space
                            </Button>
                        </div>
                    ) : (
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Chat Space
                            </Button>
                        </DialogTrigger>
                    )}
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Chat Space</DialogTitle>
                            <DialogDescription>
                                Create a new chat space to start training your AI assistant.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate}>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="name"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="col-span-3"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="description" className="text-right">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Create</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {chatSpaces.map((space) => (
                    <Card key={space.id} className="flex flex-col">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-xl font-bold line-clamp-1" title={space.name}>
                                        {space.name}
                                    </CardTitle>
                                    <Badge variant={getStatusVariant(space.status)} className="capitalize">
                                        {getStatusLabel(space.status)}
                                    </Badge>
                                </div>
                                <MessageSquare className="h-5 w-5 text-muted-foreground mt-1" />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="flex items-baseline space-x-2">
                                <span className="text-3xl font-bold">{space.message_count}</span>
                                <span className="text-sm text-muted-foreground">messages processed</span>
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
                                {space.description || 'No description provided.'}
                            </p>
                        </CardContent>
                        <CardFooter className="flex items-center gap-2 pt-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
                            <Button variant="outline" size="sm" asChild className="flex-1">
                                <Link href={`/dashboard/chat-spaces/${space.id}`}>
                                    Manage
                                </Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(space.id)} className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the chat space
                            and all associated documents, vectors, and conversation history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
                            Delete Space
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
