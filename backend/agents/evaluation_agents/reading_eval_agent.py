from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types
from dotenv import load_dotenv
from llm import model, temperature, top_k, top_p

load_dotenv()


# ─── Level 1 ─────────────────────────────────────────────────────────────────

class WordMatchResult(BaseModel):
    word: str
    user_answer: str
    correct_translation: str
    correct: bool

class EasyReadingEval(BaseModel):
    total_score: int
    results: list[WordMatchResult]
    feedback: str = Field(description="Overall feedback in the user's language")


# No agent needed — simple equality check
def evaluate_easy_reading(answers: list[str], content: dict) -> EasyReadingEval:
    tasks = content["tasks"]
    results = [
        WordMatchResult(
            word=task["word"],
            user_answer=answer,
            correct_translation=task["translation"],
            correct=answer.strip().lower() == task["translation"].strip().lower(),
        )
        for task, answer in zip(tasks, answers)
    ]
    total = sum(r.correct for r in results)
    return EasyReadingEval(total_score=total, results=results, feedback=f"{total}/{len(results)} correct.")


# ─── Level 2 ─────────────────────────────────────────────────────────────────

class BlankResult(BaseModel):
    sentence: str
    user_answer: str
    correct_word: str
    correct: bool

class MediumReadingEval(BaseModel):
    total_score: int
    results: list[BlankResult]
    feedback: str = Field(description="Overall feedback in the user's language")


# No agent needed — simple equality check

def evaluate_medium_reading(answers: list[str], content: dict) -> MediumReadingEval:
    tasks = content["tasks"]
    results = [
        BlankResult(
            sentence=task["sentence"],
            user_answer=answer,
            correct_word=task["missing_word"],
            correct=answer.strip().lower() == task["missing_word"].strip().lower(),
        )
        for task, answer in zip(tasks, answers)
    ]
    total = sum(r.correct for r in results)
    return MediumReadingEval(total_score=total, results=results, feedback=f"{total}/{len(results)} correct.")


# ─── Level 3 ─────────────────────────────────────────────────────────────────

class QuestionResult(BaseModel):
    question: str
    user_answer: str
    correct: bool
    model_answer: str = Field(description="A good answer in the user's language")

class HardReadingEval(BaseModel):
    total_score: int
    results: list[QuestionResult]
    feedback: str = Field(description="Overall feedback in the user's language")


hard_reading_eval_agent = Agent(
    model=model,
    generate_content_config=types.GenerateContentConfig(temperature=temperature, top_p=top_p, top_k=top_k),
    name="hard_reading_eval_agent",
    description="Evaluates open-ended comprehension answers for a hard reading activity",
    instruction="""You are evaluating a reading comprehension exercise.

The reference contains the paragraph and questions in this JSON format:
{{
  "paragraph": "...",
  "questions": ["question 1", "question 2", "question 3"]
}}

Reference: {reference}

The user's answers are a JSON array in the same order as the questions:
{user_input}

User's language: {user_language}
Target language: {target_language}

For each question, evaluate whether the user's answer is correct based solely on the paragraph.
Provide a model answer in {user_language} for each question.
Write overall feedback in {user_language}.
Respond only with a JSON object, no preamble, no markdown formatting.
""",
    output_schema=HardReadingEval,
    output_key="hard_reading_eval",
)