// src/hooks/useCamera.js
import { useRef, useState, useCallback, useEffect } from 'react';

export function useCamera() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  // 重新绑定视频流到 video 元素（用于 video 元素重新挂载后）
  const rebindStream = useCallback(() => {
    if (streamRef.current && videoRef.current) {
      console.log('[Camera] 重新绑定视频流...');
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn('[Camera] 播放失败:', e));
    }
  }, []);

  // 开启摄像头
  const startCamera = useCallback(async () => {
    console.log('[Camera] 开始初始化摄像头...');
    
    setError(null);
    setIsReady(false);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能');
      }

      // 等待 videoRef 就绪
      let waitCount = 0;
      while (!videoRef.current && waitCount < 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
      
      if (!videoRef.current) {
        throw new Error('视频元素未就绪');
      }

      console.log('[Camera] 请求摄像头权限...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      console.log('[Camera] ✅ 权限已获取');
      setPermissionStatus('granted');
      
      // 保存 stream 引用
      streamRef.current = stream;
      
      // 设置视频源
      videoRef.current.srcObject = stream;
      
      // 等待加载
      await new Promise((resolve, reject) => {
        const video = videoRef.current;
        
        const onLoaded = () => {
          video.removeEventListener('loadedmetadata', onLoaded);
          resolve();
        };
        
        video.addEventListener('loadedmetadata', onLoaded);
        
        setTimeout(() => {
          video.removeEventListener('loadedmetadata', onLoaded);
          resolve(); // 超时也继续
        }, 5000);
      });
      
      await videoRef.current.play();
      
      console.log('[Camera] ✅ 摄像头启动成功');
      console.log(`[Camera] 视频尺寸: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
      
      setIsReady(true);
      return true;
      
    } catch (err) {
      console.error('[Camera] ❌ 启动失败:', err.name, err.message);
      
      let errorMessage = '摄像头启动失败';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝';
        setPermissionStatus('denied');
      } else if (err.name === 'NotFoundError') {
        errorMessage = '未找到摄像头设备';
      } else if (err.name === 'NotReadableError') {
        errorMessage = '摄像头被占用，请关闭其他使用摄像头的程序（包括后端程序）';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsReady(false);
      throw new Error(errorMessage);
    }
  }, []);

  // 关闭摄像头
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      console.log('[Camera] 关闭摄像头...');
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsReady(false);
  }, []);

  // 捕获帧
  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isReady) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.7);
  }, [isReady]);

  // 获取当前 stream
  const getStream = useCallback(() => {
    return streamRef.current;
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isReady,
    error,
    permissionStatus,
    startCamera,
    stopCamera,
    captureFrame,
    rebindStream,
    getStream
  };
}
