# utils/security.py
"""
安全工具模块：仅包含密码哈希、密码验证核心功能
彻底解决 bcrypt 72字节限制 + 版本兼容性问题
"""
import bcrypt  # 直接使用原生bcrypt，绕过passlib的版本兼容问题

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证明文密码是否匹配哈希密码
    :param plain_password: 明文密码
    :param hashed_password: 数据库存储的哈希密码（bytes/str均可）
    :return: 匹配返回True，否则False
    """
    # 1. 处理多字节字符，转为UTF-8字节并截断到72字节
    plain_bytes = plain_password.encode('utf-8')[:72]
    # 2. 哈希密码转bytes（兼容字符串格式）
    hashed_bytes = hashed_password.encode('utf-8') if isinstance(hashed_password, str) else hashed_password
    # 3. 原生bcrypt验证
    try:
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """
    生成密码的bcrypt哈希值（返回字符串格式，便于存储）
    :param password: 明文密码
    :return: 哈希密码字符串（含盐值）
    """
    # 1. 处理多字节字符，转为UTF-8字节并强制截断到72字节
    password_bytes = password.encode('utf-8')[:72]
    # 2. 生成盐值（推荐rounds=12，平衡安全与性能）
    salt = bcrypt.gensalt(rounds=12)
    # 3. 生成哈希（原生bcrypt自动处理，无版本兼容问题）
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    # 4. 转为字符串返回（便于数据库存储）
    return hashed_bytes.decode('utf-8')