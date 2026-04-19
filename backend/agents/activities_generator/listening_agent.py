from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

class WordEntry(BaseModel):
    word: str
    similar_sounding: list[str]

class EasyListening(BaseModel):
    words: list[WordEntry]


easy_listening_agent = Agent(
    model='gemma-4-31b-it',
    generate_content_config=types.GenerateContentConfig(temperature=1.0),
    name='listening_agent',
    description='An agent useful for generating a listening activity for a language learning app',
    instruction="""Generate 5 words related to this topic: {topic}.
    For each word, generate 3 similar-sounding words.
    Generate all words in this language: {target_language}.
    Respond only with a JSON object, no preamble, no markdown formatting.
    """,
    output_schema=EasyListening,
    output_key="easy_listening"
)