# routers/user_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional
from pydantic import BaseModel, Field
# 导入 Schema，确保包含新添加的 UsernameUpdate
from schemas.user_schema import UserCreate, UserResponse, Token, UsernameUpdate
from config import ACCESS_TOKEN_EXPIRE_MINUTES
from sqlalchemy import func
from models.community import DBCommunityPost
# 导入内部依赖
from dependencies import create_access_token, get_current_user
from database import get_db
from models.user import DBUser
from schemas.user_schema import UserCreate, UserResponse, Token
from config import ACCESS_TOKEN_EXPIRE_MINUTES

# 🚀 关键：使用 security.py 中定义的更安全的密码工具
from utils.security import verify_password, get_password_hash

router = APIRouter()


# --- 新增：修改密码需要的请求模型 ---
class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)


# ----------------------------------------------------
# 1. 用户注册
# ----------------------------------------------------
@router.post("/register", response_model=UserResponse, tags=["User Auth"])
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # 检查用户名是否已存在
    existing_user = db.query(DBUser).filter(DBUser.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已被注册"
        )

    # 创建新用户
    new_user = DBUser(
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),  # 哈希处理
        email=user_data.email,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ----------------------------------------------------
# 2. 用户登录 (获取 Token)
# ----------------------------------------------------
@router.post("/token", response_model=Token, tags=["User Auth"])
def login_for_access_token(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
):
    # 查询用户
    user = db.query(DBUser).filter(DBUser.username == form_data.username).first()

    # 验证用户是否存在以及密码是否匹配
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 创建 Token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


# ----------------------------------------------------
# 3. 获取当前用户信息
# ----------------------------------------------------
@router.get("/me", response_model=UserResponse, tags=["User Auth"])
def read_users_me(current_user: DBUser = Depends(get_current_user)):
    """获取当前已登录的用户信息"""
    return current_user


# ----------------------------------------------------
# 4. 修改密码 (🚀 新增功能)
# ----------------------------------------------------
@router.post("/change-password", tags=["User Profile"])
def change_password(
        data: PasswordUpdate,
        db: Session = Depends(get_db),
        current_user: DBUser = Depends(get_current_user)
):
    """
    修改密码流程：
    1. 验证旧密码是否正确
    2. 哈希新密码并存入数据库
    """
    # 1. 验证旧密码
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="旧密码验证失败，请重新输入"
        )

    # 2. 检查新旧密码是否相同（可选的安全建议）
    if data.old_password == data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新密码不能与旧密码相同"
        )

    # 3. 更新密码
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()

    return {"message": "密码修改成功，请使用新密码重新登录"}

# ----------------------------------------------------
# 5. 修改用户名 (🚀 新增功能)
# ----------------------------------------------------
@router.post("/update-username", tags=["User Profile"])
def update_username(
    data: UsernameUpdate,
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    """
    修改用户名流程：
    1. 检查新用户名是否与当前用户名相同
    2. 检查新用户名是否已被他人占用
    3. 更新数据库并刷新对象
    """
    # 1. 检查是否与旧名称相同
    if data.new_username == current_user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新用户名不能与当前用户名相同"
        )

    # 2. 检查数据库唯一性冲突
    existing_user = db.query(DBUser).filter(DBUser.username == data.new_username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该用户名已被占用"
        )

    # 3. 执行更新
    current_user.username = data.new_username
    db.commit()
    db.refresh(current_user)

    return {
        "message": "用户名修改成功",
        "new_username": current_user.username
    }

# ----------------------------------------------------
# 6. 获取用户统计数据 (🚀 新增功能)
# ----------------------------------------------------
@router.get("/stats", tags=["User Profile"])
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: DBUser = Depends(get_current_user)
):
    """
    获取当前用户的社区统计数据：
    - 发帖数量
    - 获赞总数（所有帖子的点赞数累加）
    """
    # 1. 查询发帖数量
    post_count = db.query(func.count(DBCommunityPost.id)).filter(
        DBCommunityPost.author_id == current_user.id,
        DBCommunityPost.status == 'published'
    ).scalar() or 0

    # 2. 查询获赞总数（累加所有帖子的 likes_count）
    total_likes = db.query(func.sum(DBCommunityPost.likes_count)).filter(
        DBCommunityPost.author_id == current_user.id,
        DBCommunityPost.status == 'published'
    ).scalar() or 0

    return {
        "post_count": post_count,
        "total_likes": total_likes
    }

