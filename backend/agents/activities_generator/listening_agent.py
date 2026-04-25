from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from google.adk.models.lite_llm import LiteLlm
from dotenv import load_dotenv
import os

load_dotenv()

model = "gemini-3.1-flash-lite-preview"

class WordEntry(BaseModel):
    word: str
    similar_sounding: list[str]

class EasyListening(BaseModel):
    words: list[WordEntry]


easy_listening_agent = Agent(
    # model='gemma-4-31b-it',
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=1.0),
    name='easy_listening_agent',
    description='An agent useful for generating a listening activity for a language learning app',
    instruction="""Generate 5 words related to this topic: {topic}.
    For each word, generate 3 similar-sounding words.
    Generate all words in this language: {target_language}.
    Respond only with a JSON object, no preamble, no markdown formatting.
    """,
    output_schema=EasyListening,
    output_key="easy_listening"
)


class MediumListening(BaseModel):
    sentence: str = Field(description="The generated sentence in this language: {user_language}") 
    target_sentence: str = Field(description="The same generated sentence in this language: {target_language}") 


medium_listening_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=1.0),
    name='medium_listening_agent',
    description='An agent useful for generating a listening activity for a language learning app',
    instruction="""Generate a sentence related to this topic: {topic}.
    Generate the target_sentence in the following language: {target_language} and sentence in this language: {user_language}
    """,
    output_schema=MediumListening,
    output_key="medium_listening"
)

class DialogueLine(BaseModel):
    speaker_id: int
    line: str = Field(description="What the speaker said in the following language: {target_language}")

class HardListening(BaseModel):
    dialogue: list[DialogueLine]
    questions: list[str]


hard_listening_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=1.0),
    name='hard_listening_agent',
    description='An agent useful for generating a listening activity for a language learning app',
    instruction="""Generate a short dialogue related to this topic: {topic}.
    Then generate 3 comprehension question on that dialogue.
    Generate the dialogue and questions in the following language: {target_language}.
    """,
    output_schema=HardListening,
    output_key="hard_listening"
)