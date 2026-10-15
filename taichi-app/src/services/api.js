const API_BASE_URL = '/api';  // ⬅️ 使用相对路径，让 Vite 代理处理

export const api = {
  async healthCheck() {
    try {
      console.log('[API] 正在检查服务器状态...');
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[API] 服务器状态:', data);
      return data;
    } catch (e) {
      console.error('[API] 健康检查失败:', e.message);
      return null;
    }
  },

  async getLevels() {
    try {
      console.log('[API] 获取关卡列表...');
      const response = await fetch(`${API_BASE_URL}/levels`);
      if (!response.ok) throw new Error('获取关卡失败');
      const data = await response.json();
      console.log('[API] 关卡列表:', data);
      return data;
    } catch (e) {
      console.error('[API] 获取关卡失败:', e.message);
      return [];
    }
  },

  async getTemplateInfo(name) {
    try {
      const response = await fetch(`${API_BASE_URL}/template/${encodeURIComponent(name)}`);
      if (!response.ok) throw new Error('获取模板失败');
      return response.json();
    } catch (e) {
      console.error('[API] 获取模板失败:', e.message);
      return null;
    } 
  },

  getVideoUrl(name) {
    return `${API_BASE_URL}/video/${encodeURIComponent(name)}`;
  },

  async getVideos() {
    try {
      const response = await fetch(`${API_BASE_URL}/videos`);
      return response.json();
    } catch (e) {
      console.error('[API] 获取视频列表失败:', e.message);
      return [];
    }
  }
};