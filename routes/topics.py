from fastapi import APIRouter, HTTPException
from .database import db
from bson import ObjectId

router = APIRouter()

@router.get("/all")
async def get_all_topics():
    return await db.db["topics"].find().to_list(None)

@router.post("/new")
async def create_topic(topic_data: dict):
         
    result = await db.db["topics"].insert_one(topic_data)
    return {"topic_id": str(result.inserted_id)}