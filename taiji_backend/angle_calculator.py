# angle_calculator.py - 角度计算器

import numpy as np
from typing import Dict, Tuple


class AngleCalculator:
    """角度计算"""

    ANGLE_DEFINITIONS = {
        'left_elbow': (11, 13, 15),
        'right_elbow': (12, 14, 16),
        'left_shoulder': (13, 11, 23),
        'right_shoulder': (14, 12, 24),
        'left_knee': (23, 25, 27),
        'right_knee': (24, 26, 28),
        'left_hip': (11, 23, 25),
        'right_hip': (12, 24, 26),
        'spine': (0, 11, 23),
        'torso': (11, 23, 25),
    }

    ANGLE_NAMES_CN = {
        'left_elbow': '左肘',
        'right_elbow': '右肘',
        'left_shoulder': '左肩',
        'right_shoulder': '右肩',
        'left_knee': '左膝',
        'right_knee': '右膝',
        'left_hip': '左髋',
        'right_hip': '右髋',
        'spine': '脊柱',
        'torso': '躯干',
    }

    @staticmethod
    def calculate_angle(p1: np.ndarray, p2: np.ndarray, p3: np.ndarray) -> float:
        """计算三点角度"""
        v1, v2 = p1 - p2, p3 - p2
        len1, len2 = np.linalg.norm(v1), np.linalg.norm(v2)
        if len1 < 1e-6 or len2 < 1e-6:
            return 0.0
        cos_angle = np.clip(np.dot(v1, v2) / (len1 * len2), -1.0, 1.0)
        return np.degrees(np.arccos(cos_angle))

    @classmethod
    def extract_angles(cls, landmarks: np.ndarray) -> Dict[str, float]:
        """提取所有角度"""
        angles = {}
        coords = landmarks[:, :2]
        for name, (i, j, k) in cls.ANGLE_DEFINITIONS.items():
            if max(i, j, k) < len(coords):
                angles[name] = cls.calculate_angle(coords[i], coords[j], coords[k])
        return angles

    @classmethod
    def calculate_diff(cls, angles1: Dict[str, float], angles2: Dict[str, float]) -> Tuple[float, Dict[str, float]]:
        """计算两组角度的差异"""
        diffs = {}
        for name in cls.ANGLE_DEFINITIONS.keys():
            a1 = angles1.get(name, 0)
            a2 = angles2.get(name, 0)
            diffs[name] = abs(a1 - a2)

        avg_diff = np.mean(list(diffs.values()))
        return avg_diff, diffs
