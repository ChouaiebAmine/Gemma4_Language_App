from fastapi import APIRouter
from typing import List
from pydantic import BaseModel, Field

from agents.topic_generator.agent import Topics
from agents.activities_generator.listening_agent import easy_listening_agent, EasyListening, medium_listening_agent, MediumListening, hard_listening_agent, HardListening
from agents.activities_generator.writing_agent import easy_writing_agent, EasyWriting, medium_writing_agent, MediumWriting


from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

import json
from uuid import uuid4
from database import activities_collection
from models import ActivityModel

session_service = InMemorySessionService()
APP_NAME = "Language Learning App"
USER_ID = "user"

router = APIRouter(prefix="/activities", tags=["activities"])



class GenerateActivityBody(BaseModel):
    user_id: str = Field(default="user")
    topic: str = Field(default="Ordering at a restaurant")
    user_language: str = Field(default="english")
    target_language: str = Field(default="spanish")


@router.post("/listening")
async def generate_listening_activity(difficulty: int, body: GenerateActivityBody):

    agent = easy_listening_agent
    schema = EasyListening
    
    match difficulty:
        case 0:
            agent = easy_listening_agent
            schema = EasyListening
        case 1:
            agent = medium_listening_agent
            schema = MediumListening
        case 2:
            agent = hard_listening_agent
            schema = HardListening
    
    session = await session_service.create_session(app_name=APP_NAME, user_id=body.user_id, session_id=str(uuid4()),
        state={
            "topic": body.topic,
            "user_language": body.user_language,
            "target_language": body.target_language,
    })

    runner = Runner(app_name=APP_NAME, agent=agent, session_service=session_service, auto_create_session=True)

    content = types.Content(
        role="user",
        parts=[types.Part(text="start")]
    )

    async for event in runner.run_async(user_id=body.user_id, session_id=session.id, new_message=content):
        if event.is_final_response():
            text = event.content.parts[0].text
            output = schema.model_validate_json(text)
            
            #Save to MongoDB
            activity_doc = ActivityModel(
                type="listening",
                level="A1",
                difficulty=difficulty,
                content=output.model_dump()
            ).model_dump()
            await activities_collection.insert_one(activity_doc)
            
            return output
    return {}




@router.post("/writing")
async def generate_writing_activity(difficulty: int, body: GenerateActivityBody):

    agent = easy_writing_agent
    schema = EasyWriting
    
    match difficulty:
        case 0:
            agent = easy_writing_agent
            schema = EasyWriting
        case 1:
            agent = medium_writing_agent
            schema = MediumWriting
        case 2:
            agent = hard_listening_agent
            schema = HardListening
    
    session = await session_service.create_session(app_name=APP_NAME, user_id=body.user_id, session_id=str(uuid4()),
        state={
            "topic": body.topic,
            "user_language": body.user_language,
            "target_language": body.target_language,
    })

    runner = Runner(app_name=APP_NAME, agent=agent, session_service=session_service, auto_create_session=True)

    content = types.Content(
        role="user",
        parts=[types.Part(text="start")]
    )

    async for event in runner.run_async(user_id=body.user_id, session_id=session.id, new_message=content):
        if event.is_final_response():
            text = event.content.parts[0].text
            output = schema.model_validate_json(text)
            
            # save to Mongo
            activity_doc = ActivityModel(
                type="writing",
                level="A1",
                difficulty=difficulty,
                content=output.model_dump()
            ).model_dump()
            await activities_collection.insert_one(activity_doc)
            
            return output
    return {}
