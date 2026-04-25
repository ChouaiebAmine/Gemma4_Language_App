from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from google.adk.models.lite_llm import LiteLlm
from dotenv import load_dotenv
import os

load_dotenv()

model = "gemma-4-31b-it"


class MediumListeningEval(BaseModel):
    score: int
    feedback: str

medium_listening_eval_agent = Agent(
    # model='gemma-4-31b-it',
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=1.0),
    name='easy_listening_evaluation_agent',
    description='An agent useful for evaluating a listening activity (dictation) for a language learning app',
    instruction="""Assess the user's listening performance. Compare the user's input {user_input} with the reference and give a score from 0 to 10, and feedback for the user in the following language: {user_language}.
    Reference: {reference}
    Respond only with a JSON object, no preamble, no markdown formatting.
    """,
    output_schema=MediumListeningEval,
    output_key="medium_listening_eval"
)
