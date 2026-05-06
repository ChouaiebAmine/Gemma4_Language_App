from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class TopicModel(BaseModel):
    topics_base: List[str]
    topics_target: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityModel(BaseModel):
    type: str  # 'listening', 'writing', or 'reading'
    level: str = "A1"
    difficulty: int  # 0=easy, 1=medium, 2=hard
    content: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_language: str
    target_language: str
    topic: str      # human-readable topic name used by the AI agent
    topic_id: str = ""  # DB id of the topic, used for filtering
    language_id: str = ""  # DB id of the language this activity belongs to


class EvaluationModel(BaseModel):
    user_id: str
    type: str       # 'listening', 'writing', or 'reading'
    difficulty: int  # 0=easy, 1=medium, 2=hard
    user_input: str
    reference: str  # activity _id this evaluation is for
    result: Dict[str, Any]
    status: str = "completed"   # 'completed' | 'skipped' | 'in_progress'
    language_id: str = ""       # language this evaluation belongs to
    topic_id: str = ""          # topic this evaluation belongs to
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LanguageEnrollmentModel(BaseModel):
    code: str
    started_at: datetime = Field(default_factory=datetime.utcnow)


class AchievementSubmitModel(BaseModel):
    user_id: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)