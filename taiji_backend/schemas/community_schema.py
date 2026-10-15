from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


# =======================================================
# Pydantic Schemas for Community Posts
# =======================================================

# 1. 帖子创建/更新请求体
class CommunityPostCreate(BaseModel):
    """用于创建新帖子的请求体"""
    title: str = Field(..., max_length=200, description="帖子标题")
    content: str = Field(..., description="帖子内容")
    # 可选：如果前端允许上传图片
    image_url: Optional[str] = Field(None, description="配图的云存储 URL")


# 2. 帖子响应体（包含作者信息）
class CommunityPostRead(BaseModel):
    """用于返回给前端的帖子详情"""
    id: int
    title: str
    content: str
    image_url: Optional[str]
    created_at: datetime
    likes_count: int
    comments_count: int
    status: str

    # 🚀 关键修复：新增 is_liked_by_me 字段，用于前端同步更新点赞状态和数量
    is_liked_by_me: bool = Field(False, description="当前登录用户是否已点赞")

    # 额外包含的作者信息，用于前端展示
    author_id: int
    author_username: str  # 从 DBUser 中获取的用户名

    class Config:
        # 允许 ORM 对象（例如 DBCommunityPost 实例）直接转换为 Pydantic 模型
        from_attributes = True

# 3. 帖子列表项响应体（与 Read 相同，或更精简）
# 在此例中，我们直接使用 CommunityPostRead