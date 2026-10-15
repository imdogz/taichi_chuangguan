import React from 'react';
import { ChevronRight } from 'lucide-react'; // 只保留了 ChevronRight 图标

/* --- 🎨 风格常量 --- */
const THEME = {
  bg: "bg-stone-50",
  sidebar: "bg-gray-900",
  card: "bg-white border border-gray-200 shadow-sm",
};

/* --- 1. 首页 (保持不变) --- */
const HomePage = ({ onNavigate }) => (
  // 移除围绕在首页主体外的 div 包装，如果它只是为了放置 UserStatus
  <div className={`${THEME.bg} min-h-screen`}> 
    
    {/* ⚠️ 移除：顶部 UserStatus 相关的 flex justify-end 区域 */}
    
    <div className="space-y-12 fade-in pb-10 max-w-6xl mx-auto"> 
      <div className="relative w-full rounded-3xl overflow-hidden bg-gray-900 group shadow-2xl aspect-[1024/574]">
        <img src="/banner.jpg" onError={(e) => e.target.style.display = 'none'} alt="Banner" className="w-full h-full object-cover grayscale opacity-90 group-hover:scale-105 transition-transform duration-1000" />
        <div className="absolute inset-0 flex items-center justify-center -z-10 text-gray-700 font-bold">
          请在 public 放入 banner.jpg
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent flex flex-col justify-center px-8 md:px-16">
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 tracking-widest drop-shadow-xl border-l-8 border-white pl-6">
            虚实 · 极韵
          </h1>
          <p className="text-gray-100 text-lg md:text-xl max-w-lg leading-relaxed font-light tracking-wide pl-6 drop-shadow-md hidden md:block">
            "太极者，无极而生。<br />动静之机，阴阳之母也。"
          </p>
          <button
            onClick={() => onNavigate('knowledgeDetail', "宗师源流")}
            className="ml-6 mt-8 px-10 py-3 bg-white text-gray-900 rounded-none text-base font-bold hover:bg-gray-200 transition w-fit flex items-center gap-3 tracking-widest shadow-lg">
            入 门 <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-gray-800 mb-8 flex items-center gap-4"><span className="w-2 h-8 bg-gray-900 block"></span> 拳理 · 传承</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[{ title: "宗师源流", desc: "探寻张三丰与陈家沟的历史足迹。", img: "/card1.jpg" }, { title: "二十四式", desc: "大道至简，国家推广的简化套路。", img: "/card2.jpg" }, { title: "哲学心法", desc: "以柔克刚，四两拨千斤的智慧。", img: "/card3.jpg" }].map((item, idx) => (
            <div
              key={idx}
              //卡片添加点击事件，跳转到 'knowledgeDetail' 并传递 title
              onClick={() => onNavigate('knowledgeDetail', item.title)}
              className={`${THEME.card} rounded-none border-0 shadow-lg overflow-hidden group cursor-pointer flex flex-col hover:-translate-y-2 transition-transform duration-300`}>
              <div className="w-full aspect-[3/2] overflow-hidden relative bg-gray-200">
                <img src={item.img} onError={(e) => e.target.style.opacity = '0'} alt={item.title} className="w-full h-full object-cover grayscale contrast-110 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs -z-10">缺图: {item.img}</div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
              </div>
              <div className="p-6 bg-white flex-1 relative border-t-4 border-gray-900">
                <h3 className="text-xl font-bold mb-3 font-serif text-gray-900 group-hover:text-gray-600 transition-colors">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed text-justify">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default HomePage;