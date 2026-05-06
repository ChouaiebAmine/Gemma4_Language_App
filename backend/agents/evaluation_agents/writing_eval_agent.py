from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from dotenv import load_dotenv
from llm import model, temperature, top_k, top_p    

load_dotenv()


# ─── Easy ────────────────────────────────────────────────────────────────────

class TaskResult(BaseModel):
    sentence: str = Field(description="The original sentence with the blank")
    expected: str = Field(description="The correct conjugated word")
    user_answer: str = Field(description="What the user submitted for this blank")
    correct: bool


class EasyWritingEval(BaseModel):
    total_score: int = Field(description="Number of correct answers out of total")
    results: list[TaskResult]
    feedback: str = Field(description="Overall feedback in the user's language")


easy_writing_eval_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature,top_k=top_k,top_p=top_p),
    name="easy_writing_eval_agent",
    description="Evaluates fill-in-the-blank answers for an easy writing activity",
    instruction="""You are evaluating a fill-in-the-blank writing exercise.

The reference is a JSON string with this shape:
{{
  "tasks": [
    {{"sentence": "sentence with ___ blank", "missing_word": "correct conjugated word"}},
    ...
  ]
}}

Reference: {reference}

The user's answers are a JSON array in the same order as the tasks:
{user_input}

User's language: {user_language}
Target language: {target_language}

For each task, match it to the corresponding user answer by position.
Accept minor spelling variations but require correct conjugation/tense.
Write overall feedback in {user_language}.
Respond only with a JSON object, no preamble, no markdown formatting.
""",
    output_schema=EasyWritingEval,
    output_key="easy_writing_eval",
)


# ─── Medium ──────────────────────────────────────────────────────────────────

class WritingRubric(BaseModel):
    grammar: int = Field(description="Grammar & spelling score from 0 to 25")
    vocabulary: int = Field(description="Vocabulary richness score from 0 to 25")
    coherence: int = Field(description="Coherence & structure score from 0 to 25")
    relevance: int = Field(description="Relevance to the essay topic score from 0 to 25")


class MediumWritingEval(BaseModel):
    total_score: int = Field(description="Sum of all rubric scores, out of 100")
    rubric: WritingRubric
    feedback: str = Field(description="Detailed feedback in the user's language covering each rubric dimension")


medium_writing_eval_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature,top_k=top_k,top_p=top_p),
    name="medium_writing_eval_agent",
    description="Evaluates a short essay for a medium writing activity",
    instruction="""You are evaluating a short essay written by a language learner.

The reference is the essay question/topic that was given to the user:
{reference}

The user's essay:
{user_input}

User's language: {user_language}
Target language: {target_language}

Score the essay on four dimensions, each out of 25:
- grammar: correctness of grammar and spelling in {target_language}
- vocabulary: range and appropriateness of vocabulary
- coherence: logical structure, flow, and clarity
- relevance: how well the essay addresses the given topic

Sum all four for total_score (out of 100).
Write detailed feedback in {user_language} addressing each dimension.
Respond only with a JSON object, no preamble, no markdown formatting.
""",
    output_schema=MediumWritingEval,
    output_key="medium_writing_eval",
)

class HardWritingEval(BaseModel):
    total_score: int = Field(description="Overall score out of 100 based on the rubric")
    rubric: WritingRubric
    feedback: str = Field(description="Detailed feedback in the user's language covering each rubric dimension and suggestions for improvement")

hard_writing_eval_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature,top_k=top_k,top_p=top_p),
    name="hard_writing_eval_agent",
    description="Evaluates a detailed essay for a hard writing activity",
    instruction="""You are evaluating a detailed essay written by a language learner.

The reference is the essay question/topic that was given to the user:
{reference}

The user's essay:
{user_input}

User's language: {user_language}
Target language: {target_language}

Score the essay on four dimensions, each out of 25:
- grammar: correctness of grammar and spelling in {target_language}
- vocabulary: range and appropriateness of vocabulary
- coherence: logical structure, flow, and clarity
- relevance: how well the essay addresses the given topic

Sum all four for total_score (out of 100).
Write detailed feedback in {user_language} addressing each dimension.
Respond only with a JSON object, no preamble, no markdown formatting.
""",
    output_schema=HardWritingEval,
    output_key="hard_writing_eval",
)