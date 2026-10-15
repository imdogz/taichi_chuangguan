# routers/game_router.py - 游戏路由（从 Flask 转换）

import os
import json
import base64
import time
import numpy as np
import cv2
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse

# 导入游戏模块
from config import GameConfig
from template_manager import TemplateManager
from pose_extractor import PoseExtractor
from rhythm_scorer import RhythmScorer

# ==================== 初始化 ====================

router = APIRouter(prefix="/api", tags=["game"])

# 初始化组件（单例）
template_manager = TemplateManager(GameConfig.TEMPLATE_DIR)
pose_extractor = PoseExtractor()

print("=" * 60)
print("🥋 游戏模块已加载")
print(f"📁 模板目录: {GameConfig.TEMPLATE_DIR}")
print(f"🎥 视频目录: {GameConfig.VIDEO_DIR}")
print("=" * 60)


# ==================== 工具函数 ====================

def decode_base64_image(data_url: str) -> Optional[np.ndarray]:
    """解码 base64 图像"""
    try:
        if ',' in data_url:
            data_url = data_url.split(',')[1]
        img_data = base64.b64decode(data_url)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"[Error] 图像解码失败: {e}")
        return None


def encode_image_base64(img: np.ndarray, quality: int = 70) -> Optional[str]:
    """编码图像为 base64"""
    try:
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        _, buffer = cv2.imencode('.jpg', img, encode_param)
        return base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        print(f"[Error] 图像编码失败: {e}")
        return None


# ==================== REST API ====================

@router.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "message": "服务器运行正常",
        "version": "2.0.0"
    }


@router.get("/levels")
async def get_levels():
    """获取关卡列表"""
    templates = template_manager.list_templates()
    template_names = [t['name'] for t in templates]

    levels = [
        {"id": 1, "name": "qishi", "title": "第一关：起势", "desc": "太极初开，心静体松"},
        {"id": 2, "name": "yemafenzong", "title": "第二关：野马分鬃", "desc": "意气相随，舒展大方"},
        {"id": 3, "name": "baiheliangchi", "title": "第三关：白鹤亮翅", "desc": "虚实分明，沉肩坠肘"},
        {"id": 4, "name": "louxiaobu", "title": "第四关：搂膝拗步", "desc": "手眼相随，步法轻灵"},
        {"id": 5, "name": "shouhuipipa", "title": "第五关：手挥琵琶", "desc": "以静制动，攻防兼备"},
    ]

    for level in levels:
        level['hasTemplate'] = level['name'] in template_names

    return levels


@router.get("/template/{name}")
async def get_template_info(name: str):
    """获取模板信息"""
    if template_manager.exists(name):
        try:
            data = template_manager.load(name)
            return {
                "name": name,
                "exists": True,
                "keyframeCount": data.get('keyframe_count', 0),
                "duration": data.get('duration', 0),
                "fps": data.get('fps', 30),
                "keyframes": [
                    {
                        "index": kf.frame_idx,
                        "timestamp": kf.timestamp,
                        "name": kf.name
                    }
                    for kf in data.get('keyframes', [])
                ]
            }
        except Exception as e:
            print(f"[API] 加载模板失败: {e}")

    return {"name": name, "exists": False}


@router.get("/video/{name}")
async def get_video(name: str):
    """获取视频文件"""
    video_dir = GameConfig.VIDEO_DIR

    for ext in ['.mp4', '.avi', '.mov', '.webm']:
        video_path = os.path.join(video_dir, f"{name}{ext}")
        if os.path.exists(video_path):
            return FileResponse(
                video_path,
                media_type="video/mp4",
                filename=f"{name}{ext}"
            )

    return JSONResponse(
        status_code=404,
        content={"error": f"视频不存在: {name}"}
    )


# ==================== WebSocket 游戏 ====================
ws_router = APIRouter(tags=["game-websocket"])

