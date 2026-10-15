# routers/record_router.py - 学习记录相关的 API 路由

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional  # 保留 Optional 导入

# 导入数据库会话依赖和模型
from database import get_db
from models.record import DBAssessmentRecord
from models.user import DBUser

# 🚀 导入 JWT 认证依赖项
from dependencies import get_current_user

# ----------------------------------------------------
# 1. 路由器实例化
# ----------------------------------------------------
router = APIRouter(
    tags=["游戏闯关/记录"],
    prefix="/records"
)


# ----------------------------------------------------
# 2. Pydantic 模型：请求体
# ----------------------------------------------------
class AssessmentCreate(BaseModel):
    """用于接收客户端提交的闯关数据。user_id 将从 JWT 中获取。"""
    form_id: int = Field(..., ge=1, description="完成的套路/关卡 ID")
    score: float = Field(..., ge=0.0, le=100.0, description="闯关得分 (0-100)")
    time_spent_seconds: int = Field(..., ge=0, description="耗时（秒）")
    diagnosis_report_json: str = Field(..., description="详细诊断报告 (JSON 字符串)")
    video_url: str | None = Field(None, description="用户练习视频的云存储 URL")


# ----------------------------------------------------
# 3. 路由：保存闯关记录 (POST /api/records/save)
# ----------------------------------------------------
@router.post("/save", status_code=status.HTTP_201_CREATED)
def save_assessment_record(
        # 1. 【非默认形参/请求体】: 必须放在最前面
        record_data: AssessmentCreate,

        # 2. 【默认形参/依赖项】: 放在请求体后面
        current_user: DBUser = Depends(get_current_user),
        db: Session = Depends(get_db)  # 显式写法
):
    """【保存闯关记录】接口：现在需要 JWT 认证。"""

    # 1. 创建新的 DBAssessmentRecord 对象
    new_record = DBAssessmentRecord(
        user_id=current_user.id,  # 从认证用户获取 ID
        form_id=record_data.form_id,
        score=record_data.score,
        time_spent_seconds=record_data.time_spent_seconds,
        diagnosis_report_json=record_data.diagnosis_report_json,
        video_url=record_data.video_url,
        recorded_at=datetime.now()
    )

    try:
        # 2. 保存到数据库
        db.add(new_record)
        db.commit()

        return {"message": "闯关记录保存成功", "record_id": new_record.id}
    except Exception as e:
        db.rollback()
        print(f"Error saving assessment record: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="保存记录失败，请稍后再试。"
        )