from fastapi import APIRouter, HTTPException
from database import languages_collection, users_collection
from bson import ObjectId
from datetime import datetime
from models import LanguageEnrollmentModel

router = APIRouter(prefix="/languages", tags=["languages"])

@router.get("/all")
async def get_all_languages():
    cursor = languages_collection.find()
    return await cursor.to_list(None)

@router.get("/enrolled/{user_id}")
async def get_enrolled_languages(user_id: str):
    user = await users_collection.find_one({"_id": user_id})
    if user:
        return user.get("enrolled_languages", [])
    raise HTTPException(status_code=404, detail="User not found")

@router.post("/add")
async def enroll_language(user_id: str, enrollment: LanguageEnrollmentModel):
    await users_collection.update_one(
        {"_id": user_id},
        {"$addToSet": {"enrolled_languages": enrollment.model_dump()}},
        upsert=True
    )
    return {"message": "Language enrolled successfully"}
