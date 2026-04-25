from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from google.adk.models.lite_llm import LiteLlm
from dotenv import load_dotenv
import os

load_dotenv()

class Topics(BaseModel):
    topics_base: list[str] = Field(description="The topics in this language: {user_language}") 
    topics_target: list[str] = Field(description="The topics in this language: {target_language}") 


# model = LiteLlm(
#     model="openrouter/google/gemma-4-31b-it:free",
#     api_key=os.getenv("OPENROUTER_KEY"),
#     api_base="https://openrouter.ai/api/v1",
#     temperature=1.0
# )
root_agent = Agent(
    model='gemma-4-31b-it',
    generate_content_config=types.GenerateContentConfig(temperature=1.0),
    # model=model,
    name='topic_generator_agent',
    description='An agent useful for generating topics for a language learning app',
    instruction="""Suggest 3 topics for a language learning app. Choose real-life, practical, every-day topics.
    You MUST provide the 'topics_base' in {user_language}.
    You MUST provide the 'topics_target' in {target_language}.
    Respond only with a JSON object, no preamble, no markdown formatting
    """,
    output_schema=Topics,
    output_key="topics"
)
