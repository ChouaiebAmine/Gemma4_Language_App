from fastapi import APIRouter
from typing import List

from agents.topic_generator.agent import Topics
from agents.activities_generator.listening_agent import easy_listening_agent, EasyListening

from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

import json
from uuid import uuid4


session_service = InMemorySessionService()
APP_NAME = "Language Learning App"
USER_ID = "user"

router = APIRouter(prefix="/activities", tags=["activities"])




@router.post("/speaking")
async def generate_speaking_activity(difficulty: int):
    match difficulty:
        case 0:
            session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=str(uuid4()),
                state={
                    "topic": "Ordering at a restaurant",
                    "target_language": "spanish",
            })

            runner = Runner(app_name=APP_NAME, agent=easy_listening_agent, session_service=session_service, auto_create_session=True)

            content = types.Content(
                role="user",
                parts=[types.Part(text="start")]
            )

            async for event in runner.run_async(user_id=USER_ID, session_id=session.id, new_message=content):
                if event.is_final_response():
                    text = event.content.parts[0].text
                    output = EasyListening.model_validate_json(text)
                    return output
    return {}