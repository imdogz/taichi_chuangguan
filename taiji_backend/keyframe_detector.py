# keyframe_detector.py - 关键帧检测器

import numpy as np
from typing import List, Dict
from scipy.ndimage import gaussian_filter1d
from scipy.signal import find_peaks

from angle_calculator import AngleCalculator


class KeyFrameDetector:
    """关键帧检测器"""

    def __init__(self, min_interval: int = 15, threshold: float = 8.0):
        self.min_interval = min_interval
        self.threshold = threshold

    def detect(self, all_angles: List[Dict[str, float]], fps: float) -> List[int]:
        """检测关键帧，返回帧索引列表"""
        if len(all_angles) < 2:
            return [0]

        # 计算每帧的运动变化量
        motion_scores = [0.0]
        for i in range(1, len(all_angles)):
            diff, _ = AngleCalculator.calculate_diff(all_angles[i - 1], all_angles[i])
            motion_scores.append(diff)

        # 平滑处理
        motion_scores = np.array(motion_scores)
        motion_smooth = gaussian_filter1d(motion_scores, sigma=2)

        # 找峰值
        peaks, _ = find_peaks(
            motion_smooth,
            distance=self.min_interval,
            height=self.threshold,
            prominence=3.0
        )

        # 确保首尾帧
        keyframes = [0]
        for peak in peaks:
            if peak > self.min_interval and peak < len(all_angles) - self.min_interval:
                keyframes.append(int(peak))

        if len(all_angles) - 1 not in keyframes:
            keyframes.append(len(all_angles) - 1)

        return sorted(list(set(keyframes)))

    def auto_name_keyframes(self, keyframe_indices: List[int], total_frames: int) -> List[str]:
        """自动命名关键帧"""
        names = []
        taichi_moves = [
            "起势", "野马分鬃", "白鹤亮翅", "搂膝拗步",
            "手挥琵琶", "倒卷肱", "左揽雀尾", "右揽雀尾",
            "单鞭", "云手", "高探马", "右蹬脚",
            "双峰贯耳", "转身左蹬脚", "左下势独立", "右下势独立",
            "左右穿梭", "海底针", "闪通臂", "转身搬拦捶",
            "如封似闭", "十字手", "收势"
        ]

        for i, idx in enumerate(keyframe_indices):
            if i < len(taichi_moves):
                name = taichi_moves[i]
            else:
                progress = idx / total_frames
                name = f"动作{i + 1} ({progress * 100:.0f}%)"
            names.append(name)

        return names
