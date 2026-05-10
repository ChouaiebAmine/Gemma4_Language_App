from fastapi import APIRouter
from database import achievements_collection, user_progress_collection
from bson import ObjectId
from datetime import datetime
from models import AchievementSubmitModel

router = APIRouter(prefix="/achievements", tags=["achievements"])

@router.get("/all")
async def get_all_achievements():
    cursor = achievements_collection.find()
    return await cursor.to_list(None)

@router.post("/submit")
async def submit_achievement(submission: AchievementSubmitModel):
    await user_progress_collection.insert_one(submission.model_dump())
    return {"message": "Achievement submitted"}
