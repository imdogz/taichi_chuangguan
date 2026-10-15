import React, { useState, useEffect } from 'react'; 
import { Heart, MessageSquare, Send, Trash2 } from 'lucide-react'; // 🚀 导入 Trash2

const API_BASE_URL = 'http://localhost:8000'; 

/* --- 辅助组件：评论输入框 (保持不变) --- */
const CommentInput = ({ postId, onSuccess, onError }) => {
    const [commentContent, setCommentContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        const content = commentContent.trim();
        if (!content) return;
        setLoading(true);
        onError('');

        const token = localStorage.getItem('access_token');
        if (!token) {
            onError("请先登录，才能发表评论。");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/community/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ content })
            });
            if (response.ok) {
                setCommentContent('');
                onSuccess();
            } else {
                const err = await response.json();
                onError(err.detail || "评论失败");
            }
        } catch (err) {
            onError("网络错误");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmitComment} className="flex gap-2 mt-3">
            <input
                type="text"
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="发表评论..."
                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            <button type="submit" disabled={loading} className="p-2 bg-gray-900 text-white rounded-lg hover:bg-black transition disabled:bg-gray-400">
                <Send size={16} />
            </button>
        </form>
    );
};

/* --- 主页面 --- */
const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [postError, setPostError] = useState('');
  const [openCommentsId, setOpenCommentsId] = useState(null); 
  const [comments, setComments] = useState({}); 

  // 🚀 新增：存储当前登录用户的 ID，用于判断删除权限
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchPosts();
    fetchMe(); // 🚀 获取当前用户信息
  }, []);

  // 🚀 结合点：获取当前登录用户信息
  const fetchMe = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCurrentUserId(data.id);
            }
        } catch (e) { console.error("获取个人信息失败"); }
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token'); // 🚀 传 Token 才能知道 is_liked_by_me
    try {
      const response = await fetch(`${API_BASE_URL}/api/community/posts`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      setPostError("加载失败");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 结合点：调用后端新增的 DELETE /posts/{id} 接口
  const handleDeletePost = async (postId) => {
    if (!window.confirm("确定删除这条动态吗？")) return;
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE_URL}/api/community/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setPosts(posts.filter(p => p.id !== postId));
        } else {
            alert("删除失败，请稍后重试");
        }
    } catch (e) { alert("网络错误"); }
  };

  // 🚀 结合点：调用后端新增的 DELETE /comments/{id} 接口
  const handleDeleteComment = async (commentId, postId) => {
    if (!window.confirm("确定删除这条评论吗？")) return;
    const token = localStorage.getItem('access_token');
    try {
        const res = await fetch(`${API_BASE_URL}/api/community/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            setComments(prev => ({
                ...prev,
                [postId]: prev[postId].filter(c => c.id !== commentId)
            }));
            fetchPosts(); // 刷新以更新主帖的评论数
        }
    } catch (e) { alert("网络错误"); }
  };

  const handleLike = async (postId) => {
    const token = localStorage.getItem('access_token');
    if (!token) { alert("请先登录"); return; }
    try {
        const res = await fetch(`${API_BASE_URL}/api/community/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) fetchPosts();
    } catch (e) {}
  };

  const fetchComments = async (postId) => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/community/posts/${postId}/comments`);
        if (res.ok) {
            const data = await res.json();
            setComments(prev => ({ ...prev, [postId]: data }));
        }
    } catch (e) {}
  };

  const toggleComments = (postId) => {
    if (openCommentsId === postId) setOpenCommentsId(null);
    else { setOpenCommentsId(postId); fetchComments(postId); }
  };

  // (中间的 handleCreatePost 发帖代码逻辑保持不变...)
  const handleCreatePost = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) { setPostError("请先登录"); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/api/community/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newPost),
      });
      if (response.ok) {
        setIsPosting(false);
        setNewPost({ title: '', content: '' });
        fetchPosts();
      }
    } catch (e) { setPostError("发布失败"); }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 标题和发帖按钮 */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">拳友雅集</h2>
        <button onClick={() => setIsPosting(true)} className="bg-gray-900 text-white px-6 py-2 rounded-lg">发布动态</button>
      </div>

      {/* 发帖表单 (已简化，同你之前的逻辑) */}
      {isPosting && (
        <form onSubmit={handleCreatePost} className="bg-white p-6 rounded-xl border mb-6">
            <input 
                type="text" placeholder="标题" value={newPost.title} 
                onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                className="w-full p-2 border rounded mb-3" required
            />
            <textarea 
                placeholder="内容" value={newPost.content} 
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                className="w-full p-2 border rounded mb-3" rows="4" required
            ></textarea>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsPosting(false)} className="px-4 py-2 border rounded">取消</button>
                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded">确认发布</button>
            </div>
        </form>
      )}

      {/* 帖子列表 */}
      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold">
                    {post.author_username?.[0].toUpperCase()}
                </div>
                <div>
                    <h4 className="font-bold">{post.author_username}</h4>
                    <p className="text-xs text-gray-400">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* 🚀 结合点：显示删除帖子的垃圾桶 (后端提供的 author_id) */}
              {currentUserId === post.author_id && (
                <button onClick={() => handleDeletePost(post.id)} className="text-gray-400 hover:text-red-500 transition">
                    <Trash2 size={18} />
                </button>
              )}
            </div>

            <h5 className="font-bold text-lg mb-2">{post.title}</h5>
            <p className="text-gray-700 mb-4">{post.content}</p>
            
            <div className="flex gap-6 border-t pt-4 text-gray-500 text-sm">
              <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 ${post.is_liked_by_me ? 'text-red-500' : ''}`}>
                <Heart size={16} fill={post.is_liked_by_me ? 'red' : 'none'} /> {post.likes_count}
              </button>
              <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2">
                <MessageSquare size={16} /> {post.comments_count}
              </button>
            </div>

            {/* 评论区 */}
            {openCommentsId === post.id && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                        {comments[post.id]?.map(comment => (
                            <div key={comment.id} className="flex justify-between items-start border-b border-gray-100 pb-2">
                                <div>
                                    <p className="font-bold text-xs">{comment.author_username}</p>
                                    <p className="text-sm">{comment.content}</p>
                                </div>
                                {/* 🚀 结合点：显示删除评论的按钮 (后端提供的 author_id) */}
                                {currentUserId === comment.author_id && (
                                    <button onClick={() => handleDeleteComment(comment.id, post.id)} className="text-gray-300 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <CommentInput postId={post.id} onSuccess={() => { fetchComments(post.id); fetchPosts(); }} onError={setPostError} />
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;