from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from bson import ObjectId

from agents.activities_generator.listening_agent import (
    easy_listening_agent, EasyListening,
    medium_listening_agent, MediumListening,
    hard_listening_agent, HardListening,
)
from agents.activities_generator.writing_agent import (
    easy_writing_agent, EasyWriting,
    medium_writing_agent, MediumWriting,
    hard_writing_agent, HardWriting,
)
from agents.activities_generator.reading_agent import (
    easy_reading_agent, EasyReading,
    medium_reading_agent, MediumReading,
    hard_reading_agent, HardReading,
)

from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

from uuid import uuid4
from database import activities_collection
from models import ActivityModel
from datetime import datetime

session_service = InMemorySessionService()
APP_NAME = "Language Learning App"

router = APIRouter(prefix="/activities", tags=["activities"])


class GenerateActivityBody(BaseModel):
    user_id: str = Field(default="user")
    topic: str = Field(default="Ordering at a restaurant")  # human-readable name for AI
    topic_id: str = Field(default="")                       # DB id for filtering
    language_id: str = Field(default="")                    # DB id of the language
    user_language: str = Field(default="english")
    target_language: str = Field(default="spanish")


# ─── Shared helpers ──────────────────────────────────────────────────────────

async def run_agent(agent, body: GenerateActivityBody) -> str:
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=body.user_id,
        session_id=str(uuid4()),
        state={
            "topic":           body.topic,
            "user_language":   body.user_language,
            "target_language": body.target_language,
        },
    )
    runner = Runner(
        app_name=APP_NAME,
        agent=agent,
        session_service=session_service,
        auto_create_session=True,
    )
    content = types.Content(role="user", parts=[types.Part(text="start")])

    async for event in runner.run_async(
        user_id=body.user_id,
        session_id=session.id,
        new_message=content,
    ):
        if event.is_final_response():
            return event.content.parts[0].text

    raise HTTPException(status_code=500, detail="Agent produced no final response")


async def save_activity(activity_type: str, difficulty: int, body: GenerateActivityBody, content: dict) -> dict:
    """Save activity to MongoDB and return the full document with _id as string."""
    doc = ActivityModel(
        type=activity_type,
        level="A1",
        difficulty=difficulty,
        content=content,
        user_language=body.user_language,
        target_language=body.target_language,
        topic=body.topic,
        topic_id=body.topic_id,
        language_id=body.language_id,
    ).model_dump()

    result = await activities_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


# ─── CRUD Endpoints 

@router.get("/")
async def get_activities(topic_id: Optional[str] = None, user_id: Optional[str] = None):
    """Get all activities or filter by topic_id."""
    query = {}
    if topic_id:
        query["topic_id"] = topic_id   # match on the stored topic_id field
    if user_id:
        query["user_id"] = user_id
    
    cursor = activities_collection.find(query)
    activities = await cursor.to_list(length=100)
    
    for activity in activities:
        activity["_id"] = str(activity["_id"])
    
    return activities


@router.get("/{activity_id}")
async def get_activity(activity_id: str):
    """Get a single activity by ID."""
    try:
        oid = ObjectId(activity_id)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid activity_id: {activity_id}")
    
    activity = await activities_collection.find_one({"_id": oid})
    if not activity:
        raise HTTPException(status_code=404, detail=f"Activity {activity_id} not found")
    
    activity["_id"] = str(activity["_id"])
    return activity


@router.post("/")
async def create_activity(activity_data: GenerateActivityBody):
    """Create a new activity manually."""
    doc = ActivityModel(
        type="custom",
        level="A1",
        difficulty=0,
        content={},
        user_language=activity_data.user_language,
        target_language=activity_data.target_language,
        topic=activity_data.topic,
        topic_id=activity_data.topic_id,
        language_id=activity_data.language_id,
    ).model_dump()
    
    result = await activities_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.put("/{activity_id}")
