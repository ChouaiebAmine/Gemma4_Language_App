import json
from uuid import uuid4

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agents.evaluation_agents.listening_eval_agent import (
    EasyListeningEval, MediumListeningEval, HardListeningEval, WordResult,
    medium_listening_eval_agent, hard_listening_eval_agent,
)
from agents.evaluation_agents.reading_eval_agent import (
    EasyReadingEval, MediumReadingEval, HardReadingEval,
    evaluate_easy_reading, evaluate_medium_reading, hard_reading_eval_agent,
)
from agents.evaluation_agents.writing_eval_agent import (
    EasyWritingEval, MediumWritingEval,
    easy_writing_eval_agent, medium_writing_eval_agent,
)

from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

from database import evaluations_collection, activities_collection
from models import EvaluationModel

session_service = InMemorySessionService()
APP_NAME = "Language Learning App"

router = APIRouter(prefix="/evaluate", tags=["evaluate"])


# ─── Body models ─────────────────────────────────────────────────────────────

class ActivityBase(BaseModel):
    user_id: str = Field(default="user")


# Listening
class EasyListeningEvalBody(ActivityBase):
    activity_id: str
    selected_words: list[str]   # one selected word per task, same order

class MediumListeningEvalBody(ActivityBase):
    activity_id: str
    transcription: str

class HardListeningEvalBody(ActivityBase):
    activity_id: str
    answers: list[str]

# Writing
class EasyWritingEvalBody(ActivityBase):
    activity_id: str
    answers: list[str]

class MediumWritingEvalBody(ActivityBase):
    activity_id: str
    essay: str

# Reading
class EasyReadingEvalBody(ActivityBase):
    activity_id: str
    answers: list[str]

class MediumReadingEvalBody(ActivityBase):
    activity_id: str
    answers: list[str]

class HardReadingEvalBody(ActivityBase):
    activity_id: str
    answers: list[str]


# ─── Shared helpers ──────────────────────────────────────────────────────────

async def fetch_activity(activity_id: str, expected_type: str, expected_difficulty: int) -> dict:
    try:
        oid = ObjectId(activity_id)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid activity_id: {activity_id}")

    doc = await activities_collection.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Activity {activity_id} not found")
    if doc.get("type") != expected_type:
        raise HTTPException(status_code=400, detail=f"Activity is not a {expected_type} activity")
    if doc.get("difficulty") != expected_difficulty:
        raise HTTPException(status_code=400, detail=f"Activity is not difficulty {expected_difficulty}")

    return doc


async def run_agent(agent, user_id: str, state: dict) -> str:
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=user_id,
        session_id=str(uuid4()),
        state=state,
    )
    runner = Runner(
        app_name=APP_NAME,
        agent=agent,
        session_service=session_service,
        auto_create_session=True,
    )
    content = types.Content(role="user", parts=[types.Part(text="start")])

    async for event in runner.run_async(
        user_id=user_id,
        session_id=session.id,
        new_message=content,
    ):
        if event.is_final_response():
            return event.content.parts[0].text

    raise HTTPException(status_code=500, detail="Agent produced no final response")


async def save_eval(
    user_id: str,
    activity_type: str,
    difficulty: int,
    user_input: str,
    activity_id: str,
    result: dict,
):
    await evaluations_collection.insert_one(EvaluationModel(
        user_id=user_id,
        type=activity_type,
        difficulty=difficulty,
        user_input=user_input,
        reference=activity_id,
        result=result,
    ).model_dump())


# ─── Listening ───────────────────────────────────────────────────────────────

@router.post("/listening/easy")
async def evaluate_easy_listening(body: EasyListeningEvalBody):
    activity = await fetch_activity(body.activity_id, "listening", 0)
    words = activity["content"]["words"]

    results = [
        WordResult(
            correct_word=task["word"],
            user_answer=answer,
            correct=answer.strip().lower() == task["word"].strip().lower(),
        )
        for task, answer in zip(words, body.selected_words)
    ]
    total = sum(r.correct for r in results)
    output = EasyListeningEval(
        total_score=total,
        results=results,
        feedback=f"{total}/{len(results)} correct.",
    )

    await save_eval(body.user_id, "listening", 0, str(body.selected_words), body.activity_id, output.model_dump())
    return output


