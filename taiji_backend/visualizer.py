# visualizer.py - 可视化器（简化版，无特效）

import cv2
import numpy as np
import time
from typing import Tuple, Optional

from config import GameConfig
from data_structures import KeyFrame


class Visualizer:
    """可视化 - 简化版"""

    CONNECTIONS = [
        (11, 13), (13, 15), (12, 14), (14, 16),
        (11, 12), (11, 23), (12, 24), (23, 24),
        (23, 25), (25, 27), (24, 26), (26, 28),
    ]

    # 判定颜色（保留）
    GRADE_COLORS = {
        'perfect': (255, 215, 0),  # 金色
        'great': (0, 255, 0),  # 绿色
        'good': (0, 255, 255),  # 黄色
        'miss': (0, 0, 255),  # 红色
    }

    GRADE_TEXT = {
        'perfect': 'PERFECT',
        'great': 'GREAT',
        'good': 'GOOD',
        'miss': 'MISS',
    }

    def __init__(self):
        self.font = cv2.FONT_HERSHEY_SIMPLEX

    def draw_skeleton(self, frame: np.ndarray, landmarks: np.ndarray,
                      color: Tuple = (0, 255, 0), thickness: int = 2) -> np.ndarray:
        """绘制骨架"""
        if landmarks is None:
            return frame

        h, w = frame.shape[:2]
        result = frame.copy()

        # 检查 landmarks 是否为有效的 numpy 数组
        if not isinstance(landmarks, np.ndarray):
            return frame

        for start, end in self.CONNECTIONS:
            if start >= len(landmarks) or end >= len(landmarks):
                continue
            if landmarks[start, 2] < 0.5 or landmarks[end, 2] < 0.5:
                continue
            pt1 = (int(landmarks[start, 0] * w), int(landmarks[start, 1] * h))
            pt2 = (int(landmarks[end, 0] * w), int(landmarks[end, 1] * h))
            cv2.line(result, pt1, pt2, color, thickness)

        for lm in landmarks:
            if lm[2] >= 0.5:
                pt = (int(lm[0] * w), int(lm[1] * h))
                cv2.circle(result, pt, 4, color, -1)

        return result

    def create_game_view(self,
                         template_frame: np.ndarray,
                         user_frame: np.ndarray,
                         template_landmarks: np.ndarray,
                         user_landmarks: np.ndarray,
                         scorer,
                         current_keyframe: Optional[KeyFrame],
                         next_keyframe: Optional[Tuple[KeyFrame, float]],
                         video_progress: float,
                         speed: float,
                         is_paused: bool) -> np.ndarray:
        """创建游戏界面（简化版）"""

        W, H = GameConfig.DISPLAY_WIDTH, GameConfig.DISPLAY_HEIGHT
        half_w = W // 2
        content_h = H - 100

        # 调整大小
        left = cv2.resize(template_frame, (half_w, content_h))
        right = cv2.resize(user_frame, (half_w, content_h))

        # 画骨架
        left = self.draw_skeleton(left, template_landmarks, (0, 165, 255), 3)
        right = self.draw_skeleton(right, user_landmarks, (0, 255, 0), 3)

        # 创建画布
        canvas = np.zeros((H, W, 3), dtype=np.uint8)
        canvas[:] = (30, 30, 30)

        # 放置画面
        y0 = 40
        canvas[y0:y0 + content_h, :half_w] = left
        canvas[y0:y0 + content_h, half_w:] = right

        # 分割线
        cv2.line(canvas, (half_w, y0), (half_w, y0 + content_h), (100, 100, 100), 2)

        # === 顶栏 ===
        cv2.rectangle(canvas, (0, 0), (W, 38), (40, 40, 40), -1)
        cv2.putText(canvas, "Standard", (20, 26), self.font, 0.6, (0, 165, 255), 2)
        cv2.putText(canvas, "Your Pose", (half_w + 20, 26), self.font, 0.6, (0, 255, 0), 2)

        # 速度/暂停
        if is_paused:
            cv2.putText(canvas, "PAUSED", (half_w - 50, 26), self.font, 0.6, (0, 255, 255), 2)
        else:
            cv2.putText(canvas, f"x{speed:.1f}", (half_w - 40, 26), self.font, 0.5, (200, 200, 200), 1)

        # 当前关键帧名称
        if current_keyframe is not None:
            cv2.putText(canvas, f"[{current_keyframe.name}]", (20, y0 + 25),
                        self.font, 0.6, (255, 255, 255), 1)

        # 下一个关键帧 - 修复：检查元组内的值是否为 None
        if next_keyframe is not None:
            nkf, remaining = next_keyframe
            if nkf is not None:  # 增加这个检查
                cv2.putText(canvas, f"Next: {nkf.name} ({remaining:.1f}s)",
                            (20, y0 + content_h - 10), self.font, 0.4, (150, 150, 150), 1)

        # === 判定显示（简化，只显示文字）===
        state = scorer.state
        if state.last_judge and (time.time() - state.last_judge_time) < 1.0:
            judge = state.last_judge
            grade = judge.grade
            color = self.GRADE_COLORS[grade]
            text = self.GRADE_TEXT[grade]

            # 显示判定文字（无特效）
            text_x = half_w + half_w // 2 - 60
            text_y = y0 + content_h // 2
            cv2.putText(canvas, text, (text_x, text_y), self.font, 1.2, color, 2)

            # 连击
            if judge.combo > 1:
                cv2.putText(canvas, f"{judge.combo} COMBO", (text_x, text_y + 35),
                            self.font, 0.6, (255, 200, 100), 1)

        # === 底部信息栏 ===
        info_y = y0 + content_h + 8

        # 进度条
        bar_x, bar_w = 20, half_w - 40
        cv2.rectangle(canvas, (bar_x, info_y), (bar_x + bar_w, info_y + 10), (60, 60, 60), -1)
        cv2.rectangle(canvas, (bar_x, info_y), (bar_x + int(bar_w * video_progress), info_y + 10),
                      (0, 165, 255), -1)

        # 进度文字
        done, total = scorer.get_progress()
        cv2.putText(canvas, f"{done}/{total}", (bar_x + bar_w + 10, info_y + 10),
                    self.font, 0.4, (200, 200, 200), 1)

        # 得分
        score_y = info_y + 30
        current_score = scorer.get_final_score()
        cv2.putText(canvas, f"Score: {current_score:.1f}", (20, score_y),
                    self.font, 0.6, (255, 255, 255), 1)

        # 统计
        stats = f"P:{state.perfect_count} G:{state.great_count} Go:{state.good_count} M:{state.miss_count}"
        cv2.putText(canvas, stats, (180, score_y), self.font, 0.4, (180, 180, 180), 1)

        # Combo
        if state.combo > 0:
            cv2.putText(canvas, f"x{state.combo}", (W - 80, score_y),
                        self.font, 0.6, (255, 200, 100), 1)

        # 控制提示
        cv2.putText(canvas, "SPACE:Pause  R:Restart  W/S:Speed  Q:Quit",
                    (half_w + 20, score_y), self.font, 0.35, (120, 120, 120), 1)

        return canvas

    def create_result_screen(self, scorer, duration: float) -> np.ndarray:
        """创建结果画面（简化版）"""
        W, H = GameConfig.DISPLAY_WIDTH, GameConfig.DISPLAY_HEIGHT
        canvas = np.zeros((H, W, 3), dtype=np.uint8)
        canvas[:] = (30, 30, 30)

        state = scorer.state
        final_score = scorer.get_final_score()

        # 评级
        if final_score >= 90:
            grade, grade_color = "S", (0, 255, 255)
        elif final_score >= 80:
            grade, grade_color = "A", (0, 255, 0)
        elif final_score >= 70:
            grade, grade_color = "B", (0, 200, 255)
        elif final_score >= 60:
            grade, grade_color = "C", (0, 255, 255)
        else:
            grade, grade_color = "D", (0, 0, 255)

        # 标题
        cv2.putText(canvas, "RESULT", (W // 2 - 80, 80), self.font, 1.5, (255, 255, 255), 2)

        # 评级
        cv2.putText(canvas, grade, (W // 2 - 40, 200), self.font, 3, grade_color, 4)

        # 分数
        cv2.putText(canvas, f"Score: {final_score:.1f} / 100", (W // 2 - 120, 280),
                    self.font, 1, (255, 255, 255), 2)

        # 统计
        y = 350
        cv2.putText(canvas, f"Perfect: {state.perfect_count}", (W // 2 - 80, y),
                    self.font, 0.7, self.GRADE_COLORS['perfect'], 1)
        y += 35
        cv2.putText(canvas, f"Great: {state.great_count}", (W // 2 - 80, y),
                    self.font, 0.7, self.GRADE_COLORS['great'], 1)
        y += 35
        cv2.putText(canvas, f"Good: {state.good_count}", (W // 2 - 80, y),
                    self.font, 0.7, self.GRADE_COLORS['good'], 1)
        y += 35
        cv2.putText(canvas, f"Miss: {state.miss_count}", (W // 2 - 80, y),
                    self.font, 0.7, self.GRADE_COLORS['miss'], 1)

        y += 50
        cv2.putText(canvas, f"Max Combo: {state.max_combo}x", (W // 2 - 80, y),
                    self.font, 0.7, (255, 200, 100), 1)

        # 提示
        cv2.putText(canvas, "R: Retry   Q: Quit", (W // 2 - 100, H - 50),
                    self.font, 0.6, (150, 150, 150), 1)

        return canvas
