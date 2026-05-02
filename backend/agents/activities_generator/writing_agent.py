from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from google.adk.models.lite_llm import LiteLlm
from dotenv import load_dotenv
import os
from llm import model, temperature

load_dotenv()



class Task(BaseModel):
    sentence: str
    missing_word: str

class EasyWriting(BaseModel):
    tasks: list[Task]


easy_writing_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature),
    name='easy_writing_agent',
    description='An agent useful for generating a writing activity for a language learning app',
    instruction="""Generate 3 sentences related to this topic: {topic}.
    Each sentence should contain a fill-in-the-blank space (Use underscores for the missing word) that includes grammar (verbs and tenses).
    Write the root of the verb in parentheses before the blank space.
    Generate the sentence in this language: {target_language}.
    Respond only with a JSON object, no preamble, no markdown formatting.
    """,
    output_schema=EasyWriting,
    output_key="easy_writing"
)



class MediumWriting(BaseModel):
    essay_topic: str


medium_writing_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature),
    name='medium_writing_agent',
    description='An agent useful for generating a writing activity for a language learning app',
    instruction="""Generate an essay question based on the following topic: {topic}.
    Generate the sentence in this language: {target_language}.
    Respond only with a JSON object, no preamble, no markdown formatting.
    """,
    output_schema=MediumWriting,
    output_key="medium_writing"
)