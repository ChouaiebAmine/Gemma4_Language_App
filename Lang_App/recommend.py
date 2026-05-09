from fastapi import APIRouter, HTTPException
from typing import List

from pydantic import BaseModel, Field
from agents.recommendation_agent import recommendation_agent, Recommendation

from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

import json
from uuid import uuid4
from database import evaluations_collection

session_service = InMemorySessionService()
APP_NAME = "Language Learning App"

router = APIRouter(prefix="/recommendation", tags=["recommend"])
from pydantic import BaseModel, Field

class RecommendationBody(BaseModel):
    user_id: str
    user_language: str = Field(default="english")
    target_language: str = Field(default="spanish")


@router.post("/next")
async def recommend_next_steps(body: RecommendationBody):
    # Fetch most recent evaluation for this user from MongoDB
    cursor = evaluations_collection.find(
        {"user_id": body.user_id},
        sort=[("created_at", -1)],
        limit=1,
    )
    evaluations = await cursor.to_list(length=1)

    if not evaluations:
        raise HTTPException(status_code=404, detail="No evaluation history found for this user")

    # Strip MongoDB _id before passing to agent
    history = [
        {k: v for k, v in e.items() if k != "_id"}
        for e in evaluations
    ]

    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=body.user_id,
        session_id=str(uuid4()),
        state={
            "evaluation_history": history,
            "user_language":      body.user_language,
            "target_language":    body.target_language,
        },
    )

    runner = Runner(
        app_name=APP_NAME,
        agent=recommendation_agent,
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
            output = Recommendation.model_validate_json(event.content.parts[0].text)
            return output

    raise HTTPException(status_code=500, detail="Agent produced no final response")