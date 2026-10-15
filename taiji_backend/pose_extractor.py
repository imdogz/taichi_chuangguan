# pose_extractor.py - 姿态提取器

import cv2
import numpy as np
from typing import Optional, Tuple, Dict

try:
    import mediapipe as mp
except ImportError:
    print("请安装: pip install mediapipe")
    exit(1)

from angle_calculator import AngleCalculator


class PoseExtractor:
    """姿态提取"""

    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def extract(self, frame: np.ndarray) -> Optional[Tuple[np.ndarray, Dict[str, float]]]:
        """提取姿态，返回 (landmarks, angles)"""
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        if not results.pose_landmarks:
            return None

        landmarks = np.array([
            [lm.x, lm.y, lm.visibility]
            for lm in results.pose_landmarks.landmark
        ])

        angles = AngleCalculator.extract_angles(landmarks)
        return landmarks, angles

    def close(self):
        self.pose.close()
