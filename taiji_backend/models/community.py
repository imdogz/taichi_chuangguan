# models/community.py

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
# 确保导入了 Base 和 DBUser
from database import Base
from .user import DBUser


# ----------------------------------------------------
# 6. community_posts 表 (社区帖子)
# ----------------------------------------------------
class DBCommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # ✅ 修复 1: status 字段（解决上上次的 IntegrityError）
    status = Column(String(50), nullable=False, default='published')

    # 🚀 关键修复：新增 likes_count 和 comments_count 字段
    # 解决本次 IntegrityError：确保 NOT NULL 字段有默认值
    likes_count = Column(Integer, default=0, nullable=False)
    comments_count = Column(Integer, default=0, nullable=False)

    # 关系定义
    author = relationship("DBUser", back_populates="posts")

    # 新增关系：帖子可以有多条点赞记录和多条评论记录
    likes = relationship("PostLike", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")


# ----------------------------------------------------
# 7. post_likes 表 (点赞关联表)
# ----------------------------------------------------
class PostLike(Base):
    __tablename__ = "post_likes"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系定义
    post = relationship("DBCommunityPost", back_populates="likes")
    user = relationship("DBUser")

    # 唯一约束：确保用户不能重复点赞
    __table_args__ = (UniqueConstraint('post_id', 'user_id', name='_user_post_uc'),)


# ----------------------------------------------------
# 8. comments 表 (评论表)
# ----------------------------------------------------
class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("community_posts.id"), index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 关系定义
    post = relationship("DBCommunityPost", back_populates="comments")
    user = relationship("DBUser")