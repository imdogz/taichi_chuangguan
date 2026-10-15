import React, { useState, useEffect } from 'react';
import {
  LogOut, Home, Users, ChevronRight, Heart, Share2,
  BookOpen, ImageIcon, Award, Settings, MessageSquare, User,
  Lock, UserCircle, AlertCircle
} from 'lucide-react';

// 导入所有页面组件
import HomePage from './pages/HomePage';
import GameLevelPage from './pages/GameLevelPage';
import LibraryPage from './pages/LibraryPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import AIChat from './pages/AIChat';
import KnowledgeDetailPage from './pages/KnowledgeDetailPage';

const API_BASE_URL = "http://localhost:8000";

/* --- 🎨 风格常量 --- */
const THEME = {
  bg: "bg-stone-50",
  sidebar: "bg-gray-900",
  card: "bg-white border border-gray-200 shadow-sm",
};

/* --- 🔐 需要登录提示组件 --- */
const LoginRequiredView = ({ pageName, onGoLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-white flex items-center justify-center p-6">
      {/* 水墨装饰背景 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #1f2937 0%, transparent 70%)' }}
        />
        <div 
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #1f2937 0%, transparent 70%)' }}
        />
      </div>

      <div className="relative bg-white rounded-3xl shadow-xl border border-stone-200 p-10 max-w-md w-full text-center">
        {/* 锁图标 */}
        <div className="w-20 h-20 mx-auto mb-6 bg-stone-100 rounded-full flex items-center justify-center">
          <Lock size={36} className="text-stone-400" />
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-3">
          请先登录
        </h2>

        {/* 说明 */}
        <p className="text-gray-500 mb-2">
          您需要登录后才能访问
        </p>
        <p className="text-gray-800 font-medium mb-6 flex items-center justify-center gap-2">
          <span className="text-lg">「{pageName}」</span>
        </p>

        {/* 提示 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3 text-left">
            <AlertCircle size={20} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-700">
              <p className="font-medium mb-1">为什么需要登录？</p>
              <p className="text-amber-600">登录可以进行闯关，视频跟练以及AI太极问答等。</p>
            </div>
          </div>
        </div>

        {/* 按钮 */}
        <div className="space-y-3">
          <button
            onClick={onGoLogin}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
          >
            <UserCircle size={20} />
            去登录 / 注册
          </button>
          
          <p className="text-xs text-gray-400">
            登录即表示同意《用户协议》和《隐私政策》
          </p>
        </div>

        {/* 装饰线 */}
        <div className="mt-8 flex items-center justify-center gap-3 text-gray-300">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-stone-300" />
          <span className="text-xs font-serif text-gray-400">极韵智承</span>
          <div className="w-12 h-px bg-gradient-to-l from-transparent to-stone-300" />
        </div>
      </div>
    </div>
  );
};

/* --- 🛡️ 受保护页面包装组件 --- */
const ProtectedPage = ({ isLoggedIn, pageName, onGoLogin, children }) => {
  if (!isLoggedIn) {
    return <LoginRequiredView pageName={pageName} onGoLogin={onGoLogin} />;
  }
  return children;
};