@ws_router.websocket("/ws/game")
async def game_websocket(websocket: WebSocket):
    """游戏 WebSocket 连接"""

    # 获取 Origin 头
    origin = websocket.headers.get("origin", "")
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    await websocket.accept()
    print("\n[WS] ✅ 客户端已连接")

    # 游戏会话状态
    session = {
        "initialized": False,
        "started": False,
        "template_name": None,
        "template_data": None,
        "scorer": None,
        "frame_count": 0,
        "start_time": 0,
    }

    try:
        while True:
            message = await websocket.receive_text()

            try:
                data = json.loads(message)
                action = data.get('action')

                if action != 'frame':
                    print(f"[WS] 收到动作: {action}")

                # ========== 初始化游戏 ==========
                if action == 'init':
                    template_name = data.get('templateName', 'qishi')
                    session["template_name"] = template_name

                    if template_manager.exists(template_name):
                        try:
                            session["template_data"] = template_manager.load(template_name)
                            keyframes = session["template_data"].get('keyframes', [])
                            session["scorer"] = RhythmScorer(keyframes)
                            session["initialized"] = True

                            print(f"[WS] ✅ 模板已加载: {template_name}")
                            print(f"[WS]    关键帧数: {len(keyframes)}")

                            await websocket.send_json({
                                "type": "init_success",
                                "data": {
                                    "templateName": template_name,
                                    "keyframeCount": len(keyframes),
                                    "duration": session["template_data"].get('duration', 30),
                                    "fps": session["template_data"].get('fps', 30),
                                    "keyframes": [
                                        {"timestamp": kf.timestamp, "name": kf.name}
                                        for kf in keyframes
                                    ]
                                }
                            })
                        except Exception as e:
                            print(f"[WS] ❌ 模板加载失败: {e}")
                            await websocket.send_json({
                                "type": "error",
                                "message": f"模板加载失败: {e}"
                            })
                    else:
                        print(f"[WS] ⚠️ 模板不存在: {template_name}，使用演示模式")
                        session["initialized"] = True
                        session["template_data"] = None
                        session["scorer"] = None

                        await websocket.send_json({
                            "type": "init_success",
                            "data": {
                                "templateName": template_name,
                                "keyframeCount": 10,
                                "duration": 30,
                                "demoMode": True
                            }
                        })

                # ========== 开始游戏 ==========
                elif action == 'start':
                    session["started"] = True
                    session["frame_count"] = 0
                    session["start_time"] = time.time()

                    if session["scorer"]:
                        session["scorer"].reset()

                    print("[WS] 🎮 游戏开始")

                    await websocket.send_json({
                        "type": "game_started",
                        "data": {}
                    })

                # ========== 处理帧 ==========
                elif action == 'frame':
                    if not session["started"]:
                        continue

                    session["frame_count"] += 1
                    frame_data = data.get('frame')
                    video_time = data.get('videoTime', 0)

                    # 提取用户姿态
                    user_landmarks = None
                    user_angles = None
                    has_landmarks = False

                    if frame_data:
                        img = decode_base64_image(frame_data)
                        if img is not None:
                            result = pose_extractor.extract(img)
                            if result is not None:
                                user_landmarks, user_angles = result
                                has_landmarks = True

                    # 准备响应数据
                    response_data = {
                        "hasLandmarks": has_landmarks,
                        "videoTime": video_time
                    }

                    # 如果有骨骼数据，转换为列表
                    if user_landmarks is not None:
                        response_data["landmarks"] = user_landmarks.tolist()

                    # 使用 RhythmScorer 判定
                    scorer = session["scorer"]
                    if scorer and user_angles:
                        judge_result = scorer.judge(user_angles, video_time)

                        if judge_result is not None:
                            response_data["judgeResult"] = {
                                "keyframeIdx": judge_result.keyframe_idx,
                                "keyframeName": judge_result.keyframe_name,
                                "grade": judge_result.grade,
                                "score": judge_result.score,
                                "angleDiff": judge_result.angle_diff,
                                "combo": judge_result.combo,
                                "comboBonus": judge_result.combo_bonus,
                                "totalScore": judge_result.total_score
                            }

                        state = scorer.state
                        done, total = scorer.get_progress()

                        response_data["gameState"] = {
                            "currentScore": scorer.get_final_score(),
                            "combo": state.combo,
                            "maxCombo": state.max_combo,
                            "stats": {
                                "perfect": state.perfect_count,
                                "great": state.great_count,
                                "good": state.good_count,
                                "miss": state.miss_count
                            },
                            "progress": {
                                "current": done,
                                "total": total
                            }
                        }

                        next_kf = scorer.get_next_keyframe(video_time)
                        if next_kf:
                            kf, remaining = next_kf
                            if kf:
                                response_data["nextKeyframe"] = {
                                    "name": kf.name,
                                    "remaining": remaining
                                }

                        current_kf = scorer.get_current_keyframe(video_time)
                        if current_kf:
                            response_data["currentKeyframe"] = {
                                "name": current_kf.name,
                                "timestamp": current_kf.timestamp
                            }

                    await websocket.send_json({
                        "type": "frame_result",
                        "data": response_data
                    })

                # ========== 结束游戏 ==========
                elif action == 'finish':
                    print("[WS] 🏁 游戏结束")

                    scorer = session["scorer"]
                    if scorer:
                        final_score = scorer.get_final_score()
                        state = scorer.state

                        if final_score >= 90:
                            grade = "S"
                        elif final_score >= 80:
                            grade = "A"
                        elif final_score >= 70:
                            grade = "B"
                        elif final_score >= 60:
                            grade = "C"
                        else:
                            grade = "D"

                        await websocket.send_json({
                            "type": "game_finished",
                            "data": {
                                "finalScore": final_score,
                                "grade": grade,
                                "passed": final_score >= 60,
                                "maxCombo": state.max_combo,
                                "stats": {
                                    "perfect": state.perfect_count,
                                    "great": state.great_count,
                                    "good": state.good_count,
                                    "miss": state.miss_count
                                }
                            }
                        })
                    else:
                        await websocket.send_json({
                            "type": "game_finished",
                            "data": {
                                "finalScore": 75,
                                "grade": "B",
                                "passed": True,
                                "maxCombo": 5,
                                "stats": {"perfect": 3, "great": 4, "good": 2, "miss": 1}
                            }
                        })

                    session["started"] = False

                # ========== 重置游戏 ==========
                elif action == 'reset':
                    print("[WS] 🔄 重置游戏")

                    if session["scorer"]:
                        session["scorer"].reset()

                    session["started"] = False
                    session["frame_count"] = 0

                    await websocket.send_json({
                        "type": "game_reset",
                        "data": {}
                    })

            except json.JSONDecodeError as e:
                print(f"[WS] JSON 解析错误: {e}")

    except WebSocketDisconnect:
        print("[WS] 客户端已断开\n")
    except Exception as e:
        print(f"[WS] 连接错误: {e}")
