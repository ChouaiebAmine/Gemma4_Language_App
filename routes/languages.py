from fastapi import APIRouter,HTTPException
from .database import db
from bson import ObjectId
import datetime
router = APIRouter()

@router.get("/all")
async def get_all_languages():
    return db.db["languages"].find().to_list(None)

@router.get("/enrolled/{user_id}")
async def get_enrolled_languages(user_id: str):
    user = await db.db["users"].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.get("enrolled_languages", [])

@router.post("/add")
async def add_language(user_id: str,language_code: str):
    await db.db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"enrolled_languages": {"code": language_code, "started_at": datetime.now()}}}
    )
    return {"status":"Enrolled successfully"}   
