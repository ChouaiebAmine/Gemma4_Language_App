from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from google.adk.models.lite_llm import LiteLlm
from dotenv import load_dotenv
from llm import model, temperature, top_k, top_p
import os

load_dotenv()


class Recommendation(BaseModel):
    type: str = Field(description="One of: review_vocab, increase_difficulty, change_topic")
    reasoning: str = Field(description="Why this is recommended, written in the user's language")


recommendation_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature, top_p=top_p, top_k=top_k),
    name="recommendation_agent",
    description="Recommends the single best next learning step based on a user's past evaluation history",
    instruction="""You are a language learning coach analyzing a student's recent activity evaluations.

User's language: {user_language}
Target language: {target_language}
Recent evaluation history (JSON): {evaluation_history}

Based on this history, choose the single most relevant next step from these options:

- review_vocab — the user should revisit missed vocabulary or words they struggled with
- increase_difficulty — the user is performing well enough to try a harder activity
- change_topic — the user has spent too long on one topic and would benefit from variety

Consider:
- Low scores or many wrong answers → favour review_vocab
- Consistently high scores → favour increase_difficulty
- Many evaluations on the same topic → favour change_topic

Write your reasoning in {user_language}.
Respond only with a JSON object, no preamble, no markdown formatting.
""",
    output_schema=Recommendation,
    output_key="recommendation",
)