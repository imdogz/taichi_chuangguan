# schemas/user_schema.py

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# 1. 用户注册请求体
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)  # 密码至少6位
    email: Optional[EmailStr] = None  # 可选邮箱（使用EmailStr验证格式）

# 2. 用户信息响应体（用于返回用户公开信息，不含密码）
class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[EmailStr] = None
    is_active: bool = True  # 默认用户是激活状态
    created_at: Optional[datetime] = None  # 注册时间

    class Config:
        from_attributes = True  # 允许从ORM模型转换

# 3. Token 响应体 (登录成功后返回)
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

# 4. Token 内部数据 (JWT payload)
class TokenData(BaseModel):
    user_id: Optional[int] = None

# 5. 用户资料更新请求体（可选）
class UserProfileUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    # 可根据需要添加其他字段（如头像、简介等）

# ✨ 新增：修改用户名请求模型
class UsernameUpdate(BaseModel):
    new_username: str = Field(..., min_length=3, max_length=50)