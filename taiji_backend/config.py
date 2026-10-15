# config.py - 系统配置（合并版）

from datetime import timedelta

# ==================== JWT 配置 ====================
SECRET_KEY = "statickey"  # JWT 密钥
ALGORITHM = "HS256"       # JWT 编码算法
ACCESS_TOKEN_EXPIRE_MINUTES = 3000  # Access Token 有效期 (分钟)


# ==================== 游戏配置 ====================
class GameConfig:
    """游戏相关配置"""
    TEMPLATE_DIR = "templates"
    VIDEO_DIR = "videos"

    # 显示设置 - 固定大小
    DISPLAY_WIDTH = 1280
    DISPLAY_HEIGHT = 720

    # 关键帧检测参数
    MIN_KEYFRAME_INTERVAL = 15
    MOTION_THRESHOLD = 8.0

    # 评分阈值 (角度偏差)
    PERFECT_THRESHOLD = 10.0
    GREAT_THRESHOLD = 20.0
    GOOD_THRESHOLD = 35.0

    # 评分权重
    SCORE_WEIGHTS = {
        'perfect': 1.0,
        'great': 0.8,
        'good': 0.5,
        'miss': 0.0
    }

    # Combo 加成
    COMBO_BONUS = {
        5: 0.1,
        10: 0.2,
        20: 0.3,
        50: 0.5,
    }

    # 判定时间窗口 (秒)
    JUDGE_WINDOW = 0.5

    # 速度设置
    DEFAULT_SPEED = 1.0
    MIN_SPEED = 0.25
    MAX_SPEED = 2.0
