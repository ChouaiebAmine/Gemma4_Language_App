from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
from google.genai import types

class Topics(BaseModel):
    topics_base: list[str] = Field(description="The topics in this language: {user_language}") 
    topics_target: list[str] = Field(description="The topics in this language: {target_language}") 


root_agent = Agent(
    model='gemma-4-31b-it',
    generate_content_config=types.GenerateContentConfig(temperature=0.2),
    name='topic_generator_agent',
    description='An agent useful for generating topics for a language learning app',
    instruction='Suggest 3 topics for a language learning app. Choose real-life, practical, every-day topics. You MUST respond ONLY in two languages: (user_language and target_language)',
    output_schema=Topics,
    output_key="topics"
)
