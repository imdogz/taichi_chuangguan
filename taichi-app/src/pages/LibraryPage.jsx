// src/pages/LibraryPage.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  User, ChevronRight, PlayCircle, Search, 
  X, Camera, CameraOff, RotateCcw, Maximize2, Minimize2,
  BookOpen, Clock, Star, Filter
} from 'lucide-react';

/* --- 🎬 自由练习视图组件 --- */
const FreePracticeView = ({ video, onClose }) => {
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const streamRef = useRef(null);
  const containerRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      setCameraReady(true);
    } catch (err) {
      console.error('[Camera] 启动失败:', err);
      setCameraError(err.message || '摄像头启动失败');
      setCameraReady(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    if (cameraReady && cameraVideoRef.current && streamRef.current) {
      cameraVideoRef.current.srcObject = streamRef.current;
      cameraVideoRef.current.play().catch(err => console.error('[Camera] 播放失败:', err));
    }
  }, [cameraReady]);

  const toggleCamera = useCallback(() => {
    if (cameraEnabled) {
      stopCamera();
      setCameraEnabled(false);
    } else {
      setCameraEnabled(true);
      startCamera();
    }
  }, [cameraEnabled, stopCamera, startCamera]);

  const restartCamera = useCallback(() => {
    stopCamera();
    setCameraEnabled(true);
    setTimeout(() => startCamera(), 500);
  }, [stopCamera, startCamera]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    if (cameraEnabled) startCamera();
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      stopCamera();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  const getVideoUrl = () => `/api/video/${video.videoName}`;

  return (
    <div ref={containerRef} className="h-full bg-gray-900 rounded-2xl overflow-hidden flex flex-col fade-in shadow-2xl relative">
      {/* 顶部栏 */}
      <div className="h-16 bg-gray-800 flex items-center justify-between px-6 border-b border-gray-700">
        <button onClick={handleClose} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="rotate-180" size={20} /><span>返回书架</span>
        </button>
        <div className="text-center">
          <h2 className="font-serif font-bold text-lg text-white">{video.title}</h2>
          <p className="text-xs text-gray-400">自由练习模式 · 跟随视频自由练习</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleFullscreen} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex">
        {/* 左侧视频 */}
        <div className="w-1/2 bg-black flex items-center justify-center border-r border-gray-800 relative">
          <video ref={videoRef} src={getVideoUrl()} className="w-full h-full object-contain" loop autoPlay muted playsInline />
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-white text-sm font-medium">{video.title}</p>
            <p className="text-gray-400 text-xs">讲师: {video.author}</p>
          </div>
          <div className="absolute top-4 left-4 bg-emerald-600/80 backdrop-blur-sm px-3 py-1 rounded-full">
            <span className="text-white text-xs flex items-center gap-1"><RotateCcw size={12} /> 循环播放中</span>
          </div>
        </div>

        {/* 右侧摄像头 */}
        <div className="w-1/2 bg-gray-900 flex items-center justify-center relative">
          <video ref={cameraVideoRef} className={`w-full h-full object-contain ${cameraReady && cameraEnabled ? 'block' : 'hidden'}`} autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
          {(!cameraEnabled || !cameraReady) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                {!cameraEnabled ? (
                  <>
                    <CameraOff size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-gray-400 mb-2">摄像头已关闭</p>
                    <button onClick={toggleCamera} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto">
                      <Camera size={16} /> 开启摄像头
                    </button>
                  </>
                ) : cameraError ? (
                  <>
                    <CameraOff size={64} className="mx-auto mb-4 opacity-50" />
                    <p className="text-red-400 mb-2">摄像头启动失败</p>
                    <p className="text-sm text-gray-500 mb-4">{cameraError}</p>
                    <button onClick={restartCamera} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto">
                      <RotateCcw size={16} /> 重试
                    </button>
                  </>
                ) : (
                  <>
                    <Camera size={64} className="mx-auto mb-4 opacity-50 animate-pulse" />
                    <p>正在启动摄像头...</p>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="absolute inset-0 border-4 border-dashed border-gray-700/50 m-6 rounded-2xl pointer-events-none" />
          {cameraReady && cameraEnabled && (
            <div className="absolute top-4 right-4 bg-green-600/80 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-xs flex items-center gap-1"><Camera size={12} /> 摄像头已开启</span>
            </div>
          )}
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg">
            <p className="text-gray-300 text-sm">跟随左侧视频练习</p>
            <p className="text-gray-500 text-xs">自由模式 · 无评分</p>
          </div>
        </div>
      </div>

      {/* 底部栏 */}
      <div className="h-20 bg-gray-800 flex items-center justify-center gap-4 border-t border-gray-700">
        <button onClick={toggleCamera} className={`px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 ${cameraEnabled && cameraReady ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
          {cameraEnabled && cameraReady ? <CameraOff size={18} /> : <Camera size={18} />}
          {cameraEnabled && cameraReady ? '关闭摄像头' : '开启摄像头'}
        </button>
        <button onClick={handleClose} className="bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
          结束练习
        </button>
      </div>
    </div>
  );
};

/* --- ☯️ 太极图标组件 --- */
const TaiChiIcon = ({ size = 60 }) => (
  <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
    <circle cx="50" cy="50" r="48" fill="none" stroke="#374151" strokeWidth="1.5" opacity="0.3" />
    <path d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2" fill="#1f2937"/>
    <path d="M50 2 A48 48 0 0 0 50 98 A24 24 0 0 0 50 50 A24 24 0 0 1 50 2" fill="#d1d5db"/>
    <circle cx="50" cy="26" r="6" fill="#d1d5db" />
    <circle cx="50" cy="74" r="6" fill="#1f2937" />
  </svg>
);

/* --- 🎴 视频卡片组件 --- */
const VideoCard = ({ video, onClick }) => {
  const categoryStyles = {
    '入门': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    '进阶': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    '器械': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  };
  const style = categoryStyles[video.category] || categoryStyles['入门'];

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-stone-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-200/50 transition-all duration-300"
    >
      {/* 封面 */}
      <div className="aspect-video bg-gradient-to-br from-stone-100 to-stone-200 relative overflow-hidden">
        <img 
          src={video.img} 
          onError={(e) => e.target.style.opacity = '0'} 
          alt={video.title} 
          className="w-full h-full object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700" 
        />
        
        {/* 水墨覆盖层 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        
        {/* 播放按钮 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-16 h-16 bg-white/95 rounded-full flex items-center justify-center shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <PlayCircle size={32} className="text-gray-800 ml-1" fill="currentColor" />
          </div>
        </div>
        
        {/* 时长 */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-full">
          <Clock size={12} className="text-white/80" />
          <span className="text-white text-xs font-mono">{video.duration}</span>
        </div>
        
        {/* 分类标签 */}
        <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${style.bg} ${style.border} border`}>
          <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
          <span className={`text-xs font-medium ${style.text}`}>{video.category}</span>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-5">
        {/* 标题 */}
        <h3 className="font-serif font-bold text-xl text-gray-800 mb-2 group-hover:text-gray-600 transition-colors leading-tight">
          {video.title}
        </h3>
        
        {/* 作者和评分 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500">
            <div className="w-6 h-6 bg-stone-100 rounded-full flex items-center justify-center">
              <User size={14} className="text-gray-400" />
            </div>
            <span className="text-sm">{video.author}</span>
          </div>
          
          {/* 评分 */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={12} 
                className={i < (video.rating || 4) ? 'text-amber-400 fill-amber-400' : 'text-stone-200'} 
              />
            ))}
          </div>
        </div>

        {/* 开始练习按钮 */}
        <div className="mt-4 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-center gap-2 py-2 text-gray-500 group-hover:text-gray-800 transition-colors">
            <BookOpen size={16} />
            <span className="text-sm font-medium">开始练习</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* --- 📚 拳谱 · 藏经 主页面 --- */
const LibraryPage = () => {
  const videos = [
    { id: 101, title: "陈氏太极 · 老架一路", videoName: "chenshi_laojia_yilu", author: "陈宗师", duration: "12:30", category: "进阶", img: "/card1.jpg", rating: 5 },
    { id: 102, title: "简化二十四式（大学生版）", videoName: "taiji_24shi", author: "李教练", duration: "06:15", category: "入门", img: "/card2.jpg", rating: 2 },
    { id: 103, title: "太极剑 · 三十二式", videoName: "taijijian_32shi", author: "王老师", duration: "08:45", category: "器械", img: "/card3.jpg", rating: 3 },
    { id: 104, title: "八法五步 · 分解教学", videoName: "bafa_wubu", author: "赵教练", duration: "15:20", category: "入门", img: "/card2.jpg", rating: 2 },
    { id: 105, title: "杨氏太极 · 揽雀尾", videoName: "yangshi_lanquewei", author: "杨宗师", duration: "05:10", category: "进阶", img: "/card1.jpg", rating: 4 },
    { id: 106, title: "太极扇 · 功夫扇", videoName: "taijishan_gongfu", author: "孙老师", duration: "04:30", category: "器械", img: "/card3.jpg", rating: 3 },
  ];

  const [activeTab, setActiveTab] = useState("全部");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVideos = videos.filter(v => {
    const matchCategory = activeTab === "全部" || v.category === activeTab;
    const matchSearch = searchQuery === "" || v.title.includes(searchQuery) || v.author.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  if (selectedVideo) {
    return <FreePracticeView video={selectedVideo} onClose={() => setSelectedVideo(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-white relative overflow-hidden">
      
      {/* ========== 水墨装饰背景 ========== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* 左上角水墨 */}
        <div 
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #1f2937 0%, transparent 70%)' }}
        />
        {/* 右上角水墨 */}
        <div 
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #374151 0%, transparent 70%)' }}
        />
        {/* 左下角水墨 */}
        <div 
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #1f2937 0%, transparent 70%)' }}
        />
        {/* 右下角水墨 */}
        <div 
          className="absolute -bottom-20 -right-32 w-80 h-80 rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #6b7280 0%, transparent 70%)' }}
        />
        
        {/* 竹子装饰 - 左 */}
        <svg className="absolute left-4 top-1/4 opacity-[0.06]" width="24" height="400" viewBox="0 0 24 400">
          <line x1="12" y1="0" x2="12" y2="400" stroke="#374151" strokeWidth="2" />
          <line x1="12" y1="50" x2="4" y2="35" stroke="#374151" strokeWidth="1.5" />
          <line x1="12" y1="100" x2="20" y2="85" stroke="#374151" strokeWidth="1.5" />
          <line x1="12" y1="150" x2="4" y2="135" stroke="#374151" strokeWidth="1.5" />
          <line x1="12" y1="200" x2="20" y2="185" stroke="#374151" strokeWidth="1.5" />
          <line x1="12" y1="250" x2="4" y2="235" stroke="#374151" strokeWidth="1.5" />
          <line x1="12" y1="300" x2="20" y2="285" stroke="#374151" strokeWidth="1.5" />
          <line x1="12" y1="350" x2="4" y2="335" stroke="#374151" strokeWidth="1.5" />
        </svg>
        
        {/* 竹子装饰 - 右 */}
        <svg className="absolute right-6 top-1/3 opacity-[0.05]" width="24" height="350" viewBox="0 0 24 350">
          <line x1="12" y1="0" x2="12" y2="350" stroke="#374151" strokeWidth="1.5" />
          <line x1="12" y1="40" x2="20" y2="28" stroke="#374151" strokeWidth="1" />
          <line x1="12" y1="90" x2="4" y2="78" stroke="#374151" strokeWidth="1" />
          <line x1="12" y1="140" x2="20" y2="128" stroke="#374151" strokeWidth="1" />
          <line x1="12" y1="190" x2="4" y2="178" stroke="#374151" strokeWidth="1" />
          <line x1="12" y1="240" x2="20" y2="228" stroke="#374151" strokeWidth="1" />
          <line x1="12" y1="290" x2="4" y2="278" stroke="#374151" strokeWidth="1" />
        </svg>
      </div>

      {/* ========== 头部区域 ========== */}
      <div className="relative border-b border-stone-200/60">
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-transparent" />
        
        <div className="max-w-6xl mx-auto px-6 py-10 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            {/* 左侧：标题 */}
            <div className="flex items-center gap-5">
              <TaiChiIcon size={64} />
              <div>
                <h1 className="text-4xl font-serif font-bold text-gray-800 tracking-widest mb-1">
                  拳谱 · 藏经
                </h1>
                <p className="text-gray-500 text-sm tracking-wide">
                  博采众长 · 自由修习 · 不拘一格
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-gray-400 to-transparent" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <div className="w-6 h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                </div>
              </div>
            </div>

            {/* 右侧：搜索框 */}
            <div className="relative w-full md:w-auto">
              <input 
                type="text" 
                placeholder="搜索拳法 / 讲师..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-72 pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition-all shadow-sm" 
              />
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ========== 分类标签 ========== */}
      <div className="max-w-6xl mx-auto px-6 py-6 relative">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-gray-400 mr-2">
            <Filter size={16} />
            <span className="text-sm">筛选</span>
          </div>
          
          {["全部", "入门", "进阶", "器械"].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === tab 
                  ? 'bg-gray-800 text-white shadow-lg shadow-gray-300/50' 
                  : 'bg-white text-gray-600 hover:bg-stone-100 border border-stone-200 hover:border-stone-300'
              }`}
            >
              {tab}
            </button>
          ))}
          
          {/* 视频数量统计 */}
          <div className="ml-auto text-sm text-gray-400">
            共 <span className="font-bold text-gray-600">{filteredVideos.length}</span> 部拳谱
          </div>
        </div>
      </div>

      {/* ========== 视频卡片网格 ========== */}
      <div className="max-w-6xl mx-auto px-6 pb-16 relative">
        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard 
                key={video.id} 
                video={video} 
                onClick={() => setSelectedVideo(video)} 
              />
            ))}
          </div>
        ) : (
          /* 空状态 */
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-stone-100 rounded-full flex items-center justify-center">
              <BookOpen size={36} className="text-stone-400" />
            </div>
            <p className="text-gray-500 text-lg font-serif">未找到匹配的拳谱</p>
            <p className="text-gray-400 text-sm mt-2">试试其他关键词或分类</p>
            <button 
              onClick={() => { setSearchQuery(""); setActiveTab("全部"); }}
              className="mt-6 px-6 py-2 bg-gray-800 text-white rounded-full text-sm hover:bg-gray-700 transition-colors"
            >
              重置筛选
            </button>
          </div>
        )}

        {/* ========== 底部装饰 ========== */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-4 text-gray-400">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-stone-300" />
            <span className="text-xs font-serif">习武之道 贵在持之以恒</span>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-stone-300" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryPage;
