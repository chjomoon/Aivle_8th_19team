import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface Post {
    id: number;
    title: string;
    content: string;
    author_name: string;
    author_id: number;
    created_at: string;
}

export const BoardDetailPage = () => {
    const { id } = useParams();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const currentUser = localStorage.getItem('username'); // Assuming username is stored in local storage
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchPost();
    }, [id]);

    const fetchPost = async () => {
        try {
            const response = await fetch(`/api/v1/board/${id}`);
            if (response.ok) {
                const data = await response.json();
                setPost(data);
            } else {
                setError('Post not found');
            }
        } catch (err) {
            setError('Failed to load post');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            const response = await fetch(`/api/v1/board/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                navigate('/board');
            } else {
                alert('Failed to delete post');
            }
        } catch (error) {
            alert('Error deleting post');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (error || !post) return <div className="p-8 text-red-500">{error}</div>;

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/board')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Post Details</h1>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl">{post.title}</CardTitle>
                            <div className="flex items-center text-sm text-gray-500 gap-4">
                                <span>By {post.author_name}</span>
                                <span>{new Date(post.created_at).toLocaleString()}</span>
                            </div>
                        </div>
                        {currentUser === post.author_name && (
                            <Button variant="destructive" size="sm" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="mt-6">
                    <div className="whitespace-pre-wrap leading-relaxed">
                        {post.content}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
