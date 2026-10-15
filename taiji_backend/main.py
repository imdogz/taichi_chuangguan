# main.py - FastAPI 应用入口文件

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import sys
from datetime import datetime

# ----------------------------------------------------
# 1. 导入数据库配置和表结构定义
# ----------------------------------------------------
from database import Base, engine

if "models" not in sys.modules:
    try:
        import models.user
        import models.content
        import models.record
        import models.community
    except ImportError as e:
        print(f"警告：无法导入模型文件。错误：{e}")


# ----------------------------------------------------
# 2. 定义启动时创建数据库表的函数
# ----------------------------------------------------
def create_db_tables():
    print(">>> 正在检查并创建数据库表结构...")
    Base.metadata.create_all(bind=engine)
    print(">>> 数据库表结构检查/创建完成。")


# ----------------------------------------------------
# 3. 应用程序实例化
# ----------------------------------------------------
app = FastAPI(
    title="太极智能平台 API",
    description="太极 AI 评测、社区交流及用户管理服务",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


# ----------------------------------------------------
# 4. 注册启动事件 (创建数据库表)
# ----------------------------------------------------
@app.on_event("startup")
def startup_event():
    create_db_tables()


# ----------------------------------------------------
# 5. 配置 CORS (跨域资源共享) - 简化版
# ----------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------
# 6. 挂载 API 路由 (Router)
# ----------------------------------------------------
# 用户路由
from routers import user_router
app.include_router(user_router.router, prefix="/api/users")

# AI 问答路由
from routers import ai_router
app.include_router(ai_router.router, prefix="/api")

# 记录路由
from routers import record_router
app.include_router(record_router.router, prefix="/api")

# 社区路由
from routers.community_router import community_router
app.include_router(community_router, prefix="/api")

# ⭐ 游戏路由（REST API + WebSocket）- 只导入一次！
from routers.game_router import router as game_router, ws_router as game_ws_router
app.include_router(game_router)       # REST API: /api/health, /api/levels 等
app.include_router(game_ws_router)    # WebSocket: /ws/game


# ----------------------------------------------------
# 7. 根路径测试
# ----------------------------------------------------
@app.get("/", tags=["系统"])
def read_root():
    return {
        "message": "太极智能平台 API 运行中",
        "time": datetime.now().isoformat(),
        "status": "OK"
    }


# ----------------------------------------------------
# 8. Uvicorn 运行入口
# ----------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
