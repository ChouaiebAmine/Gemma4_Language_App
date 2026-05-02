from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from google.adk.models.lite_llm import LiteLlm
from dotenv import load_dotenv
import os
from llm import model, temperature, top_k, top_p

load_dotenv()



# ─── Level 1: Word in context, match to translation ──────────────────────────

class WordInContext(BaseModel):
    word: str = Field(description="The target word in the target language")
    sentence: str = Field(description="A sentence using the word in context, in the target language")
    translation: str = Field(description="The correct translation of the word in the user's language")
    distractors: list[str] = Field(description="3 wrong translations in the user's language")

class EasyReading(BaseModel):
    tasks: list[WordInContext]


easy_reading_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature, top_p=top_p, top_k=top_k   ),
    name="easy_reading_agent",
    description="Generates a word-in-context matching activity for a reading exercise",
    instruction="""Generate 4 words related to this topic: {topic}.
For each word:
- Write a short sentence using the word in context in {target_language}
- Provide the correct translation in {user_language}
- Provide 3 plausible but wrong translation distractors in {user_language}

Respond only with a JSON object, no preamble, no markdown formatting.
""",
    output_schema=EasyReading,
    output_key="easy_reading",
)


# ─── Level 2: Sentence with a blank, choose/type the correct word ─────────────

class SentenceBlank(BaseModel):
    sentence: str = Field(description="Sentence in {target_language} with ___ where the missing word goes")
    missing_word: str = Field(description="The correct word in {target_language}")
    distractors: list[str] = Field(description="3 wrong word choices in {target_language}")

class MediumReading(BaseModel):
    tasks: list[SentenceBlank]


medium_reading_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature),
    name="medium_reading_agent",
    description="Generates fill-in-the-blank sentence tasks for a reading exercise",
    instruction="""Generate 4 sentences related to this topic: {topic} in {target_language}.
Each sentence should have one key word removed and replaced with ___.
For each task:
- Write the sentence with ___ in place of the missing word
- Provide the correct missing word
- Provide 3 plausible but wrong word distractors

Respond only with a JSON object, no preamble, no markdown formatting.
""",
    output_schema=MediumReading,
    output_key="medium_reading",
)


# ─── Level 3: Paragraph + open-ended comprehension questions ─────────────────

class HardReading(BaseModel):
    paragraph: str = Field(description="A paragraph in {target_language} related to the topic")
    questions: list[str] = Field(description="3 open-ended comprehension questions in {user_language}")


hard_reading_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature),
    name="hard_reading_agent",
    description="Generates a paragraph with open-ended comprehension questions for a reading exercise",
    instruction="""Generate a short paragraph (4-6 sentences) related to this topic: {topic} in {target_language}.
Then generate 3 open-ended comprehension questions about the paragraph in {user_language}.

Respond only with a JSON object, no preamble, no markdown formatting.
""",
    output_schema=HardReading,
    output_key="hard_reading",
)