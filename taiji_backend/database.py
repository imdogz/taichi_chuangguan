# database.py - SQLite 同步配置

from sqlalchemy.orm import declarative_base, Session, sessionmaker
from sqlalchemy import create_engine, text
from typing import Generator
from sqlalchemy.engine import Engine
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent

# =======================================================
# 📌 SQLite 数据库配置
# =======================================================
SQLALCHEMY_DATABASE_URL = f"sqlite:///{(BASE_DIR / 'taiji.db').as_posix()}"

# 备用：如需切回 SQL Server，可使用以下配置（需下载odbc driver17）：
# DB_HOST = "localhost"                   # 服务器名称
# DB_NAME = "TaijiPlatformDB"             # 数据库名
# DRIVER = "ODBC+Driver+17+for+SQL+Server"
# SQLALCHEMY_DATABASE_URL = (
#     f"mssql+pyodbc://@{DB_HOST}/{DB_NAME}"
#     f"?driver={DRIVER}"
#     f"&Trusted_Connection=yes"
# )
# =======================================================


# 1. 声明 ORM 基类
Base = declarative_base()


# 2. 创建同步数据库引擎
engine: Engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite 在多线程环境下需要此参数
    echo=True  # 开启 SQL 日志，方便调试
)


# 3. 创建 SessionLocal 类
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# 4. 数据库会话生成器 (Dependency)
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI 依赖项：创建一个新的数据库会话并在请求完成后关闭它。
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 5. 测试连接（可选）
def test_connection():
    """测试数据库连接"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("[OK] 数据库连接成功！")
            return True
    except Exception as e:
        print(f"[ERROR] 数据库连接失败：{e}")
        return False


if __name__ == "__main__":
    test_connection()
