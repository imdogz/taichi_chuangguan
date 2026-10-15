// src/services/gameSocket.js

const gameSocket = {
  ws: null,
  isConnected: false,
  eventHandlers: {},

  connect() {
    return new Promise((resolve, reject) => {
      try {
        // ⬅️ 使用相对路径，Vite 代理会处理
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/game`;
        
        console.log('[WS] 连接到:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          reject(new Error('连接超时'));
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('[WS] ✅ 已连接');
          this.isConnected = true;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WS] 收到消息:', data.type);
            this.emit(data.type, data);
          } catch (e) {
            console.error('[WS] 解析错误:', e);
          }
        };

        this.ws.onclose = () => {
          console.log('[WS] 连接关闭');
          this.isConnected = false;
          this.emit('disconnected');
        };

        this.ws.onerror = (err) => {
          console.error('[WS] 错误:', err);
          clearTimeout(timeout);
          reject(new Error('WebSocket 连接失败'));
        };
      } catch (err) {
        reject(err);
      }
    });
  },

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  },

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WS] 无法发送，连接未就绪');
    }
  },

  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  },

  off(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  },

  emit(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
  },

  initGame(templateName) {
    console.log('[WS] 发送 init:', templateName);
    this.send({ action: 'init', templateName });
  },

  startGame() {
    console.log('[WS] 发送 start');
    this.send({ action: 'start' });
  },

  sendFrame(frameData, videoTime) {
    this.send({ action: 'frame', frame: frameData, videoTime });
  },

  finishGame() {
    console.log('[WS] 发送 finish');
    this.send({ action: 'finish' });
  },

  resetGame() {
    console.log('[WS] 发送 reset');
    this.send({ action: 'reset' });
  }
};

export { gameSocket };
