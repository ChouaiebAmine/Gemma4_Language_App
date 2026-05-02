from fastapi import APIRouter, HTTPException
from typing import List
from bson import ObjectId

from agents.topic_generator.agent import root_agent as topic_generator_agent
from agents.topic_generator.agent import Topics
from google.adk.sessions import InMemorySessionService
from google.adk.runners import Runner
from google.genai import types

import json
from uuid import uuid4
from database import topics_collection
from models import TopicModel
from datetime import datetime

session_service = InMemorySessionService()
APP_NAME = "Language Learning App"
USER_ID = "user"

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("/")
async def get_topics(language_id: str = None, user_lang: str = "english", target_lang: str = "spanish"):
    """
    Fetch topics from DB or generate them using the AI agent.
    Topics are cached per (language_id, user_lang, target_lang) so switching
    the native language or target language correctly regenerates them.
    """
    # 1. Check if topics already exist for this exact combo
    if language_id:
        cursor = topics_collection.find({
            "language_id": language_id,
            "user_lang": user_lang,
            "target_lang": target_lang,
        })
        existing_docs = await cursor.to_list(length=100)
        if existing_docs:
            formatted_topics = []
            for doc in existing_docs:
                doc_id = str(doc.get("_id"))
                base = doc.get("topics_base", [])
                target = doc.get("topics_target", [])
                for i in range(len(base)):
                    formatted_topics.append({
                        "id": f"{doc_id}_{i}",
                        "name": base[i],
                        "target_name": target[i] if i < len(target) else "",
                        "language_id": language_id
                    })
            return formatted_topics

    # 2. If no topics found, trigger the AI Agent
    session = await session_service.create_session(
        app_name=APP_NAME, 
        user_id=USER_ID, 
        session_id=str(uuid4()),
        state={
            "user_language": user_lang,   
            "target_language": target_lang, 
        }
    )

    runner = Runner(app_name=APP_NAME, agent=topic_generator_agent, session_service=session_service, auto_create_session=True)

    content = types.Content(role="user", parts=[types.Part(text="start")])

    events = runner.run(user_id=USER_ID, session_id=session.id, new_message=content)
    
    for event in events:
        if event.is_final_response():
            text = event.content.parts[0].text
            topics_data = Topics.model_validate_json(text)
            
            # 3. Save to MongoDB including the lang keys for correct cache lookup
            topic_doc = {
                "language_id": language_id,
                "user_lang": user_lang,
                "target_lang": target_lang,
                "topics_base": topics_data.topics_base,
                "topics_target": topics_data.topics_target,
                "created_at": datetime.utcnow()
            }
            inserted = await topics_collection.insert_one(topic_doc)
            
            formatted_topics = []
            for i in range(len(topics_data.topics_base)):
                formatted_topics.append({
                    "id": f"{str(inserted.inserted_id)}_{i}",
                    "name": topics_data.topics_base[i],
                    "target_name": topics_data.topics_target[i],
                    "language_id": language_id
                })
            
            return formatted_topics
            
    return {"message": "No topics generated"}


@router.get("/{topic_id}")
async def get_topic(topic_id: str):
    # topic_id might be "mongoId_index"
    if "_" in topic_id:
        try:
            mongo_id, index = topic_id.split("_")
            doc = await topics_collection.find_one({"_id": ObjectId(mongo_id)})
        except:
            raise HTTPException(status_code=400, detail="Invalid topic ID format")
        if doc:
            base = doc.get("topics_base", [])
            target = doc.get("topics_target", [])
            idx = int(index)
            return {
                "id": topic_id,
                "name": base[idx] if idx < len(base) else "",
                "target_name": target[idx] if idx < len(target) else "",
                "language_id": doc.get("language_id")
            }
    else:
        try:
            doc = await topics_collection.find_one({"_id": ObjectId(topic_id)})
        except:
            raise HTTPException(status_code=400, detail="Invalid topic ID format")
        if doc:
            doc["id"] = str(doc.pop("_id"))
            return doc
    raise HTTPException(status_code=404, detail="Topic not found")

@router.post("/")
async def create_topic(topic: TopicModel):
    new_topic = await topics_collection.insert_one(topic.model_dump())
    return {"id": str(new_topic.inserted_id)}

@router.get("/language/{language_id}")
async def get_topics_by_language(language_id: str):
    cursor = topics_collection.find({"language_id": language_id})
    existing_docs = await cursor.to_list(length=100)
    formatted_topics = []
    for doc in existing_docs:
        doc_id = str(doc.get("_id"))
        base = doc.get("topics_base", [])
        target = doc.get("topics_target", [])
        for i in range(len(base)):
            formatted_topics.append({
                "id": f"{doc_id}_{i}",
                "name": base[i],
                "target_name": target[i] if i < len(target) else "",
                "language_id": language_id
            })
    return formatted_topics