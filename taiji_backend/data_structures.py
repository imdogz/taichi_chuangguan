# data_structures.py - 数据结构定义

import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional


@dataclass
class KeyFrame:
    """关键帧数据"""
    frame_idx: int
    timestamp: float
    name: str
    landmarks: np.ndarray
    angles: Dict[str, float]
    motion_score: float = 0.0
    description: str = ""


@dataclass
class JudgeResult:
    """判定结果"""
    keyframe_idx: int
    keyframe_name: str
    grade: str  # perfect/great/good/miss
    score: float
    angle_diff: float
    combo: int
    combo_bonus: float
    total_score: float


@dataclass
class GameState:
    """游戏状态"""
    current_keyframe_idx: int = 0
    total_score: float = 0.0
    max_possible_score: float = 0.0
    combo: int = 0
    max_combo: int = 0

    perfect_count: int = 0
    great_count: int = 0
    good_count: int = 0
    miss_count: int = 0

    judge_results: List[JudgeResult] = field(default_factory=list)
    last_judge: Optional[JudgeResult] = None
    last_judge_time: float = 0.0