async def update_activity(activity_id: str, activity_data: dict):
    """Update an activity."""
    try:
        oid = ObjectId(activity_id)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid activity_id: {activity_id}")
    
    result = await activities_collection.update_one(
        {"_id": oid},
        {"$set": activity_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Activity {activity_id} not found")
    
    activity = await activities_collection.find_one({"_id": oid})
    activity["_id"] = str(activity["_id"])
    return activity


@router.delete("/{activity_id}")
async def delete_activity(activity_id: str):
    """Delete an activity."""
    try:
        oid = ObjectId(activity_id)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid activity_id: {activity_id}")
    
    result = await activities_collection.delete_one({"_id": oid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Activity {activity_id} not found")
    
    return {"message": "Activity deleted successfully"}


# ─── Activity Generation Endpoint ──────────────────────────────────────────────

@router.post("/generate/{topic_id}")
async def generate_activities_for_topic(topic_id: str, body: GenerateActivityBody):
    """
    Generate multiple activities (one of each type: listening, writing, reading)
    for a given topic. This is the main endpoint the frontend calls.
    """
    generated_activities = []
    
    # Generate one activity of each type at difficulty 0 (easy)
    activity_configs = [
        ("listening", 0, easy_listening_agent, EasyListening),
        ("writing", 0, easy_writing_agent, EasyWriting),
        ("reading", 0, easy_reading_agent, EasyReading),
    ]
    
    for activity_type, difficulty, agent, schema in activity_configs:
        try:
            text = await run_agent(agent, body)
            output = schema.model_validate_json(text)
            activity = await save_activity(activity_type, difficulty, body, output.model_dump())
            generated_activities.append(activity)
        except Exception as e:
            print(f"Error generating {activity_type} activity: {str(e)}")
            continue
    
    return {
        "topic_id": topic_id,
        "activities": generated_activities,
        "count": len(generated_activities)
    }


# ─── Listening 
async def generate_listening_activity(difficulty: int, body: GenerateActivityBody):
    match difficulty:
        case 0:
            agent, schema = easy_listening_agent, EasyListening
        case 1:
            agent, schema = medium_listening_agent, MediumListening
        case 2:
            agent, schema = hard_listening_agent, HardListening
        case _:
            raise HTTPException(status_code=400, detail=f"Invalid difficulty: {difficulty}")

    text = await run_agent(agent, body)
    output = schema.model_validate_json(text)
    return await save_activity("listening", difficulty, body, output.model_dump())


# ─── Writing 
@router.post("/writing")
async def generate_writing_activity(difficulty: int, body: GenerateActivityBody):
    match difficulty:
        case 0:
            agent, schema = easy_writing_agent, EasyWriting
        case 1:
            agent, schema = medium_writing_agent, MediumWriting
        case 2:
            agent, schema = hard_writing_agent, HardWriting
        case _:
            raise HTTPException(status_code=400, detail=f"Invalid difficulty: {difficulty}")

    text = await run_agent(agent, body)
    output = schema.model_validate_json(text)
    return await save_activity("writing", difficulty, body, output.model_dump())


# ─── Reading 

@router.post("/reading")
async def generate_reading_activity(difficulty: int, body: GenerateActivityBody):
    match difficulty:
        case 0:
            agent, schema = easy_reading_agent, EasyReading
        case 1:
            agent, schema = medium_reading_agent, MediumReading
        case 2:
            agent, schema = hard_reading_agent, HardReading
        case _:
            raise HTTPException(status_code=400, detail=f"Invalid difficulty: {difficulty}")

    text = await run_agent(agent, body)
    output = schema.model_validate_json(text)
    return await save_activity("reading", difficulty, body, output.model_dump())

@router.post("/generate/{topic_id}/difficulty/{difficulty}")
async def generate_activities_for_difficulty(topic_id: str, difficulty: int, body: GenerateActivityBody):
    """
    Generate activities for a specific difficulty level (0=easy, 1=medium, 2=hard).
    Only called after the previous difficulty is completed.
    """
    if difficulty not in [0, 1, 2]:
        raise HTTPException(status_code=400, detail="difficulty must be 0, 1, or 2")

    match difficulty:
        case 0:
            configs = [
                ("listening", 0, easy_listening_agent, EasyListening),
                ("writing", 0, easy_writing_agent, EasyWriting),
                ("reading", 0, easy_reading_agent, EasyReading),
            ]
        case 1:
            configs = [
                ("listening", 1, medium_listening_agent, MediumListening),
                ("writing", 1, medium_writing_agent, MediumWriting),
                ("reading", 1, medium_reading_agent, MediumReading),
            ]
        case 2:
            configs = [
                ("listening", 2, hard_listening_agent, HardListening),
                ("reading", 2, hard_reading_agent, HardReading),
                ("writing", 2, hard_writing_agent, HardWriting),
            ]

    generated_activities = []
    for activity_type, diff, agent, schema in configs:
        try:
            text = await run_agent(agent, body)
            output = schema.model_validate_json(text)
            activity = await save_activity(activity_type, diff, body, output.model_dump())
            generated_activities.append(activity)
        except Exception as e:
            print(f"Error generating {activity_type} difficulty={diff}: {str(e)}")
            continue

    return {
        "topic_id": topic_id,
        "difficulty": difficulty,
        "activities": generated_activities,
        "count": len(generated_activities)
    }