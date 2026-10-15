# models/user.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base  # 导入 Base


# 确保在实际项目中导入了 record 和 community 中的模型，例如：
# from .record import DBAssessmentRecord
# from .community import DBCommunityPost, PostLike, Comment

# ----------------------------------------------------
# 1. users 表 (用户认证)
# ----------------------------------------------------
class DBUser(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    role = Column(String(20), default="casual_user", nullable=False)
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    # 关系定义：用户有一份档案
    profile = relationship("DBUserProfile", back_populates="user", uselist=False)

    # 关系定义：用户有多条学习记录 (DBAssessmentRecord 定义在 record.py)
    assessments = relationship("DBAssessmentRecord", back_populates="user")

    # 关系定义：用户有多篇社区帖子 (DBCommunityPost 定义在 community.py)
    posts = relationship("DBCommunityPost", back_populates="author")

    # 🆕 新增关系：用户点赞记录 (PostLike 定义在 community.py)
    likes = relationship("PostLike", back_populates="user")

    # 🆕 新增关系：用户评论记录 (Comment 定义在 community.py)
    comments = relationship("Comment", back_populates="user")


# ----------------------------------------------------
# 2. user_profiles 表 (用户档案/个人资料)
# ----------------------------------------------------\
class DBUserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    full_name = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    gender = Column(String(10), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    profile_picture_url = Column(String(255), nullable=True)
    location = Column(String(100), nullable=True)

    # 关系定义
    user = relationship("DBUser", back_populates="profile")