@router.post("/listening/medium")
async def evaluate_medium_listening(body: MediumListeningEvalBody):
    activity = await fetch_activity(body.activity_id, "listening", 1)

    text = await run_agent(medium_listening_eval_agent, body.user_id, state={
        "user_input":      body.transcription,
        "reference":       activity["content"]["target_sentence"],
        "user_language":   activity["user_language"],
        "target_language": activity["target_language"],
    })
    output = MediumListeningEval.model_validate_json(text)

    await save_eval(body.user_id, "listening", 1, body.transcription, body.activity_id, output.model_dump())
    return output


@router.post("/listening/hard")
async def evaluate_hard_listening(body: HardListeningEvalBody):
    activity = await fetch_activity(body.activity_id, "listening", 2)

    text = await run_agent(hard_listening_eval_agent, body.user_id, state={
        "user_input":      body.answers,
        "reference":       json.dumps(activity["content"]),
        "user_language":   activity["user_language"],
        "target_language": activity["target_language"],
    })
    output = HardListeningEval.model_validate_json(text)

    await save_eval(body.user_id, "listening", 2, str(body.answers), body.activity_id, output.model_dump())
    return output


# ─── Writing ─────────────────────────────────────────────────────────────────

@router.post("/writing/easy")
async def evaluate_easy_writing(body: EasyWritingEvalBody):
    activity = await fetch_activity(body.activity_id, "writing", 0)

    text = await run_agent(easy_writing_eval_agent, body.user_id, state={
        "user_input":      body.answers,
        "reference":       json.dumps(activity["content"]),
        "user_language":   activity["user_language"],
        "target_language": activity["target_language"],
    })
    output = EasyWritingEval.model_validate_json(text)

    await save_eval(body.user_id, "writing", 0, str(body.answers), body.activity_id, output.model_dump())
    return output


@router.post("/writing/medium")
async def evaluate_medium_writing(body: MediumWritingEvalBody):
    activity = await fetch_activity(body.activity_id, "writing", 1)

    text = await run_agent(medium_writing_eval_agent, body.user_id, state={
        "user_input":      body.essay,
        "reference":       activity["content"]["essay_topic"],
        "user_language":   activity["user_language"],
        "target_language": activity["target_language"],
    })
    output = MediumWritingEval.model_validate_json(text)

    await save_eval(body.user_id, "writing", 1, body.essay, body.activity_id, output.model_dump())
    return output


# ─── Reading ─────────────────────────────────────────────────────────────────

@router.post("/reading/easy")
async def evaluate_easy_reading_endpoint(body: EasyReadingEvalBody):
    activity = await fetch_activity(body.activity_id, "reading", 0)

    output = evaluate_easy_reading(answers=body.answers, content=activity["content"])

    await save_eval(body.user_id, "reading", 0, str(body.answers), body.activity_id, output.model_dump())
    return output


@router.post("/reading/medium")
async def evaluate_medium_reading_endpoint(body: MediumReadingEvalBody):
    activity = await fetch_activity(body.activity_id, "reading", 1)

    output = evaluate_medium_reading(answers=body.answers, content=activity["content"])

    await save_eval(body.user_id, "reading", 1, str(body.answers), body.activity_id, output.model_dump())
    return output


@router.post("/reading/hard")
async def evaluate_hard_reading(body: HardReadingEvalBody):
    activity = await fetch_activity(body.activity_id, "reading", 2)

    text = await run_agent(hard_reading_eval_agent, body.user_id, state={
        "user_input":      body.answers,
        "reference":       json.dumps(activity["content"]),
        "user_language":   activity["user_language"],
        "target_language": activity["target_language"],
    })
    output = HardReadingEval.model_validate_json(text)

    await save_eval(body.user_id, "reading", 2, str(body.answers), body.activity_id, output.model_dump())
    return output