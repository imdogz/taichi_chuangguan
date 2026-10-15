# routers/ai_router.py - AI 问答助手的 API 路由

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any

# 导入 AI 服务逻辑
from services.ai_service import generate_ai_reply

# ----------------------------------------------------
# 1. 路由器实例化
# ----------------------------------------------------
router = APIRouter(
    prefix="/ai",
    tags=["AI 问答助手"]
)


# ----------------------------------------------------
# 2. Pydantic 模型 (请求/响应)
# ----------------------------------------------------
# 使用 PascalCase 命名 Pydantic 模型

class HistoryMessage(BaseModel):
    role: str = Field(..., description="消息角色: user, assistant 或 system")
    content: str = Field(..., description="消息内容")


class ChatRequest(BaseModel):
    message: str = Field(..., description="当前用户输入的消息")
    history: List[HistoryMessage] = Field(default_factory=list, description="历史对话记录列表")


class ChatResponse(BaseModel):
    reply: str = Field(..., description="AI 助手的回复内容")


# ----------------------------------------------------
# 3. 路由函数 (原 /api/chat 接口)
# ----------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
def chat_assistant(request_data: ChatRequest):
    """
    【AI 问答助手】接口：接收用户消息和历史记录，并返回 AI 回复。
    访问路径为 POST /api/ai/chat
    """
    if not request_data.message:
        # 对应 Flask 400 错误处理
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="message 字段不能为空"
        )

    # 将 Pydantic 历史记录模型转换为服务函数所需的 dict 列表格式
    history_list = [h.model_dump() for h in request_data.history]

    try:
        # 调用核心服务逻辑
        reply = generate_ai_reply(request_data.message, history=history_list)
        return ChatResponse(reply=reply)

    except RuntimeError as e:
        # AI 客户端未初始化错误
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        # 其他 API 或网络错误
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI 服务调用失败: {e}"
        )