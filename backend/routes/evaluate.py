from fastapi import APIRouter
from typing import List

from agents.evaluation_agents.listening_eval_agent import medium_listening_eval_agent, MediumListeningEval

from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

import json
from uuid import uuid4
from database import evaluations_collection
from models import EvaluationModel

session_service = InMemorySessionService()
APP_NAME = "Language Learning App"
USER_ID = "user"

router = APIRouter(prefix="/evaluate", tags=["evaluate"])


@router.post("/listening")
async def evaluate_listening(difficulty: int):
    match difficulty:
        case 0:
            return {"message": "Easy difficulty evaluation not implemented"}
        case 1:
            agent = medium_listening_eval_agent
            schema = MediumListeningEval

            user_input = "Me gustaría pedir a la parrilla con una guarnición."
            reference = "Me gustaría pedir el pollo a la parrilla con una guarnición de verduras, por favor."

            session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=str(uuid4()),
            state={
                    "user_input": user_input,
                    "reference": reference,
                    "user_language": "english",
                    "target_language": "spanish",
            })

            runner = Runner(app_name=APP_NAME, agent=agent, session_service=session_service, auto_create_session=True)

            content = types.Content(
                role="user",
                parts=[types.Part(text="start")]
            )

            async for event in runner.run_async(user_id=USER_ID, session_id=session.id, new_message=content):
                if event.is_final_response():
                    text = event.content.parts[0].text
                    output = schema.model_validate_json(text)
                    
                    # Save to MongoDB
                    eval_doc = EvaluationModel(
                        type="listening",
                        difficulty=difficulty,
                        user_input=user_input,
                        reference=reference,
                        result=output.model_dump()
                    ).model_dump()
                    await evaluations_collection.insert_one(eval_doc)
                    
                    return output
            return {}

        case 2:
            return {"message": "Hard difficulty evaluation not implemented"}
