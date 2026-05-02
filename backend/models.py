from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class TopicModel(BaseModel):
    topics_base: List[str]
    topics_target: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ActivityModel(BaseModel):
    type: str  # 'listening' or 'writing'
    level: str = "A1"
    difficulty: int
    content: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_language: str
    target_language: str
    topic: str

class EvaluationModel(BaseModel):
    user_id: str
    type: str  # 'listening'
    difficulty: int
    user_input: str
    reference: str
    result: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LanguageEnrollmentModel(BaseModel):
    code: str
    started_at: datetime = Field(default_factory=datetime.utcnow)

class AchievementSubmitModel(BaseModel):
    user_id: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)