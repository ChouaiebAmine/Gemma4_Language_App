from fastapi import APIRouter
from typing import List

from agents.topic_generator.agent import root_agent as topic_generator_agent
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

import json


session_service = InMemorySessionService()
APP_NAME = "Language Learning App"
USER_ID = "user"

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/")
async def get_topics():
    """Generate 3 topics."""

    session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID,
        state={
            "user_language": "english",
            "target_language": "arabic",
    })

    runner = Runner(app_name=APP_NAME, agent=topic_generator_agent, session_service=session_service)

    content = types.Content(
        role="user",
        parts=[types.Part(text="start")]
    )

    events = runner.run(user_id=USER_ID, session_id=session.id, new_message=content)
    for event in events:
        if event.is_final_response():
            final_response = json.loads(event.content.parts[0].text)
            print(final_response)
            return final_response
            
    


@router.post("/")
async def create_topic(topic_data: dict):
    """Create a new topic"""
    return {"message": "Topic created", "data": topic_data}