# models/record.py

from sqlalchemy import Column, Integer, String, Text, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base # 导入 Base
from .user import DBUser # 导入 DBUser
from .content import DBStandardForm # 导入 DBStandardForm

# ----------------------------------------------------
# 5. assessment_records 表 (学习记录)
# ----------------------------------------------------
class DBAssessmentRecord(Base):
    __tablename__ = "assessment_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    form_id = Column(Integer, ForeignKey("standard_forms.id"), nullable=False)

    score = Column(DECIMAL(5, 2), nullable=False)
    time_spent_seconds = Column(Integer, nullable=False)
    diagnosis_report_json = Column(Text, nullable=False)
    video_url = Column(String(255), nullable=True)
    recorded_at = Column(DateTime, default=datetime.now, nullable=False)

    # 关系定义
    user = relationship("DBUser", back_populates="assessments")
    form = relationship("DBStandardForm", back_populates="assessments")

# ⚠️ DBCommunityPost 模型已移除。