# models/content.py

from sqlalchemy import Column, Integer, String, Text, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base  # 导入 Base


# 注意: MySQL 8+ 支持原生的 JSON 类型, 低版本使用 Text

# ----------------------------------------------------
# 3. standard_forms 表 (标准套路/内容资源)
# ----------------------------------------------------
class DBStandardForm(Base):
    __tablename__ = "standard_forms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    style = Column(String(50), nullable=True)
    difficulty_level = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    # 专家教学视频的云存储 URL
    teaching_video_url = Column(String(255), nullable=False)

    # CV 比对标准：骨骼点坐标、关节角度数据 (JSON 格式存储在 TEXT/VARCHAR 中)
    standard_keypoints_json = Column(Text, nullable=False)
    # 太极气息节奏：动作与呼吸的同步节奏数据 (JSON 格式存储)
    rhythm_times_json = Column(Text, nullable=True)
    # 评分权重 (JSON 格式存储)
    weight_matrix_json = Column(Text, nullable=True)

    # 关系定义：一个套路可以有多条学习记录
    assessments = relationship("DBAssessmentRecord", back_populates="form")
    # 关系定义：一个套路可以关联多个知识点
    knowledge_points = relationship("DBKnowledgePoint", back_populates="related_form")


# ----------------------------------------------------
# 4. knowledge_points 表 (太极知识点/问答库)
# ----------------------------------------------------
class DBKnowledgePoint(Base):
    __tablename__ = "knowledge_points"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    category = Column(String(50), nullable=True)
    content = Column(Text, nullable=False)
    # 图片示例的云存储 URL
    illustration_image_url = Column(String(255), nullable=True)
    # 短视频示例的云存储 URL
    demonstration_video_url = Column(String(255), nullable=True)
    source = Column(String(100), nullable=True)

    # 关联标准套路 (可空)
    related_form_id = Column(Integer, ForeignKey("standard_forms.id"), nullable=True)

    # 关系定义
    related_form = relationship("DBStandardForm", back_populates="knowledge_points")