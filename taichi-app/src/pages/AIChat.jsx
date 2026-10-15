import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader, AlertTriangle } from 'lucide-react';

/* --- 🎨 风格常量 --- */
const THEME = {
  bg: "bg-stone-50",
  sidebar: "bg-gray-900",
  card: "bg-white border border-gray-200 shadow-sm",
};

const BACKEND_URL = "http://127.0.0.1:8000";

const AIChat = () => {
  const [history, setHistory] = useState([
    { role: 'assistant', content: "您好，我是您的太极 AI 助手。关于拳理、招式或历史，请尽管问我。" }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [history]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    // 🚀 防止空输入或重复发送
    if (isLoading || inputMessage.trim() === "") return;
    
    setError(null);
    const userMessage = inputMessage.trim();
    const currentHistoryForAI = [...history]; // 备份发送给 AI 的历史

    // 🚀 1. 立即更新 UI：添加用户消息 + AI 思考占位符
    // 这样锁定了 AI 回答必须出现在这条用户消息之后
    setHistory(prev => [
      ...prev, 
      { role: 'user', content: userMessage },
      { role: 'assistant', content: "AI 正在思考中...", isPending: true }
    ]);
    
    setInputMessage('');
    setIsLoading(true);

    const token = localStorage.getItem('access_token'); 
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ 
          message: userMessage,
          history: currentHistoryForAI.map(h => ({ role: h.role, content: h.content }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'AI 服务请求失败。');
      }

      // 🚀 2. 精准替换：更新刚才那条占位消息的内容
      setHistory(prev => {
        const newHistory = [...prev];
        // 找到最后一条具有 isPending 标识的消息进行替换
        for (let i = newHistory.length - 1; i >= 0; i--) {
          if (newHistory[i].isPending) {
            newHistory[i] = { 
              role: 'assistant', 
              content: data.reply || "未收到回复" //
            };
            break;
          }
        }
        return newHistory;
      });

    } catch (err) {
      console.error("AI Chat 错误:", err.message);
      setError(`错误: ${err.message}`);
      // 出错时移除占位符，避免页面留下没意义的“思考中”
      setHistory(prev => prev.filter(msg => !msg.isPending));
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (msg, index) => (
    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`p-3 rounded-2xl max-w-[80%] shadow-sm ${
        msg.role === 'user' 
          ? 'bg-gray-900 text-white rounded-br-none' 
          : 'bg-gray-100 text-gray-800 rounded-tl-none'
      }`}>
        {msg.isPending ? (
          <div className="flex items-center gap-2 text-gray-500 italic">
            <Loader size={14} className="animate-spin" />
            <span>AI 正在思考...</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{msg.content}</p >
        )}
      </div>
    </div>
  );

  return (
    <div className="fade-in flex flex-col h-[80vh] max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 flex items-center gap-2">
        <MessageSquare size={24} /> AI 太极问答助手
      </h2>

      <div className={`${THEME.card} flex-1 rounded-2xl mb-4 p-6 overflow-y-auto space-y-4 bg-white/80`}>
        {history.map(renderMessage)}
        
        {error && (
            <div className="flex justify-start">
                <div className="bg-red-100 text-red-700 p-3 rounded-xl max-w-[80%] shadow-sm border border-red-300 flex items-center gap-2">
                    <AlertTriangle size={16} />
                    <span className="text-sm">{error}</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="flex gap-3">
        <input
          className="flex-1 p-4 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:border-gray-900 bg-white"
          placeholder={isLoading ? "AI 思考中，请稍候..." : "输入您的问题..."}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-gray-900 text-white px-8 rounded-xl font-bold hover:bg-black transition disabled:bg-gray-400 flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};

export default AIChat;