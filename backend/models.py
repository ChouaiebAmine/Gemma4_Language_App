from pydantic import BaseModel,Field
from typing import List, Optional,Dict,Any

from datetime import datetime

class TopicModel(BaseModel):
    topics_base : List[str]
    topics_target: List[str]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ActivityModel(BaseModel):
    type : str #Listening or writing
    difficulty: int
    level: str
    content: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
class EvaluationModel(BaseModel):
    type : str
    difficulty: int
    user_input: str
    reference: str
    result: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)