/* --- 核心导航组件 --- */
const NavItem = ({ id, icon, label, activePage, setActivePage, requiresAuth, isLoggedIn }) => {
  // 显示锁图标（如果需要登录但未登录）
  const showLock = requiresAuth && !isLoggedIn;
  
  return (
    <button 
      onClick={() => setActivePage(id)} 
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 border-l-4 ${
        activePage === id 
          ? 'bg-gray-800 border-white text-white shadow-[inset_4px_0_0_0_#fff]' 
          : 'text-gray-400 border-transparent hover:bg-gray-800 hover:text-gray-200'
      }`}
    >
      {icon} 
      <span className="font-medium tracking-wide flex-1 text-left">{label}</span>
      {showLock && <Lock size={14} className="text-gray-500" />}
    </button>
  );
};

/* --- 主程序入口 --- */
export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [knowledgeItemId, setKnowledgeItemId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 🔐 检查登录状态
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setIsLoggedIn(false);
        setIsCheckingAuth(false);
        return;
      }

      try {
        // 验证 token 是否有效
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          setIsLoggedIn(true);
        } else {
          // token 无效，清除
          localStorage.removeItem('access_token');
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error('验证登录状态失败:', err);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();

    // 监听 storage 变化（其他标签页登录/登出时同步）
    const handleStorageChange = (e) => {
      if (e.key === 'access_token') {
        checkAuth();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 监听登录状态变化（当从 ProfilePage 登录成功后）
  useEffect(() => {
    const handleLoginSuccess = () => {
      const token = localStorage.getItem('access_token');
      setIsLoggedIn(!!token);
    };

    // 每次切换到其他页面时检查
    handleLoginSuccess();
  }, [activePage]);

  // 统一的页面跳转处理
  const handleNavigate = (pageId, itemId = null) => {
    if (itemId) {
      setKnowledgeItemId(itemId); 
    } else {
      setKnowledgeItemId(null);
    }
    setActivePage(pageId); 
  };

  // 跳转到登录页
  const goToLogin = () => {
    setActivePage('profile');
  };

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    setActivePage('home');
  };

  // 加载中状态
  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">正在检查登录状态...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${THEME.bg} font-sans text-gray-800 selection:bg-gray-300`}>
      
      {/* 侧边栏 (桌面端显示) */}
      <aside className={`w-64 ${THEME.sidebar} flex flex-col text-white shadow-2xl z-20 hidden md:flex`}>
        <div className="h-24 flex items-center px-8 border-b border-gray-800/50">
          <div className="w-10 h-10 bg-white rounded-lg mr-3 flex items-center justify-center text-gray-900 shadow-lg">
            <span className="font-serif font-bold text-xl">极</span>
          </div>
          <div>
            <h1 className="font-serif text-2xl tracking-widest text-stone-100">极韵智承</h1>
          </div>
        </div>

        <nav className="flex-1 py-8 space-y-1">
          <NavItem 
            id="home" 
            icon={<Home size={20} />} 
            label="首页 · 探索" 
            activePage={activePage} 
            setActivePage={setActivePage}
            requiresAuth={false}
            isLoggedIn={isLoggedIn}
          />
          <NavItem 
            id="game" 
            icon={<Award size={20} />} 
            label="修行 · 闯关" 
            activePage={activePage} 
            setActivePage={setActivePage}
            requiresAuth={true}
            isLoggedIn={isLoggedIn}
          />
          <NavItem 
            id="library" 
            icon={<BookOpen size={20} />} 
            label="拳谱 · 藏经" 
            activePage={activePage} 
            setActivePage={setActivePage}
            requiresAuth={true}
            isLoggedIn={isLoggedIn}
          />
          <NavItem 
            id="community" 
            icon={<Users size={20} />} 
            label="社区 · 雅集" 
            activePage={activePage} 
            setActivePage={setActivePage}
            requiresAuth={false}
            isLoggedIn={isLoggedIn}
          />
          <NavItem 
            id="chat" 
            icon={<MessageSquare size={20} />} 
            label="问答 · 解惑" 
            activePage={activePage} 
            setActivePage={setActivePage}
            requiresAuth={true}
            isLoggedIn={isLoggedIn}
          />
          <NavItem 
            id="profile" 
            icon={<User size={20} />} 
            label="我的 · 修行" 
            activePage={activePage} 
            setActivePage={setActivePage}
            requiresAuth={false}
            isLoggedIn={isLoggedIn}
          />
        </nav>

        {/* 侧边栏底部 - 登录状态显示 */}
        <div className="p-4 border-t border-gray-800/50">
          {isLoggedIn ? (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition px-4 py-3 w-full rounded-lg hover:bg-gray-800"
            >
              <LogOut size={18} /> <span className="text-sm">退出登录</span>
            </button>
          ) : (
            <button 
              onClick={goToLogin}
              className="flex items-center gap-3 text-gray-400 hover:text-white transition px-4 py-3 w-full rounded-lg hover:bg-gray-800"
            >
              <UserCircle size={18} /> <span className="text-sm">登录 / 注册</span>
            </button>
          )}
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        
        {/* 移动端顶部栏 */}
        <div className="md:hidden h-16 bg-gray-900 text-white flex items-center justify-between px-6 z-30 shadow-md">
          <span className="font-serif font-bold text-lg tracking-widest">极韵智承</span>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="text-gray-400 hover:text-white">
                <LogOut size={20} />
              </button>
            ) : (
              <button onClick={goToLogin} className="text-gray-400 hover:text-white">
                <UserCircle size={20} />
              </button>
            )}
            <Settings size={20} />
          </div>
        </div>

        {/* 核心展示区 */}
        <div className="flex-1 overflow-y-auto relative scroll-smooth bg-stone-50/50">
          <div className="min-h-full">
            {/* 首页 - 不需要登录 */}
            {activePage === 'home' && <HomePage onNavigate={handleNavigate} />}
            
            {/* 🔐 闯关页面 - 需要登录 */}
            {activePage === 'game' && (
              <ProtectedPage 
                isLoggedIn={isLoggedIn} 
                pageName="修行 · 闯关" 
                onGoLogin={goToLogin}
              >
                <GameLevelPage />
              </ProtectedPage>
            )}
            
            {/* 🔐 拳谱藏经 - 需要登录 */}
            {activePage === 'library' && (
              <ProtectedPage 
                isLoggedIn={isLoggedIn} 
                pageName="拳谱 · 藏经" 
                onGoLogin={goToLogin}
              >
                <LibraryPage />
              </ProtectedPage>
            )}

            {/* 社区 - 不需要登录 */}
            {activePage === 'community' && <CommunityPage />}

            {/* 🔐 AI问答 - 需要登录 */}
            {activePage === 'chat' && (
              <ProtectedPage 
                isLoggedIn={isLoggedIn} 
                pageName="问答 · 解惑" 
                onGoLogin={goToLogin}
              >
                <AIChat />
              </ProtectedPage>
            )}

            {/* 个人中心 - 不需要登录（内部有登录表单） */}
            {activePage === 'profile' && (
              <ProfilePage onLoginSuccess={() => setIsLoggedIn(true)} />
            )}
            
            {/* 知识详情页 */}
            {activePage === 'knowledgeDetail' && knowledgeItemId && (
              <KnowledgeDetailPage itemId={knowledgeItemId} onNavigate={handleNavigate} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
