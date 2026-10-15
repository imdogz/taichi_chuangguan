// src/pages/GameLevelPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Lock, CheckCircle, Star, PlayCircle, X,
  Loader2, Wifi, WifiOff, RefreshCw, ChevronRight,
  AlertCircle, Mountain
} from 'lucide-react';

// 导入服务
import { api } from '../services/api';
import { gameSocket } from '../services/gameSocket';

// ========== 结果弹窗组件 ==========
const ResultModal = ({ result, onRetry, onClose, onNext }) => {
  const gradeColors = {
    'S': 'text-yellow-500',
    'A': 'text-green-500',
    'B': 'text-blue-500',
    'C': 'text-orange-500',
    'D': 'text-red-500'
  };

  const gradeEmojis = {
    'S': '🏆',
    'A': '🥇',
    'B': '🥈',
    'C': '🥉',
    'D': '💪'
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 fade-in">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl border border-stone-200">
        <div className="mb-6">
          <span className="text-5xl">{gradeEmojis[result.grade] || '🎯'}</span>
          <h2 className={`text-6xl font-bold mt-2 ${gradeColors[result.grade] || 'text-gray-800'}`}>
            {result.grade}
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-400 text-sm">最终得分</p>
          <p className="text-4xl font-bold text-gray-800">{result.finalScore?.toFixed(1) || 0}</p>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6 bg-stone-50 rounded-xl p-4">
          <div>
            <p className="text-yellow-500 font-bold">{result.stats?.perfect || 0}</p>
            <p className="text-gray-400 text-xs">Perfect</p>
          </div>
          <div>
            <p className="text-green-500 font-bold">{result.stats?.great || 0}</p>
            <p className="text-gray-400 text-xs">Great</p>
          </div>
          <div>
            <p className="text-cyan-500 font-bold">{result.stats?.good || 0}</p>
            <p className="text-gray-400 text-xs">Good</p>
          </div>
          <div>
            <p className="text-red-500 font-bold">{result.stats?.miss || 0}</p>
            <p className="text-gray-400 text-xs">Miss</p>
          </div>
        </div>

        <div className={`mb-6 py-2 px-4 rounded-full inline-block ${result.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {result.passed ? '✓ 山门已破！' : '✗ 未能通过，再接再厉'}
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} /> 再闯一次
          </button>
          {result.passed ? (
            <button
              onClick={onNext}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              下一山门 <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              返回
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== 游戏进行视图组件 ==========
const GamePlayView = ({ level, onClose, onComplete }) => {
  const [gamePhase, setGamePhase] = useState('init');
  const [countdown, setCountdown] = useState(3);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [initStep, setInitStep] = useState('');
  const [cameraReady, setCameraReady] = useState(false);

  const [gameData, setGameData] = useState({
    currentScore: 0,
    combo: 0,
    maxCombo: 0,
    stats: { perfect: 0, great: 0, good: 0, miss: 0 },
    progress: { current: 0, total: 10 },
    hasLandmarks: false,
    landmarks: null,
    currentKeyframe: null,
    nextKeyframe: null
  });

  const [judgeDisplay, setJudgeDisplay] = useState(null);
  const [showJudge, setShowJudge] = useState(false);
  const [finalResult, setFinalResult] = useState(null);

  const videoRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const skeletonCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const judgeTimeoutRef = useRef(null);
  const initStartedRef = useRef(false);

  const SKELETON_CONNECTIONS = [
    [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 12], [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [24, 26], [26, 28],
  ];

  const drawSkeleton = useCallback((landmarks) => {
    const canvas = skeletonCanvasRef.current;
    const video = cameraVideoRef.current;
    if (!canvas || !video || !landmarks || !Array.isArray(landmarks)) return;

    const ctx = canvas.getContext('2d');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;

    for (const [start, end] of SKELETON_CONNECTIONS) {
      if (landmarks[start] && landmarks[end]) {
        const [x1, y1, v1] = landmarks[start];
        const [x2, y2, v2] = landmarks[end];
        if (v1 > 0.5 && v2 > 0.5) {
          ctx.beginPath();
          ctx.moveTo(x1 * width, y1 * height);
          ctx.lineTo(x2 * width, y2 * height);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = '#10b981';
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (lm && lm[2] > 0.5) {
        ctx.beginPath();
        ctx.arc(lm[0] * width, lm[1] * height, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    ctx.restore();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      setCameraReady(true);
      return true;
    } catch (err) {
      throw new Error('摄像头启动失败');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const captureFrame = () => {
    const video = cameraVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.7);
  };

  useEffect(() => {
    if (cameraVideoRef.current && streamRef.current) {
      cameraVideoRef.current.srcObject = streamRef.current;
      cameraVideoRef.current.play().catch(() => {});
    }
  }, [gamePhase]);

  useEffect(() => {
    if (gameData.landmarks && gamePhase === 'playing') {
      drawSkeleton(gameData.landmarks);
    }
  }, [gameData.landmarks, gamePhase, drawSkeleton]);

  useEffect(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;

    let isMounted = true;

    const runInit = async () => {
      setGamePhase('init');
      setInitStep('正在启动摄像头...');

      try {
        await startCamera();
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setGamePhase('error');
        }
        return;
      }

      if (!isMounted) return;
      setInitStep('正在连接服务器...');

      try {
        await gameSocket.connect();
        setIsConnected(true);
      } catch (err) {
        if (isMounted) {
          setError(`服务器连接失败: ${err.message}`);
          setGamePhase('error');
        }
        return;
      }

      if (!isMounted) return;
      setInitStep('正在初始化游戏...');
      const templateName = level.name || 'qishi';
      await gameSocket.initGame(templateName);
    };

    runInit();

    return () => {
      isMounted = false;
      initStartedRef.current = false;
      stopCamera();
      gameSocket.disconnect();
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
      if (judgeTimeoutRef.current) clearTimeout(judgeTimeoutRef.current);
    };
  }, [level]);

  useEffect(() => {
    const handleInitSuccess = (data) => {
      setGameData(prev => ({
        ...prev,
        progress: { current: 0, total: data.data?.keyframeCount || 10 }
      }));
      setInitStep('');
      setGamePhase('ready');
    };

    const handleFrameResult = (data) => {
      const result = data.data;

      if (result.landmarks) {
        setGameData(prev => ({ ...prev, landmarks: result.landmarks, hasLandmarks: true }));
      } else {
        setGameData(prev => ({ ...prev, hasLandmarks: result.hasLandmarks || false }));
      }

      if (result.gameState) {
        const gs = result.gameState;
        setGameData(prev => ({
          ...prev,
          currentScore: gs.currentScore ?? prev.currentScore,
          combo: gs.combo ?? prev.combo,
          maxCombo: gs.maxCombo ?? prev.maxCombo,
          stats: gs.stats ?? prev.stats,
          progress: gs.progress ?? prev.progress
        }));
      }

      if (result.currentKeyframe) {
        setGameData(prev => ({ ...prev, currentKeyframe: result.currentKeyframe }));
      }
      if (result.nextKeyframe) {
        setGameData(prev => ({ ...prev, nextKeyframe: result.nextKeyframe }));
      }

      if (result.judgeResult) {
        setJudgeDisplay(result.judgeResult);
        setShowJudge(true);
        if (judgeTimeoutRef.current) clearTimeout(judgeTimeoutRef.current);
        judgeTimeoutRef.current = setTimeout(() => setShowJudge(false), 1000);
      }
    };

    const handleGameFinished = (data) => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
        frameIntervalRef.current = null;
      }
      if (videoRef.current) videoRef.current.pause();
      setFinalResult(data.data);
      setGamePhase('finished');
    };

    const handleDisconnected = () => setIsConnected(false);

    gameSocket.on('init_success', handleInitSuccess);
    gameSocket.on('frame_result', handleFrameResult);
    gameSocket.on('game_finished', handleGameFinished);
    gameSocket.on('disconnected', handleDisconnected);

    return () => {
      gameSocket.off('init_success', handleInitSuccess);
      gameSocket.off('frame_result', handleFrameResult);
      gameSocket.off('game_finished', handleGameFinished);
      gameSocket.off('disconnected', handleDisconnected);
    };
  }, []);

  const startCountdown = useCallback(() => {
    if (gamePhase !== 'ready') return;
    setGamePhase('countdown');
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          startPlaying();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [gamePhase]);

  const startPlaying = useCallback(async () => {
    setGamePhase('playing');
    await gameSocket.startGame();

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    frameIntervalRef.current = setInterval(() => {
      if (!gameSocket.isConnected) return;
      const frame = captureFrame();
      const videoTime = videoRef.current?.currentTime || 0;
      if (frame) gameSocket.sendFrame(frame, videoTime);
    }, 100);
  }, []);

  const handleVideoEnded = useCallback(() => handleFinishPractice(), []);

  const handleFinishPractice = useCallback(async () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    if (videoRef.current) videoRef.current.pause();

    try {
      await gameSocket.finishGame();
    } catch (e) {
      const fallbackResult = {
        finalScore: gameData.currentScore,
        grade: gameData.currentScore >= 90 ? 'S' : gameData.currentScore >= 80 ? 'A' : gameData.currentScore >= 70 ? 'B' : gameData.currentScore >= 60 ? 'C' : 'D',
        passed: gameData.currentScore >= 60,
        maxCombo: gameData.maxCombo,
        stats: gameData.stats
      };
      setFinalResult(fallbackResult);
      setGamePhase('finished');
    }
  }, [gameData]);

  const handleRetry = useCallback(async () => {
    setFinalResult(null);
    setShowJudge(false);
    setJudgeDisplay(null);
    setGameData({
      currentScore: 0, combo: 0, maxCombo: 0,
      stats: { perfect: 0, great: 0, good: 0, miss: 0 },
      progress: { current: 0, total: gameData.progress.total },
      hasLandmarks: false, landmarks: null,
      currentKeyframe: null, nextKeyframe: null
    });
    if (videoRef.current) videoRef.current.currentTime = 0;
    try { await gameSocket.resetGame(); } catch (e) {}
    setGamePhase('ready');
  }, [gameData.progress.total]);

  const handleClose = useCallback(() => {
    stopCamera();
    gameSocket.disconnect();
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (judgeTimeoutRef.current) clearTimeout(judgeTimeoutRef.current);
    onClose();
  }, [onClose]);

  const gradeStyles = {
    'perfect': { text: 'PERFECT', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    'great': { text: 'GREAT', color: 'text-green-500', bg: 'bg-green-100' },
    'good': { text: 'GOOD', color: 'text-cyan-500', bg: 'bg-cyan-100' },
    'miss': { text: 'MISS', color: 'text-red-500', bg: 'bg-red-100' }
  };

  const getVideoUrl = () => `/api/video/${level.name || 'qishi'}`;

  if (gamePhase === 'error') {
    return (
      <div className="fixed inset-0 bg-stone-100 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-lg">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">初始化失败</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button onClick={handleClose} className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-gray-700 rounded-xl">
            返回
          </button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'init') {
    return (
      <div className="fixed inset-0 bg-stone-100 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 size={48} className="text-gray-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{initStep || '初始化中...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-stone-100 flex flex-col z-50">
      {/* 顶部栏 */}
      <div className="h-16 bg-white flex items-center justify-between px-6 border-b border-stone-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={handleClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <X size={24} className="text-gray-500" />
          </button>
          <h1 className="text-gray-800 text-lg font-bold font-serif">{level.title}</h1>
          {gameData.currentKeyframe && (
            <span className="text-emerald-600 text-sm bg-emerald-50 px-3 py-1 rounded-full">
              🎯 {gameData.currentKeyframe.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          {gameData.nextKeyframe && gamePhase === 'playing' && (
            <div className="text-gray-500 text-sm">
              下一个: <span className="text-gray-700">{gameData.nextKeyframe.name}</span>
              <span className="text-amber-600 ml-2">({gameData.nextKeyframe.remaining?.toFixed(1)}s)</span>
            </div>
          )}

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isConnected ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {isConnected ? <Wifi size={16} className="text-emerald-500" /> : <WifiOff size={16} className="text-red-500" />}
            <span className={`text-sm ${isConnected ? 'text-emerald-600' : 'text-red-600'}`}>
              {isConnected ? '已连接' : '未连接'}
            </span>
          </div>

          <div className="bg-stone-100 px-4 py-2 rounded-xl">
            <span className="text-gray-500 text-sm">得分</span>
            <span className="text-gray-800 text-xl font-bold ml-2">{gameData.currentScore.toFixed(1)}</span>
          </div>

          {gameData.combo > 0 && (
            <div className="bg-amber-50 px-4 py-2 rounded-xl">
              <span className="text-amber-600 text-xl font-bold">{gameData.combo}x</span>
              <span className="text-amber-500 text-sm ml-1">Combo</span>
            </div>
          )}
        </div>
      </div>

      {/* 主游戏区域 */}
      <div className="flex-1 flex">
        <div className="w-1/2 relative bg-gray-900">
          <video ref={videoRef} src={getVideoUrl()} className="w-full h-full object-contain" muted playsInline onEnded={handleVideoEnded} />
        </div>

        <div className="w-1/2 relative bg-stone-200">
          <video ref={cameraVideoRef} className="w-full h-full object-contain" autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
          <canvas ref={skeletonCanvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={{ transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} className="hidden" />

          {gamePhase === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center">
                <div className="text-8xl font-bold text-white animate-pulse">{countdown}</div>
                <p className="text-xl text-gray-300 mt-4">准备闯关！</p>
              </div>
            </div>
          )}

          {gamePhase === 'ready' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center">
                <div className="text-6xl mb-6">⛩️</div>
                <h2 className="text-2xl font-bold text-white mb-4 font-serif">准备闯关</h2>
                <p className="text-gray-300 mb-6">摄像头已就绪</p>
                <button
                  onClick={startCountdown}
                  className="px-8 py-4 bg-white hover:bg-stone-100 text-gray-800 text-xl font-bold rounded-2xl transition-all transform hover:scale-105 flex items-center gap-3"
                >
                  <PlayCircle size={28} /> 开始挑战
                </button>
              </div>
            </div>
          )}

          {showJudge && judgeDisplay && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`text-center ${gradeStyles[judgeDisplay.grade]?.bg || 'bg-gray-100'} px-12 py-6 rounded-3xl animate-bounce`}>
                <div className={`text-5xl font-black ${gradeStyles[judgeDisplay.grade]?.color || 'text-gray-800'}`}>
                  {gradeStyles[judgeDisplay.grade]?.text || judgeDisplay.grade?.toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {gamePhase === 'playing' && (
            <div className={`absolute bottom-4 right-4 px-4 py-2 rounded-full ${gameData.hasLandmarks ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <span className={gameData.hasLandmarks ? 'text-emerald-700' : 'text-red-700'}>
                {gameData.hasLandmarks ? '✓ 已检测到人体' : '⚠ 请确保全身在画面中'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 底部统计栏 */}
      {gamePhase === 'playing' && (
        <div className="h-20 bg-white flex items-center justify-between px-8 border-t border-stone-200">
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-yellow-500 font-bold text-xl">{gameData.stats.perfect}</div>
              <div className="text-gray-400 text-sm">Perfect</div>
            </div>
            <div className="text-center">
              <div className="text-green-500 font-bold text-xl">{gameData.stats.great}</div>
              <div className="text-gray-400 text-sm">Great</div>
            </div>
            <div className="text-center">
              <div className="text-cyan-500 font-bold text-xl">{gameData.stats.good}</div>
              <div className="text-gray-400 text-sm">Good</div>
            </div>
            <div className="text-center">
              <div className="text-red-500 font-bold text-xl">{gameData.stats.miss}</div>
              <div className="text-gray-400 text-sm">Miss</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-gray-500">
              进度: <span className="text-gray-800 font-bold">{gameData.progress.current}</span> / {gameData.progress.total}
            </div>
            <div className="w-48 h-3 bg-stone-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
                style={{ width: `${(gameData.progress.current / gameData.progress.total) * 100}%` }} />
            </div>
          </div>

          <button onClick={handleFinishPractice} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors">
            完成挑战
          </button>
        </div>
      )}

      {gamePhase === 'finished' && finalResult && (
        <ResultModal result={finalResult} onRetry={handleRetry} onClose={handleClose}
          onNext={() => { if (finalResult.passed && onComplete) onComplete(finalResult); handleClose(); }} />
      )}
    </div>
  );
};

// ========== 水墨山水背景组件 ==========
const InkMountainBackground = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* 远山 - 最淡 */}
    <svg className="absolute bottom-0 left-0 w-full h-[60%] opacity-[0.06]" viewBox="0 0 1200 400" preserveAspectRatio="xMidYMax slice">
      <path d="M0 400 L0 280 Q100 200 200 250 Q350 180 450 220 Q550 150 650 200 Q800 120 900 180 Q1000 140 1100 190 Q1150 170 1200 200 L1200 400 Z" fill="#374151"/>
    </svg>
    
    {/* 中山 */}
    <svg className="absolute bottom-0 left-0 w-full h-[45%] opacity-[0.10]" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMax slice">
      <path d="M0 300 L0 200 Q80 150 150 180 Q250 100 350 150 Q450 80 550 130 Q700 60 800 120 Q900 90 1000 140 Q1100 110 1200 150 L1200 300 Z" fill="#1f2937"/>
        </svg>
    
    {/* 近山 - 最深 */}
    <svg className="absolute bottom-0 left-0 w-full h-[30%] opacity-[0.15]" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice">
      <path d="M0 200 L0 120 Q60 80 120 100 Q200 50 300 90 Q400 40 500 80 Q600 30 700 70 Q850 20 950 60 Q1050 40 1150 80 L1200 90 L1200 200 Z" fill="#111827"/>
    </svg>

    {/* 云雾效果 */}
    <div className="absolute top-[30%] left-0 w-full h-32 opacity-[0.04]"
      style={{ background: 'linear-gradient(180deg, transparent, #6b7280, transparent)' }} />
    <div className="absolute top-[50%] left-0 w-full h-24 opacity-[0.03]"
      style={{ background: 'linear-gradient(180deg, transparent, #9ca3af, transparent)' }} />

    {/* 左侧水墨晕染 */}
    <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-[0.06]"
      style={{ background: 'radial-gradient(circle, #374151 0%, transparent 70%)' }} />
    
    {/* 右上角淡墨 */}
    <div className="absolute -top-10 -right-10 w-60 h-60 rounded-full opacity-[0.04]"
      style={{ background: 'radial-gradient(circle, #6b7280 0%, transparent 70%)' }} />

    {/* 飞鸟点缀 */}
    <svg className="absolute top-[15%] right-[20%] opacity-[0.08]" width="60" height="30" viewBox="0 0 60 30">
      <path d="M0 15 Q10 5 20 15 Q10 10 0 15" fill="#374151"/>
      <path d="M25 10 Q35 0 45 10 Q35 5 25 10" fill="#374151"/>
      <path d="M40 18 Q48 10 56 18 Q48 14 40 18" fill="#374151"/>
    </svg>

    {/* 松树剪影 - 左侧 */}
    <svg className="absolute bottom-[25%] left-[5%] opacity-[0.08]" width="60" height="120" viewBox="0 0 60 120">
      <path d="M30 120 L30 60 M30 60 L15 70 M30 60 L45 70 M30 50 L10 65 M30 50 L50 65 M30 40 L20 50 M30 40 L40 50 M30 30 L15 45 M30 30 L45 45 M30 20 L25 30 M30 20 L35 30 M30 10 L30 20" 
        stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
    </svg>

    {/* 松树剪影 - 右侧 */}
    <svg className="absolute bottom-[20%] right-[8%] opacity-[0.06]" width="50" height="100" viewBox="0 0 50 100">
      <path d="M25 100 L25 50 M25 50 L12 58 M25 50 L38 58 M25 42 L8 54 M25 42 L42 54 M25 34 L15 42 M25 34 L35 42 M25 26 L18 34 M25 26 L32 34 M25 18 L22 24 M25 18 L28 24" 
        stroke="#374151" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    </svg>
  </div>
);

