from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from google.adk.models.lite_llm import LiteLlm
from dotenv import load_dotenv
import os
from llm import model, temperature, top_k, top_p

load_dotenv()


# ─── Easy Listening: sentence fill-in-the-blank by ear ───────────────────────

class ListeningTask(BaseModel):
    sentence: str = Field(description="A natural sentence in {target_language} related to the topic.")
    sentence_with_blank: str = Field(description="Same sentence with the missing_word replaced by '____'.")
    missing_word: str = Field(description="The key word removed from the sentence that the student must identify.")
    options: list[str] = Field(description="4 choices: correct missing_word + 3 plausible distractors in {target_language}. Not sorted.")

class EasyListening(BaseModel):
    tasks: list[ListeningTask]


easy_listening_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature,top_k=top_k,top_p=top_p),
    name='easy_listening_agent',
    description='Generates listening fill-in-the-blank tasks for a language learning app',
    instruction="""Generate 5 listening tasks about the topic: {topic} in {target_language}.
    For each task:
    1. Write a short natural sentence in {target_language}.
    2. Pick one key word as the missing_word.
    3. Write sentence_with_blank: identical sentence but with missing_word replaced by '____'.
    4. Write options: a shuffled list of 4 words — the correct missing_word plus 3 plausible distractors in {target_language}.
    The learner will hear the full sentence (TTS) and must choose the missing word from the options.
    Respond ONLY with a valid JSON object. No preamble, no markdown.
    """,
    output_schema=EasyListening,
    output_key="easy_listening"
)


class MediumListening(BaseModel):
    sentence: str = Field(description="The generated sentence in this language: {user_language}") 
    target_sentence: str = Field(description="The same generated sentence in this language: {target_language}") 


medium_listening_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature,top_k=top_k,top_p=top_p),
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
    generate_content_config=types.GenerateContentConfig(temperature=temperature,top_k=top_k,top_p=top_p),
    name='hard_listening_agent',
    description='An agent useful for generating a listening activity for a language learning app',
    instruction="""Generate a short dialogue related to this topic: {topic}.
    Then generate 3 comprehension question on that dialogue.
    Generate the dialogue and questions in the following language: {target_language}.
    """,
    output_schema=HardListening,
    output_key="hard_listening"
)