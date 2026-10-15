# rhythm_scorer.py - 评分系统（去掉每帧基础分显示）

import time
from typing import List, Dict, Tuple, Optional

from config import GameConfig
from data_structures import KeyFrame, JudgeResult, GameState
from angle_calculator import AngleCalculator


class RhythmScorer:
    """节奏评分系统"""

    def __init__(self, keyframes: List[KeyFrame]):
        self.keyframes = keyframes
        self.total_keyframes = len(keyframes)

        # 内部计算用，不对外显示
        self._score_unit = 100.0 / max(self.total_keyframes, 1)

        self.state = GameState()
        self.state.max_possible_score = 100.0
        self.judged_keyframes = set()

        # 打印信息（去掉基础分）
        print(f"\n{'=' * 60}")
        print(f"评分系统初始化")
        print(f"  关键帧数量: {self.total_keyframes}")
        print(f"{'=' * 60}")

    def reset(self):
        """重置状态"""
        self.state = GameState()
        self.state.max_possible_score = 100.0
        self.judged_keyframes = set()
        print("\n[评分系统] 已重置")

    def get_current_keyframe(self, video_time: float) -> Optional[KeyFrame]:
        """获取当前应判定的关键帧"""
        for i, kf in enumerate(self.keyframes):
            if i in self.judged_keyframes:
                continue
            if abs(video_time - kf.timestamp) <= GameConfig.JUDGE_WINDOW:
                return kf
        return None

    def get_next_keyframe(self, video_time: float) -> Optional[Tuple[KeyFrame, float]]:
        """获取下一个关键帧及剩余时间"""
        for i, kf in enumerate(self.keyframes):
            if i in self.judged_keyframes and kf.timestamp <= video_time:
                continue
            if kf.timestamp > video_time:
                remaining = kf.timestamp - video_time
                return (kf, remaining)
        return None

    def judge(self, user_angles: Dict[str, float], video_time: float) -> Optional[JudgeResult]:
        """判定当前姿态"""
        # 找当前应判定的关键帧
        current_kf = None
        current_kf_idx = -1

        for i, kf in enumerate(self.keyframes):
            if i in self.judged_keyframes:
                continue

            if abs(video_time - kf.timestamp) <= GameConfig.JUDGE_WINDOW:
                current_kf = kf
                current_kf_idx = i
                break

            # 已错过
            if video_time > kf.timestamp + GameConfig.JUDGE_WINDOW:
                self._record_miss(i, kf)

        if current_kf is None:
            return None

        # 计算差异
        avg_diff, angle_diffs = AngleCalculator.calculate_diff(user_angles, current_kf.angles)

        # 判定等级
        if avg_diff < GameConfig.PERFECT_THRESHOLD:
            grade = 'perfect'
        elif avg_diff < GameConfig.GREAT_THRESHOLD:
            grade = 'great'
        elif avg_diff < GameConfig.GOOD_THRESHOLD:
            grade = 'good'
        else:
            grade = 'miss'

        # 计算得分
        weight = GameConfig.SCORE_WEIGHTS[grade]
        score = self._score_unit * weight

        # 更新连击
        if grade != 'miss':
            self.state.combo += 1
            self.state.max_combo = max(self.state.max_combo, self.state.combo)
        else:
            self.state.combo = 0

        # 连击加成
        combo_bonus = 1.0
        for threshold, bonus in sorted(GameConfig.COMBO_BONUS.items(), reverse=True):
            if self.state.combo >= threshold:
                combo_bonus = bonus
                break

        final_score = score * combo_bonus
        self.state.total_score += final_score

        # 更新统计
        if grade == 'perfect':
            self.state.perfect_count += 1
        elif grade == 'great':
            self.state.great_count += 1
        elif grade == 'good':
            self.state.good_count += 1
        else:
            self.state.miss_count += 1

        # 创建结果
        result = JudgeResult(
            keyframe_idx=current_kf_idx,
            keyframe_name=current_kf.name,
            grade=grade,
            score=score,
            angle_diff=avg_diff,
            combo=self.state.combo,
            combo_bonus=combo_bonus,
            total_score=final_score
        )

        self.state.judge_results.append(result)
        self.state.last_judge = result
        self.state.last_judge_time = time.time()
        self.state.current_keyframe_idx = current_kf_idx + 1
        self.judged_keyframes.add(current_kf_idx)

        # 控制台输出
        self._print_judge_result(result, avg_diff)

        return result

    def _print_judge_result(self, result: JudgeResult, angle_diff: float):
        """打印判定结果到控制台"""
        grade_display = {
            'perfect': '★ PERFECT ★',
            'great': '☆ GREAT ☆',
            'good': 'GOOD',
            'miss': 'MISS'
        }

        combo_str = f"Combo: {result.combo}x" if result.combo > 1 else ""
        bonus_str = f"(+{int((result.combo_bonus - 1) * 100)}%)" if result.combo_bonus > 1 else ""

        print(f"\n┌{'─' * 50}┐")
        print(f"│ 关键帧 [{result.keyframe_idx + 1}]: {result.keyframe_name:<20}│")
        print(f"├{'─' * 50}┤")
        print(f"│ 判定等级: {grade_display[result.grade]:<30}│")
        print(f"│ 角度偏差: {angle_diff:.1f}°{' ' * 35}│")
        print(f"│ 本次得分: +{result.total_score:.2f} {combo_str} {bonus_str:<15}│")
        print(f"│ 累计得分: {self.state.total_score:.2f} / 100{' ' * 23}│")
        print(f"└{'─' * 50}┘")

    def _record_miss(self, idx: int, kf: KeyFrame):
        """记录错过的关键帧"""
        if idx in self.judged_keyframes:
            return

        self.state.combo = 0
        self.state.miss_count += 1

        result = JudgeResult(
            keyframe_idx=idx,
            keyframe_name=kf.name,
            grade='miss',
            score=0,
            angle_diff=999,
            combo=0,
            combo_bonus=1.0,
            total_score=0
        )

        self.state.judge_results.append(result)
        self.state.last_judge = result
        self.state.last_judge_time = time.time()
        self.judged_keyframes.add(idx)

        # 控制台输出 Miss
        print(f"\n┌{'─' * 50}┐")
        print(f"│ 关键帧 [{idx + 1}]: {kf.name:<20} │")
        print(f"├{'─' * 50}┤")
        print(f"│ 判定等级: MISS (错过了！)                        │")
        print(f"│ 连击中断！                                       │")
        print(f"│ 累计得分: {self.state.total_score:.2f} / 100                      │")
        print(f"└{'─' * 50}┘")

    def get_final_score(self) -> float:
        """获取最终得分"""
        return min(100, self.state.total_score)

    def get_progress(self) -> Tuple[int, int]:
        """获取进度"""
        return len(self.judged_keyframes), self.total_keyframes

    def print_final_result(self):
        """打印最终结果到控制台"""
        final_score = self.get_final_score()

        # 评级
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

        print(f"\n{'=' * 60}")
        print(f"                    最终成绩")
        print(f"{'=' * 60}")
        print(f"")
        print(f"                评级:  【 {grade} 】")
        print(f"")
        print(f"              得分: {final_score:.1f} / 100")
        print(f"")
        print(f"{'─' * 60}")
        print(f"  Perfect: {self.state.perfect_count:3d}    Great: {self.state.great_count:3d}")
        print(f"  Good:    {self.state.good_count:3d}    Miss:  {self.state.miss_count:3d}")
        print(f"{'─' * 60}")
        print(f"  最高连击: {self.state.max_combo}x")
        print(f"{'=' * 60}")