// ========== 山门关卡组件 ==========
const MountainGate = ({ level, index, totalLevels, onStart, isActive }) => {
  const isLocked = !level.unlocked;
  const chineseNumbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  
  // 计算位置 - 蜿蜒的山路效果
  const getPosition = () => {
    const baseTop = 15 + (index * 13); // 从上往下排列
    const isLeft = index % 2 === 0;
    const baseLeft = isLeft ? 25 : 55;
    const offset = Math.sin(index * 0.8) * 8;
    return {
      top: `${baseTop}%`,
      left: `${baseLeft + offset}%`
    };
  };

  const position = getPosition();

  return (
    <>
      {/* 连接线 - 山路 */}
      {index > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <defs>
            <linearGradient id={`pathGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6b7280" />
              <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* 山门 */}
      <div
        className={`
          absolute transform -translate-x-1/2 -translate-y-1/2 z-10
          transition-all duration-500 ease-out
          ${isLocked ? 'opacity-50' : 'opacity-100'}
          ${!isLocked && 'hover:scale-110 cursor-pointer'}
          ${isActive && !isLocked ? 'scale-110' : ''}
        `}
        style={{ top: position.top, left: position.left }}
        onClick={() => !isLocked && onStart(level)}
      >
        {/* 山门主体 */}
        <div className={`
          relative w-32 h-40 flex flex-col items-center justify-start
          ${level.completed ? 'filter-none' : isLocked ? 'grayscale' : ''}
        `}>
          {/* 牌匾背景 */}
          <div className={`
            relative w-28 h-36 rounded-t-lg
            ${isLocked 
              ? 'bg-gradient-to-b from-stone-400 to-stone-500' 
              : level.completed
                ? 'bg-gradient-to-b from-amber-700 to-amber-900'
                : 'bg-gradient-to-b from-stone-700 to-stone-800'
            }
            shadow-lg border-2 
            ${isLocked ? 'border-stone-500' : level.completed ? 'border-amber-600' : 'border-stone-600'}
            flex flex-col items-center justify-center
            transition-all duration-300
            ${!isLocked && 'hover:shadow-xl hover:shadow-stone-400/30'}
          `}>
            {/* 门顶装饰 */}
            <div className={`
              absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6
              ${isLocked ? 'bg-stone-500' : level.completed ? 'bg-amber-800' : 'bg-stone-700'}
              rounded-t-xl
            `}>
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-stone-400/30 rounded-full" />
            </div>

            {/* 完成印章 */}
            {level.completed && (
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow-md transform rotate-12">
                <span className="text-white text-xs font-bold">破</span>
              </div>
            )}

            {/* 锁定图标 */}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-lg">
                <Lock size={32} className="text-stone-300" />
              </div>
            )}

            {/* 关卡编号 - 篆书风格 */}
            <div className={`
              text-4xl font-black mb-1
              ${isLocked ? 'text-stone-400' : 'text-stone-200'}
              font-serif
            `}>
              {chineseNumbers[index]}
            </div>

            {/* 关卡名称 */}
            <div className={`
              text-sm font-bold tracking-widest
              ${isLocked ? 'text-stone-400' : 'text-stone-100'}
              font-serif text-center px-2
            `}>
              {level.title}
            </div>

            {/* 难度星星 */}
            <div className="flex gap-0.5 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={i < level.difficulty 
                    ? isLocked ? 'text-stone-400' : 'text-amber-400 fill-amber-400' 
                    : 'text-stone-600'
                  }
                />
              ))}
            </div>

            {/* 最佳成绩 */}
            {level.bestScore !== null && !isLocked && (
              <div className="mt-2 bg-black/30 rounded px-2 py-0.5">
                <span className={`
                  text-xs font-bold
                  ${level.bestGrade === 'S' ? 'text-yellow-400' :
                    level.bestGrade === 'A' ? 'text-green-400' :
                    level.bestGrade === 'B' ? 'text-blue-400' :
                    level.bestGrade === 'C' ? 'text-orange-400' : 'text-red-400'}
                `}>
                  {level.bestGrade} · {level.bestScore.toFixed(0)}分
                </span>
              </div>
            )}
          </div>

          {/* 门柱 */}
          <div className="flex gap-20 -mt-1">
            <div className={`w-3 h-8 ${isLocked ? 'bg-stone-500' : level.completed ? 'bg-amber-900' : 'bg-stone-800'} rounded-b`} />
            <div className={`w-3 h-8 ${isLocked ? 'bg-stone-500' : level.completed ? 'bg-amber-900' : 'bg-stone-800'} rounded-b`} />
          </div>

          {/* 阶梯 */}
          <div className="flex flex-col items-center -mt-1">
            <div className={`w-20 h-2 ${isLocked ? 'bg-stone-400' : 'bg-stone-600'} rounded-sm`} />
            <div className={`w-24 h-2 ${isLocked ? 'bg-stone-400' : 'bg-stone-500'} rounded-sm -mt-0.5`} />
            <div className={`w-28 h-2 ${isLocked ? 'bg-stone-300' : 'bg-stone-400'} rounded-sm -mt-0.5`} />
          </div>
        </div>

        {/* 点击提示 */}
        {!isLocked && !level.completed && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <span className="text-xs text-stone-500 bg-white/80 px-2 py-1 rounded-full shadow-sm">
              点击闯关
            </span>
          </div>
        )}
      </div>
    </>
  );
};

// ========== 山路路径组件 ==========
const MountainPath = ({ levels }) => {
  const getPosition = (index) => {
    const baseTop = 15 + (index * 13);
    const isLeft = index % 2 === 0;
    const baseLeft = isLeft ? 25 : 55;
    const offset = Math.sin(index * 0.8) * 8;
    return { x: baseLeft + offset, y: baseTop };
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
      <defs>
        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d6d3d1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a8a29e" stopOpacity="0.5" />
        </linearGradient>
      </defs>
      
      {levels.map((level, index) => {
        if (index === 0) return null;
        const prev = getPosition(index - 1);
        const curr = getPosition(index);
        
        // 贝塞尔曲线控制点
        const midY = (prev.y + curr.y) / 2;
        const controlX1 = prev.x + (curr.x - prev.x) * 0.5;
        const controlX2 = prev.x + (curr.x - prev.x) * 0.5;

        return (
          <g key={index}>
            {/* 路径阴影 */}
            <path
              d={`M ${prev.x}% ${prev.y}% 
                  C ${controlX1}% ${midY}% ${controlX2}% ${midY}% ${curr.x}% ${curr.y}%`}
              stroke="#a8a29e"
              strokeWidth="8"
              strokeDasharray="12 8"
              fill="none"
              opacity="0.2"
              strokeLinecap="round"
            />
            {/* 主路径 */}
            <path
              d={`M ${prev.x}% ${prev.y}% 
                  C ${controlX1}% ${midY}% ${controlX2}% ${midY}% ${curr.x}% ${curr.y}%`}
              stroke="url(#pathGradient)"
              strokeWidth="4"
              strokeDasharray="8 6"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
};

// ========== 主页面组件 ==========
const GameLevelPage = () => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');
  const [playingLevel, setPlayingLevel] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);

  const defaultLevels = [
    { id: 1, title: '起势', name: 'qishi', description: '太极起势，心静体松，气沉丹田', difficulty: 1, unlocked: true, completed: false, bestScore: null, bestGrade: null },
    { id: 2, title: '野马分鬃', name: 'yemafenzong', description: '左右分鬃，如野马奔腾', difficulty: 2, unlocked: false, completed: false, bestScore: null, bestGrade: null },
    { id: 3, title: '白鹤亮翅', name: 'baiheliangchi', description: '展翅亮翅，轻盈灵动', difficulty: 2, unlocked: false, completed: false, bestScore: null, bestGrade: null },
    { id: 4, title: '搂膝拗步', name: 'louxi', description: '搂膝推掌，步法稳健', difficulty: 3, unlocked: false, completed: false, bestScore: null, bestGrade: null },
    { id: 5, title: '手挥琵琶', name: 'shouhuipipa', description: '如抱琵琶，柔中带刚', difficulty: 2, unlocked: false, completed: false, bestScore: null, bestGrade: null },
    { id: 6, title: '倒卷肱', name: 'daojuangong', description: '后退连环，以退为进', difficulty: 3, unlocked: false, completed: false, bestScore: null, bestGrade: null }
  ];

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setServerStatus('checking');

      const health = await api.healthCheck();
      if (health) {
        setServerStatus('online');
        const serverLevels = await api.getLevels();
        if (serverLevels && serverLevels.length > 0) {
          const mergedLevels = defaultLevels.map(defaultLevel => {
            const serverLevel = serverLevels.find(s => s.name === defaultLevel.name);
            return serverLevel ? { ...defaultLevel, ...serverLevel } : defaultLevel;
          });
          setLevels(mergedLevels);
        } else {
          setLevels(defaultLevels);
        }
      } else {
        setServerStatus('offline');
        setLevels(defaultLevels);
      }

      setLoading(false);
    };

    init();
  }, []);

  const handleStartLevel = (level) => {
    if (!level.unlocked) return;
    setPlayingLevel(level);
  };

  const handleGameComplete = (result) => {
    setLevels(prev => prev.map((level, index) => {
      if (level.id === playingLevel.id) {
        const newBestScore = level.bestScore ? Math.max(level.bestScore, result.finalScore) : result.finalScore;
        return { ...level, completed: true, bestScore: newBestScore, bestGrade: result.grade };
      }
      if (result.passed && index > 0 && prev[index - 1]?.id === playingLevel.id) {
        return { ...level, unlocked: true };
      }
      return level;
    }));
    setPlayingLevel(null);
  };

  const handleCloseGame = () => setPlayingLevel(null);

  // 计算进度
  const completedCount = levels.filter(l => l.completed).length;
  const totalCount = levels.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-6">
            {/* 太极加载动画 */}
            <svg viewBox="0 0 100 100" className="w-20 h-20 mx-auto animate-spin" style={{ animationDuration: '3s' }}>
              <circle cx="50" cy="50" r="48" fill="none" stroke="#d6d3d1" strokeWidth="1.5" />
              <path d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2" fill="#57534e"/>
              <path d="M50 2 A48 48 0 0 0 50 98 A24 24 0 0 0 50 50 A24 24 0 0 1 50 2" fill="#e7e5e4"/>
              <circle cx="50" cy="26" r="6" fill="#e7e5e4" />
              <circle cx="50" cy="74" r="6" fill="#57534e" />
            </svg>
          </div>
          <p className="text-stone-500 font-serif">载入山门中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-white relative overflow-hidden">
      {/* 水墨山水背景 */}
      <InkMountainBackground />

      {/* 顶部信息栏 */}
      <div className="relative z-20 border-b border-stone-200/50 bg-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧标题 */}
            <div className="flex items-center gap-4">
              {/* 太极小图标 */}
              <svg viewBox="0 0 100 100" className="w-10 h-10">
                <circle cx="50" cy="50" r="48" fill="none" stroke="#a8a29e" strokeWidth="1.5" />
                <path d="M50 2 A48 48 0 0 1 50 98 A24 24 0 0 1 50 50 A24 24 0 0 0 50 2" fill="#57534e"/>
                <path d="M50 2 A48 48 0 0 0 50 98 A24 24 0 0 0 50 50 A24 24 0 0 1 50 2" fill="#e7e5e4"/>
                <circle cx="50" cy="26" r="5" fill="#e7e5e4" />
                <circle cx="50" cy="74" r="5" fill="#57534e" />
              </svg>
              
              <div>
                <h1 className="text-2xl font-bold text-stone-800 font-serif tracking-wider">闯山门</h1>
                <p className="text-stone-500 text-xs">二十四式太极拳 · 逐关挑战</p>
              </div>
            </div>

            {/* 右侧信息 */}
            <div className="flex items-center gap-6">
              {/* 进度 */}
              <div className="flex items-center gap-3 bg-stone-100/80 px-4 py-2 rounded-full">
                <Mountain size={18} className="text-stone-500" />
                <span className="text-stone-600 text-sm">
                  已破 <span className="font-bold text-stone-800">{completedCount}</span> / {totalCount} 关
                </span>
                <div className="w-20 h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500"
                    style={{ width: `${(completedCount / totalCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* 服务器状态 */}
              <div className={`
                flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                ${serverStatus === 'online' 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : serverStatus === 'offline' 
                    ? 'bg-red-50 text-red-600' 
                    : 'bg-stone-100 text-stone-500'}
              `}>
                {serverStatus === 'checking' && <Loader2 size={14} className="animate-spin" />}
                {serverStatus === 'online' && <Wifi size={14} />}
                {serverStatus === 'offline' && <WifiOff size={14} />}
                <span>{serverStatus === 'online' ? '已连接' : serverStatus === 'offline' ? '离线' : '连接中'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主体：山门地图 */}
      <div className="relative z-10 min-h-[calc(100vh-80px)] py-8">
        {/* 起点标记 */}
        <div className="absolute top-[8%] left-1/2 -translate-x-1/2 text-center z-20">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-stone-200">
            <span className="text-stone-400 text-sm">⛰️ 修行之路始于此</span>
          </div>
        </div>

        {/* 山路路径 */}
        <MountainPath levels={levels} />

        {/* 各个山门 */}
        {levels.map((level, index) => (
          <MountainGate
            key={level.id}
            level={level}
            index={index}
            totalLevels={levels.length}
            onStart={handleStartLevel}
            isActive={hoveredLevel === level.id}
          />
        ))}

        {/* 终点标记 */}
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 text-center z-20">
          <div className="inline-flex flex-col items-center gap-2">
            <div className="text-4xl">🏔️</div>
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-stone-200">
              <span className="text-stone-500 text-sm font-serif">登顶悟道</span>
            </div>
          </div>
        </div>
      </div>

      {/* 底部装饰文字 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <p className="text-stone-400 text-xs tracking-widest">千里之行 · 始于足下</p>
      </div>

      {/* 游戏界面 */}
      {playingLevel && (
        <GamePlayView
          level={playingLevel}
          onClose={handleCloseGame}
          onComplete={handleGameComplete}
        />
      )}
    </div>
  );
};

export default GameLevelPage;
