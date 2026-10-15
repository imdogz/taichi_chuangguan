# dependencies.py

from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

# 导入数据库配置和模型
from database import get_db
from models.user import DBUser
# 确保您在 schemas/user_schema.py 中定义了 TokenData
from schemas.user_schema import TokenData

# ----------------------------------------------------
# 1. 配置常量 (建议统一放在 config.py)
# ----------------------------------------------------
# 注意：生产环境请务必从环境变量读取 SECRET_KEY
SECRET_KEY = "YOUR_SUPER_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 默认 7 天

# 尝试从 config 导入，如果失败则使用上面的默认值
try:
    from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
except ImportError:
    pass

# ----------------------------------------------------
# 2. OAuth2 方案定义
# ----------------------------------------------------

# 标准方案：如果 Token 不存在，会自动抛出 401
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/token")

# 可选方案：auto_error=False，允许请求不带 Token 也能通过
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/users/token", auto_error=False)


# ----------------------------------------------------
# 3. JWT 工具函数
# ----------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """创建加密的 JWT Token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ----------------------------------------------------
# 4. 强制认证：get_current_user
# ----------------------------------------------------

def get_current_user(
        db: Session = Depends(get_db),
        token: str = Depends(oauth2_scheme)
) -> DBUser:
    """
    强制认证依赖：
    用于发布帖子、点赞、评论等必须登录的操作。
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="凭证无效，请重新登录",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=int(user_id))
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(DBUser).filter(DBUser.id == token_data.user_id).first()
    if user is None:
        raise credentials_exception
    return user


# ----------------------------------------------------
# 5. 可选认证：get_current_user_optional
# ----------------------------------------------------

def get_current_user_optional(
        db: Session = Depends(get_db),
        token: Optional[str] = Depends(oauth2_scheme_optional)
) -> Optional[DBUser]:
    """
    可选认证依赖：
    用于获取帖子列表。如果用户登录了，返回用户对象；
    如果没登录，返回 None，不会报错。
    """
    if not token:
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None

        user = db.query(DBUser).filter(DBUser.id == int(user_id)).first()
        return user
    except (JWTError, ValueError):
        # Token 过期或格式错误也视作未登录
        return None