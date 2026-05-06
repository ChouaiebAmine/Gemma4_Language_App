from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from google.adk.models.lite_llm import LiteLlm
from dotenv import load_dotenv
import os
from llm import model, temperature,top_k, top_p

load_dotenv()



class Task(BaseModel):
    sentence: str
    missing_word: str

class EasyWriting(BaseModel):
    tasks: list[Task]


easy_writing_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature,top_k=top_k,top_p=top_p),
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
    generate_content_config=types.GenerateContentConfig(temperature=temperature,top_k=top_k,top_p=top_p),
    name='medium_writing_agent',
    description='An agent useful for generating a writing activity for a language learning app',
    instruction="""Generate an essay question based on the following topic: {topic}.
    Generate the sentence in this language: {target_language}.
    Respond only with a JSON object, no preamble, no markdown formatting.
    """,
    output_schema=MediumWriting,
    output_key="medium_writing"
)

class HardWriting(BaseModel):
    essay_topic: str
    question: str = Field(description="A specific question about the essay topic that requires a detailed answer")

hard_writing_agent = Agent(
    model = model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature,top_k=top_k,top_p=top_p),
    name="hard_writing_agent",
    description="An agent useful for generating a writing activity for a language learning app",
    instruction="""Generate a detailed essay question based on the following topic: {topic}.
The question should require a detailed answer that demonstrates deep understanding and the ability to express complex ideas in the target language: {target_language}.
Respond only with a JSON object, no preamble, no markdown formatting. 
""",
    output_schema=HardWriting,
    output_key="hard_writing"  
)