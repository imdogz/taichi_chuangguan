import React, { useState, useEffect } from 'react'; 
import { User, LogOut, Award, Settings, ChevronRight, Lock, X, ShieldCheck, Edit3, Target, FileText, Heart } from 'lucide-react';
import axios from 'axios';

/* --- 🎨 风格常量 --- */
const THEME = {
  bg: "bg-stone-50",
  sidebar: "bg-gray-900",
  card: "bg-white border border-gray-200 shadow-sm",
};

const API_BASE_URL = "http://localhost:8000"; 

// 🚀 闯关次数的 localStorage Key
const PRACTICE_COUNT_KEY = "taichi_practice_count";

/* --- 🚀 修改用户名弹窗组件 --- */
const UsernameChangeModal = ({ currentUsername, onClose, onUpdateSuccess }) => {
  const [newUsername, setNewUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (newUsername === currentUsername) {
      setError("新用户名不能与当前用户名相同");
      return;
    }
    if (newUsername.length < 3) {
      setError("用户名长度至少需要 3 位");
      return;
    }

    setLoading(true);
    setError('');
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/update-username`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ new_username: newUsername })
      });

      const data = await response.json();

      if (response.ok) {
        alert("用户名修改成功！");
        onUpdateSuccess(data.new_username);
        onClose();
      } else {
        setError(data.detail || "修改失败，用户名可能已被占用");
      }
    } catch (err) {
      setError("网络连接错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2"><Edit3 size={22}/> 修改用户名</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
          
          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">当前用户名</label>
            <div className="w-full p-3 bg-gray-100 border rounded-xl text-gray-500 mt-1">{currentUsername}</div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">新用户名 (3-50位)</label>
            <input 
              type="text" required
              className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-gray-900 outline-none mt-1"
              placeholder="请输入新的用户名"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition active:scale-95 disabled:bg-gray-400"
          >
            {loading ? "更新中..." : "确认修改"}
          </button>
        </form>
      </div>
    </div>
  );
};

/* --- 🚀 修改密码弹窗组件 --- */
const PasswordChangeModal = ({ onClose }) => {
  const [formData, setFormData] = useState({ 
    old_password: '', 
    new_password: '', 
    confirm_password: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (formData.new_password.length < 6) {
      setError("新密码长度至少需要 6 位");
      return;
    }
    if (formData.new_password !== formData.confirm_password) {
      setError("两次输入的新密码不一致");
      return;
    }
    
    setLoading(true);
    setError('');
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          old_password: formData.old_password,
          new_password: formData.new_password
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("密码修改成功！请重新登录。");
        localStorage.removeItem('access_token');
        window.location.reload(); 
      } else {
        setError(data.detail || "修改失败，请检查旧密码是否正确");
      }
    } catch (err) {
      setError("网络连接错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2"><ShieldCheck size={22}/> 安全中心</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24}/></button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">{error}</div>}
          
          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">当前旧密码</label>
            <input 
              type="password" required 
              className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-gray-900 outline-none"
              onChange={(e) => setFormData({...formData, old_password: e.target.value})}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">设置新密码 (至少6位)</label>
            <input 
              type="password" required
              className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-gray-900 outline-none"
              placeholder="请输入 6 位及以上密码"
              onChange={(e) => setFormData({...formData, new_password: e.target.value})}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 ml-1">确认新密码</label>
            <input 
              type="password" required
              className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-gray-900 outline-none"
              onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition active:scale-95 disabled:bg-gray-400"
          >
            {loading ? "提交中..." : "确认修改密码"}
          </button>
        </form>
      </div>
    </div>
  );
};

/* --- 🎯 统计卡片组件 --- */
const StatCard = ({ icon, title, value, unit, subText, bgColor = "bg-stone-50", iconColor = "text-stone-600" }) => {
  return (
    <div className={`${THEME.card} rounded-xl p-6`}>
      <h3 className="font-serif font-bold mb-4 flex items-center gap-2">
        <span className={iconColor}>{icon}</span> {title}
      </h3>
      <div className="flex items-end gap-2">
        <span className={`text-4xl font-bold ${iconColor}`}>{value}</span>
        <span className="text-gray-500 text-sm mb-1">{unit}</span>
      </div>
      {subText && <p className="text-gray-400 text-xs mt-2">{subText}</p>}
    </div>
  );
};

/* --- 📝 社区统计卡片组件 --- */
const CommunityStatCard = ({ postCount, totalLikes, loading }) => {
  return (
    <div className={`${THEME.card} rounded-xl p-6`}>
      <h3 className="font-serif font-bold mb-4 flex items-center gap-2">
        <FileText size={18} className="text-blue-500" /> 社区统计
      </h3>
      
      {loading ? (
        <div className="text-gray-400 text-sm">加载中...</div>
      ) : (
        <div className="space-y-4">
          {/* 发帖数量 */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText size={18} className="text-blue-500" />
              </div>
              <span className="text-gray-700 font-medium">发布帖子</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-600">{postCount}</span>
              <span className="text-gray-500 text-sm ml-1">篇</span>
            </div>
          </div>

          {/* 获赞总数 */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Heart size={18} className="text-red-500" />
              </div>
              <span className="text-gray-700 font-medium">累计获赞</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-red-500">{totalLikes}</span>
              <span className="text-gray-500 text-sm ml-1">次</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- 页面主体 --- */
const ProfilePage = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(false); 
  const [authMode, setAuthMode] = useState('login'); 
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); 
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null); 
  const [loading, setLoading] = useState(true);
  
  // 弹窗状态
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  // 🚀 新增：统计数据状态
  const [practiceCount, setPracticeCount] = useState(0);  // 闯关次数（本地）
  const [communityStats, setCommunityStats] = useState({ post_count: 0, total_likes: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }

    // 🚀 加载本地闯关次数
    const savedCount = localStorage.getItem(PRACTICE_COUNT_KEY);
    if (savedCount) {
      setPracticeCount(parseInt(savedCount, 10));
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(response.data);
      setIsLogin(true);
      onLoginSuccess?.(); 

      // 🚀 登录成功后，获取社区统计数据
      fetchCommunityStats(token);
    } catch (err) {
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 新增：获取社区统计数据
  const fetchCommunityStats = async (token) => {
    setStatsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommunityStats(response.data);
    } catch (err) {
      console.error("获取社区统计失败:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      setError(`${authMode === 'login' ? '登录' : '注册'}失败：用户名长度不能少于 3 位`);
      return;
    }

    if (authMode === 'register') {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError('注册失败：请输入邮箱地址');
        return;
      }
      // 标准邮箱格式校验（用户名@域名.顶级后缀，如 example@domain.com）
      const standardEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!standardEmailRegex.test(trimmedEmail)) {
        setError('注册失败：邮箱格式不正确，请输入标准的邮箱地址（如 example@domain.com）');
        return;
      }
    }

    if (password.length < 6) {
      setError(`${authMode === 'login' ? '登录' : '注册'}失败：密码长度不能少于 6 位`);
      return;
    }

    try {
      if (authMode === 'login') {
        const formData = new FormData();
        formData.set('username', username.trim());
        formData.set('password', password);
        const res = await axios.post(`${API_BASE_URL}/api/users/token`, formData);
        localStorage.setItem('access_token', res.data.access_token);
        fetchUserProfile(res.data.access_token);
        onLoginSuccess?.(); 
      } else {
        await axios.post(`${API_BASE_URL}/api/users/register`, { 
          username: username.trim(), 
          password, 
          email: email.trim() 
        });
        setAuthMode('login');
        alert("注册成功，请登录");
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg).join('; '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError("认证失败，请检查输入");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    window.location.reload();
  };

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-400">加载中...</div>;

  if (!isLogin) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-serif font-bold text-center mb-6">
          {authMode === 'login' ? '欢迎回来' : '注册太极账号'}
        </h2>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{error}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="text" placeholder="用户名" required className="w-full p-3 border rounded-xl outline-none focus:ring-1 focus:ring-gray-400"
            onChange={(e) => setUsername(e.target.value)}
          />
          {authMode === 'register' && (
            <input 
              type="email" 
              placeholder="邮箱 (必填，如 example@domain.com)" 
              required 
              className="w-full p-3 border rounded-xl outline-none focus:ring-1 focus:ring-gray-400"
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              onBlur={() => {
                const trimmed = email.trim();
                if (trimmed && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
                  setError('邮箱格式不正确，请输入标准的邮箱地址（如 example@domain.com）');
                }
              }}
            />
          )}
          <input 
            type="password" 
            placeholder={authMode === 'login' ? "请输入密码 (至少6位)" : "请设置密码 (至少6位)"} 
            required 
            className="w-full p-3 border rounded-xl outline-none focus:ring-1 focus:ring-gray-400"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition">
            {authMode === 'login' ? '立即登录' : '同意协议并注册'}
          </button>
        </form>
        <button 
          onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-900 underline"
        >
          {authMode === 'login' ? "还没有账号？去注册" : "已有账号？返回登录"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* 用户信息卡片 */}
      <div className={`${THEME.card} rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6`}>
        <div className="w-24 h-24 rounded-full bg-stone-100 border-2 border-white shadow-md overflow-hidden">
          <img src="/banner.jpg" alt="Avatar" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-serif font-bold text-gray-900">{userData?.username}</h2>
          <p className="text-gray-500 mt-1">用户ID: {userData?.id} | 太极初学者</p> 
        </div>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 flex flex-col items-center text-sm gap-1">
          <LogOut size={20} /> 退出
        </button>
      </div>

      {/* 第一行：勋章 + 账号设置 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${THEME.card} rounded-xl p-6`}>
          <h3 className="font-serif font-bold mb-4 flex items-center gap-2"><Award size={18} /> 我的勋章</h3>
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 border border-stone-300 font-serif font-bold">练</div>
          </div>
        </div>

        <div className={`${THEME.card} rounded-xl p-6`}>
          <h3 className="font-serif font-bold mb-4 flex items-center gap-2"><Settings size={18} /> 账号设置</h3>
          
          {/* 修改用户名按钮 */}
          <button 
            onClick={() => setShowUsernameModal(true)}
            className="w-full flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg transition group mb-1"
          >
            <span className="text-gray-700 flex items-center gap-2 font-medium">
              <User size={16} className="text-gray-400 group-hover:text-gray-900" /> 修改用户名称
            </span>
            <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-all" />
          </button>

          {/* 修改密码按钮 */}
          <button 
            onClick={() => setShowPasswordModal(true)}
            className="w-full flex items-center justify-between p-3 hover:bg-stone-50 rounded-lg transition group"
          >
            <span className="text-gray-700 flex items-center gap-2 font-medium">
              <Lock size={16} className="text-gray-400 group-hover:text-gray-900" /> 修改登录密码
            </span>
            <ChevronRight size={16} className="text-gray-300 group-hover:translate-x-1 transition-all" />
          </button>
        </div>
      </div>

      {/* 🚀 第二行：闯关统计 + 社区统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 闯关统计卡片 */}
        <div className={`${THEME.card} rounded-xl p-6`}>
          <h3 className="font-serif font-bold mb-4 flex items-center gap-2">
            <Target size={18} className="text-green-500" /> 闯关统计
          </h3>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Target size={24} className="text-green-500" />
              </div>
              <div>
                <p className="text-gray-700 font-medium">太极闯关</p>
                <p className="text-gray-400 text-xs">累计练习次数</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-4xl font-bold text-green-600">{practiceCount}</span>
              <span className="text-gray-500 text-sm ml-1">次</span>
            </div>
          </div>
        </div>

        {/* 社区统计卡片 */}
        <CommunityStatCard 
          postCount={communityStats.post_count} 
          totalLikes={communityStats.total_likes}
          loading={statsLoading}
        />
      </div>

      {/* 弹窗逻辑控制 */}
      {showPasswordModal && <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />}
      
      {showUsernameModal && (
        <UsernameChangeModal 
          currentUsername={userData?.username} 
          onClose={() => setShowUsernameModal(false)} 
          onUpdateSuccess={(newName) => setUserData({...userData, username: newName})}
        />
      )}
    </div>
  );
};

export default ProfilePage;
