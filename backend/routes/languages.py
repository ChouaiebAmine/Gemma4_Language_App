from fastapi import APIRouter, HTTPException, Body
from database import languages_collection, users_collection
from bson import ObjectId
from typing import List
from models import LanguageEnrollmentModel # Assuming this has language_id, name, etc.

router = APIRouter(prefix="/languages", tags=["languages"])

# Fetches all languages from the collection
@router.get("/all")
async def get_all_languages():
    cursor = languages_collection.find()
    languages = await cursor.to_list(length=100)
    
    for lang in languages:
        lang["id"] = str(lang["_id"])
        del lang["_id"]
    return languages

@router.get("/{language_id}")
async def get_language(language_id: str):
    language = await languages_collection.find_one({"_id": ObjectId(language_id)})
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    language["id"] = str(language["_id"])
    del language["_id"]
    return language
@router.post("/enroll/{user_id}")
async def enroll_language(user_id: str, enrollment: LanguageEnrollmentModel):
    await users_collection.update_one(
        {"_id": user_id},
        {"$addToSet": {"enrolled_languages": enrollment.model_dump()}},
        upsert=True
    )
    return {"status": "success", "message": "Language enrolled successfully"}[cite: 7]

# Admin route to add a language to the global list
@router.post("/")
async def create_language(language: dict = Body(...)):
    result = await languages_collection.insert_one(language)
    return {"id": str(result.inserted_id), **language}