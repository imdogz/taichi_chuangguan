# routers/community_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 导入依赖和模型
from dependencies import get_current_user, get_db, get_current_user_optional
from models.community import DBCommunityPost, PostLike, Comment
from models.user import DBUser


# ----------------------------------------------------
# 1. Pydantic 模式定义 (Schema)
# ----------------------------------------------------

class UserBase(BaseModel):
    id: int
    username: str

    class Config:
        from_attributes = True


class PostCreate(BaseModel):
    title: str = Field(..., max_length=200)
    content: str
    image_url: Optional[str] = None


class CommentCreate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    content: str
    author_username: str  # 扁平化处理
    author_id: int  # 🚀 新增：返回作者ID，方便前端判断是否显示删除按钮
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


class CommunityPostRead(BaseModel):
    id: int
    title: str
    content: str
    image_url: Optional[str]
    created_at: datetime
    likes_count: int
    comments_count: int
    status: str
    author_username: str = ""
    author_id: int = 0  # 🚀 新增：返回作者ID
    is_liked_by_me: bool = False

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda dt: dt.isoformat()}


# ----------------------------------------------------
# 2. 路由实例化
# ----------------------------------------------------
community_router = APIRouter(
    prefix="/community",
    tags=["社区动态"]
)


# ----------------------------------------------------
# 3. 获取所有帖子
# ----------------------------------------------------
@community_router.get("/posts", response_model=List[CommunityPostRead])
def get_all_posts(
        db: Session = Depends(get_db),
        current_user: Optional[DBUser] = Depends(get_current_user_optional)
):
    posts = (
        db.query(DBCommunityPost)
        .options(joinedload(DBCommunityPost.author), joinedload(DBCommunityPost.likes))
        .filter(DBCommunityPost.status == 'published')
        .order_by(DBCommunityPost.created_at.desc())
        .all()
    )

    results = []
    user_id = current_user.id if current_user else None

    for post in posts:
        p_read = CommunityPostRead.model_validate(post)
        p_read.author_username = post.author.username if post.author else "未知用户"
        p_read.author_id = post.author_id  # 填充作者ID

        if user_id:
            p_read.is_liked_by_me = any(like.user_id == user_id for like in post.likes)

        results.append(p_read)

    return results


# ----------------------------------------------------
# 4. 发布新帖子
# ----------------------------------------------------
@community_router.post("/posts", response_model=CommunityPostRead)
def create_post(
        post_data: PostCreate,
        db: Session = Depends(get_db),
        current_user: DBUser = Depends(get_current_user)
):
    try:
        new_post = DBCommunityPost(
            author_id=current_user.id,
            title=post_data.title,
            content=post_data.content,
            image_url=post_data.image_url,
            likes_count=0,
            comments_count=0,
            status='published',
            created_at=datetime.now()
        )
        db.add(new_post)
        db.commit()
        db.refresh(new_post)

        res = CommunityPostRead.model_validate(new_post)
        res.author_username = current_user.username
        res.author_id = current_user.id
        return res
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="发布失败")


# 🚀 ----------------------------------------------------
# 5. 删除帖子 (所有权校验)
# ----------------------------------------------------
@community_router.delete("/posts/{post_id}")
def delete_post(
        post_id: int,
        db: Session = Depends(get_db),
        current_user: DBUser = Depends(get_current_user)
):
    post = db.query(DBCommunityPost).filter(DBCommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")

    # 核心校验：判断当前用户是否为作者
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="你没有权限删除他人的帖子")

    try:
        # 删除相关的点赞和评论（如果数据库没设级联删除的话建议手动删或设好外键级联）
        db.query(PostLike).filter(PostLike.post_id == post_id).delete()
        db.query(Comment).filter(Comment.post_id == post_id).delete()

        db.delete(post)
        db.commit()
        return {"message": "帖子删除成功"}
    except Exception as e:
        db.rollback()
        logger.error(f"删除帖子失败: {str(e)}")
        raise HTTPException(status_code=500, detail="删除失败")


# ----------------------------------------------------
# 6. 点赞/取消点赞
# ----------------------------------------------------
@community_router.post("/posts/{post_id}/like")
def toggle_like(
        post_id: int,
        db: Session = Depends(get_db),
        current_user: DBUser = Depends(get_current_user)
):
    post = db.query(DBCommunityPost).filter(DBCommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子未找到")

    like_record = db.query(PostLike).filter(
        PostLike.post_id == post_id,
        PostLike.user_id == current_user.id
    ).first()

    if like_record:
        db.delete(like_record)
        post.likes_count = max(0, post.likes_count - 1)
        action = "unliked"
    else:
        new_like = PostLike(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        post.likes_count += 1
        action = "liked"

    db.commit()
    return {"action": action, "likes_count": post.likes_count}


# ----------------------------------------------------
# 7. 获取帖子评论列表
# ----------------------------------------------------
@community_router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
def get_post_comments(post_id: int, db: Session = Depends(get_db)):
    comments = (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .all()
    )

    return [
        CommentResponse(
            id=c.id,
            content=c.content,
            author_username=c.user.username if c.user else "未知用户",
            author_id=c.user_id,  # 返回评论者ID
            created_at=c.created_at
        ) for c in comments
    ]


# ----------------------------------------------------
# 8. 发布评论
# ----------------------------------------------------
@community_router.post("/posts/{post_id}/comments", response_model=CommentResponse)
def create_comment(
        post_id: int,
        comment_data: CommentCreate,
        db: Session = Depends(get_db),
        current_user: DBUser = Depends(get_current_user)
):
    post = db.query(DBCommunityPost).filter(DBCommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="帖子不存在")

    try:
        new_c = Comment(
            post_id=post_id,
            user_id=current_user.id,
            content=comment_data.content,
            created_at=datetime.now()
        )
        db.add(new_c)
        post.comments_count += 1
        db.commit()
        db.refresh(new_c)

        return CommentResponse(
            id=new_c.id,
            content=new_c.content,
            author_username=current_user.username,
            author_id=current_user.id,
            created_at=new_c.created_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="评论失败")


# 🚀 ----------------------------------------------------
# 9. 删除评论 (所有权校验)
# ----------------------------------------------------
@community_router.delete("/comments/{comment_id}")
def delete_comment(
        comment_id: int,
        db: Session = Depends(get_db),
        current_user: DBUser = Depends(get_current_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="评论不存在")

    # 核心校验：判断当前用户是否为评论作者
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="你没有权限删除他人的评论")

    try:
        # 同时减少帖子的评论计数
        post = db.query(DBCommunityPost).filter(DBCommunityPost.id == comment.post_id).first()
        if post:
            post.comments_count = max(0, post.comments_count - 1)

        db.delete(comment)
        db.commit()
        return {"message": "评论删除成功"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="删除失败")