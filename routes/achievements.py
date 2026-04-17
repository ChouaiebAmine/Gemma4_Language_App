from fastapi import APIRouter, HTTPException
from .database import db
from bson import ObjectId
import datetime

router = APIRouter()

@router.get("/achievements/all")
async def get_all_achievements():
 
    return await db.db["achievements"].find().to_list(None)

@router.post("/achievements/submit")
async def submit_progress(user_id: str, progress_data: dict):
    
    await db.db["user_progress"].insert_one({
        "user_id": user_id,
        "data": progress_data,
        "timestamp": datetime.now()
    })
    return {"status": "Progress recorded"}