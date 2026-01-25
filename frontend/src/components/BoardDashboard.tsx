import { useState, useEffect } from 'react';
import { Plus, Trash2, MessageSquare } from 'lucide-react';

interface Post {
    id: number;
    title: string;
    content: string;
    author_name: string;
    created_at: string;
    author_id: number;
}

export function BoardDashboard() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [loading, setLoading] = useState(false);

    // Get current user info from token (decoding logic simplified for demo)
    // In a real app, you'd decode the JWT properly or use a context
    const token = localStorage.getItem('token');

    const fetchPosts = async () => {
        try {
            const res = await fetch('/api/v1/board');
            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (error) {
            console.error('Failed to fetch posts', error);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            alert('로그인이 필요합니다.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/v1/board', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title: newTitle, content: newContent })
            });

            if (res.ok) {
                setIsCreating(false);
                setNewTitle('');
                setNewContent('');
                fetchPosts();
            } else {
                alert('게시글 작성 실패');
            }
        } catch (error) {
            console.error(error);
            alert('서버 오류');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (id: number) => {
        if (!token) return;
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/v1/board/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                fetchPosts();
            } else {
                alert('삭제 실패 (본인 글만 삭제 가능합니다)');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">공지사항 및 게시판</h2>
                    <p className="text-gray-600 mt-1">사내 소식과 의견을 공유하세요</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    새 글 작성
                </button>
            </div>

            {isCreating && (
                <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">새 게시글 작성</h3>
                    <form onSubmit={handleCreatePost} className="space-y-4">
                        <div>
                            <input
                                type="text"
                                placeholder="제목"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <textarea
                                placeholder="내용을 입력하세요"
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md h-32 outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? '등록 중...' : '등록'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {posts.map((post) => (
                    <div key={post.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                                {post.title}
                            </h3>
                            <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="삭제"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-gray-600 whitespace-pre-wrap mb-4">{post.content}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>작성자: {post.author_name}</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
                {posts.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        게시글이 없습니다. 첫 번째 글을 작성해보세요!
                    </div>
                )}
            </div>
        </div>
    );
}
