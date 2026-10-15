# template_manager.py - 模板管理器（支持多模板）

import cv2
import os
import pickle
import json
from typing import List, Optional

from config import GameConfig  # ⬅️ 修改：Config → GameConfig
from data_structures import KeyFrame
from pose_extractor import PoseExtractor
from keyframe_detector import KeyFrameDetector


class TemplateManager:
    """模板管理 - 支持多模板"""

    def __init__(self, template_dir: str = None):
        self.template_dir = template_dir or GameConfig.TEMPLATE_DIR  # ⬅️ 修改
        os.makedirs(self.template_dir, exist_ok=True)
        self.extractor = PoseExtractor()
        self.detector = KeyFrameDetector(
            min_interval=GameConfig.MIN_KEYFRAME_INTERVAL,  # ⬅️ 修改
            threshold=GameConfig.MOTION_THRESHOLD  # ⬅️ 修改
        )

    def list_templates(self) -> List[dict]:
        """
        列出所有可用模板
        返回: [{'name': 'xxx', 'path': 'xxx.pkl', 'info': {...}}, ...]
        """
        templates = []

        for filename in os.listdir(self.template_dir):
            if filename.endswith('.pkl'):
                name = filename[:-4]  # 去掉.pkl
                info_path = os.path.join(self.template_dir, f"{name}_info.json")

                info = {}
                if os.path.exists(info_path):
                    try:
                        with open(info_path, 'r', encoding='utf-8') as f:
                            info = json.load(f)
                    except:
                        pass

                templates.append({
                    'name': name,
                    'path': os.path.join(self.template_dir, filename),
                    'info': info
                })

        return templates

    def print_template_list(self) -> List[dict]:
        """打印模板列表并返回"""
        templates = self.list_templates()

        if not templates:
            print("  暂无模板")
            return []

        print("\n可用模板列表:")
        print("-" * 50)
        for i, tpl in enumerate(templates):
            info = tpl['info']
            duration = info.get('duration', 0)
            kf_count = info.get('keyframe_count', 0)
            print(f"  [{i + 1}] {tpl['name']}")
            print(f"      时长: {duration:.1f}秒 | 关键帧: {kf_count}个")
        print("-" * 50)

        return templates

    def select_template(self) -> Optional[str]:
        """交互式选择模板"""
        templates = self.print_template_list()

        if not templates:
            return None

        while True:
            choice = input(f"请选择模板 (1-{len(templates)}, 或输入q取消): ").strip()

            if choice.lower() == 'q':
                return None

            try:
                idx = int(choice) - 1
                if 0 <= idx < len(templates):
                    return templates[idx]['name']
                else:
                    print("无效选择，请重试")
            except ValueError:
                print("请输入数字")

    def create_from_video(self, video_path: str, name: str,
                          custom_keyframe_names: List[str] = None) -> dict:
        """从视频创建模板"""
        print(f"\n{'=' * 60}")
        print(f"创建模板: {name}")
        print(f"视频: {video_path}")
        print('=' * 60)

        if not os.path.exists(video_path):
            raise FileNotFoundError(f"视频不存在: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"无法打开: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps

        print(f"视频信息: {total_frames}帧, {fps:.1f}FPS, {duration:.1f}秒")

        # 提取每帧数据
        print("\n[1/3] 提取每帧姿态数据...")
        all_landmarks = []
        all_angles = []

        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            result = self.extractor.extract(frame)

            if result is not None:
                landmarks, angles = result
                all_landmarks.append(landmarks)
                all_angles.append(angles)
            else:
                if all_landmarks:
                    all_landmarks.append(all_landmarks[-1])
                    all_angles.append(all_angles[-1])
                else:
                    all_landmarks.append(None)
                    all_angles.append({})

            frame_idx += 1
            if frame_idx % 30 == 0:
                print(f"  进度: {frame_idx}/{total_frames} ({frame_idx / total_frames * 100:.0f}%)")

        cap.release()

        # 检测关键帧
        print("\n[2/3] 检测关键帧...")
        keyframe_indices = self.detector.detect(all_angles, fps)

        if custom_keyframe_names and len(custom_keyframe_names) == len(keyframe_indices):
            keyframe_names = custom_keyframe_names
        else:
            keyframe_names = self.detector.auto_name_keyframes(keyframe_indices, total_frames)

        keyframes = []
        for i, idx in enumerate(keyframe_indices):
            if all_landmarks[idx] is not None:
                kf = KeyFrame(
                    frame_idx=idx,
                    timestamp=idx / fps,
                    name=keyframe_names[i],
                    landmarks=all_landmarks[idx],
                    angles=all_angles[idx],
                    motion_score=0.0,
                    description=f"第{i + 1}个关键帧"
                )
                keyframes.append(kf)

        print(f"  检测到 {len(keyframes)} 个关键帧:")
        for i, kf in enumerate(keyframes):
            print(f"    [{i + 1}] {kf.name} @ {kf.timestamp:.2f}s")

        # 保存模板
        print("\n[3/3] 保存模板...")
        template_data = {
            'name': name,
            'video_path': video_path,
            'fps': fps,
            'total_frames': total_frames,
            'duration': duration,
            'all_landmarks': all_landmarks,
            'all_angles': all_angles,
            'keyframes': keyframes,
            'keyframe_count': len(keyframes),
        }

        path = os.path.join(self.template_dir, f"{name}.pkl")
        with open(path, 'wb') as f:
            pickle.dump(template_data, f)

        # JSON 信息
        json_data = {
            'name': name,
            'video_path': video_path,
            'fps': fps,
            'total_frames': total_frames,
            'duration': duration,
            'keyframe_count': len(keyframes),
            'keyframes': [
                {
                    'index': kf.frame_idx,
                    'timestamp': round(kf.timestamp, 2),
                    'name': kf.name,
                }
                for kf in keyframes
            ]
        }

        json_path = os.path.join(self.template_dir, f"{name}_info.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)

        print(f"\n✓ 模板已保存: {path}")
        return template_data

    def load(self, name: str) -> dict:
        """加载模板"""
        path = os.path.join(self.template_dir, f"{name}.pkl")
        if not os.path.exists(path):
            raise FileNotFoundError(f"模板不存在: {path}")

        with open(path, 'rb') as f:
            return pickle.load(f)

    def exists(self, name: str) -> bool:
        """检查模板是否存在"""
        return os.path.exists(os.path.join(self.template_dir, f"{name}.pkl"))

    def delete(self, name: str) -> bool:
        """删除模板"""
        pkl_path = os.path.join(self.template_dir, f"{name}.pkl")
        json_path = os.path.join(self.template_dir, f"{name}_info.json")

        deleted = False
        if os.path.exists(pkl_path):
            os.remove(pkl_path)
            deleted = True
        if os.path.exists(json_path):
            os.remove(json_path)

        return deleted

    def close(self):
        self.extractor.close()
