from fastapi import APIRouter
from typing import List

from agents.topic_generator.agent import root_agent as topic_generator_agent
from agents.topic_generator.agent import Topics
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

import json
from uuid import uuid4
from database import topics_collection
from models import TopicModel
from datetime import datetime

session_service = InMemorySessionService()
APP_NAME = "Language Learning App"
USER_ID = "user"

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/")
async def get_topics():
    """Generate 3 topics."""

    session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=str(uuid4()),
        state={
            "user_language": "english",
            "target_language": "arabic",
    })

    runner = Runner(app_name=APP_NAME, agent=topic_generator_agent, session_service=session_service, auto_create_session=True)

    content = types.Content(
        role="user",
        parts=[types.Part(text="start")]
    )

    events = runner.run(user_id=USER_ID, session_id=session.id, new_message=content)
    for event in events:
        if event.is_final_response():
            text = event.content.parts[0].text
            topics_data = Topics.model_validate_json(text)
            
            # Save to MongoDB
            topic_doc = TopicModel(
                topics_base=topics_data.topics_base,
                topics_target=topics_data.topics_target
            ).model_dump()
            await topics_collection.insert_one(topic_doc)
            
            return topics_data
    return {}



@router.post("/")
async def create_topic(topic: TopicModel):
    new_topic = await topics_collection.insert_one(topic.model_dump())
    return {"id": str(new_topic.inserted_id)}
