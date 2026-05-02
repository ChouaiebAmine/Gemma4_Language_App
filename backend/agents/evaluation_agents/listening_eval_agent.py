from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from google.adk.models.lite_llm import LiteLlm
from dotenv import load_dotenv
import os
from llm import model, temperature, top_k, top_p


load_dotenv()

class WordResult(BaseModel):
    correct_word: str
    user_answer: str
    correct: bool

class EasyListeningEval(BaseModel):
    total_score: int
    results: list[WordResult]
    feedback: str


class MediumListeningEval(BaseModel):
    score: int
    feedback: str

medium_listening_eval_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature, top_p=top_p, top_k=top_k),
    name='easy_listening_evaluation_agent',
    description='An agent useful for evaluating a listening activity (dictation) for a language learning app',
    instruction="""Assess the user's listening performance. Compare the user's input {user_input} with the reference and give a score from 0 to 10, and feedback for the user in the following language: {user_language}.
    Reference: {reference}
    Respond only with a JSON object, no preamble, no markdown formatting.
    """,
    output_schema=MediumListeningEval,
    output_key="medium_listening_eval"
)


class QuestionResult(BaseModel):
    question: str
    user_answer: str
    correct: bool
    correct_answer: str = Field(description="The correct answer in the user's language")


class HardListeningEval(BaseModel):
    total_score: int = Field(description="Number of questions answered correctly out of total")
    results: list[QuestionResult]
    feedback: str = Field(description="Overall feedback written in the user's language")


hard_listening_eval_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature),
    name="hard_listening_eval_agent",
    description="Evaluates comprehension question answers for a hard listening activity",
    instruction="""You are evaluating a listening comprehension exercise.

The reference is a JSON string with this shape:
{{
  "dialogue": [{{"speaker_id": int, "line": str}}, ...],
  "questions": ["question 1", "question 2", ...]
}}

Reference: {reference}

The user's answers are a JSON array, in the same order as the questions:
{user_input}

User's language: {user_language}
Target language: {target_language}

For each question, match it to the corresponding user answer by position.
Evaluate correctness based solely on the dialogue content.
For wrong answers, provide the correct answer in {user_language}.
Write overall feedback in {user_language}.
Respond only with a JSON object, no preamble, no markdown formatting.
""",
    output_schema=HardListeningEval,
    output_key="hard_listening_eval",
)