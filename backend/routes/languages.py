from fastapi import APIRouter, HTTPException
from database import languages_collection, users_collection
from bson import ObjectId
from datetime import datetime
from models import LanguageEnrollmentModel

router = APIRouter(prefix="/languages", tags=["languages"])

@router.get("/all")
async def get_all_languages():
    cursor = languages_collection.find()
    languages = await cursor.to_list(None)
    for lang in languages:
        lang["_id"] = str(lang.get("_id"))
    return languages


@router.get("/{language_id}")
async def get_language(language_id: str):
    """Get a single language by ID."""
    try:
        oid = ObjectId(language_id)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid language_id: {language_id}")
    
    language = await languages_collection.find_one({"_id": oid})
    if not language:
        raise HTTPException(status_code=404, detail=f"Language {language_id} not found")
    
    language["_id"] = str(language["_id"])
    return language


@router.post("/")
async def create_language(language_data: dict):
    """Create a new language."""
    result = await languages_collection.insert_one(language_data)
    language_data["_id"] = str(result.inserted_id)
    return language_data


@router.put("/{language_id}")
async def update_language(language_id: str, language_data: dict):
    """Update a language."""
    try:
        oid = ObjectId(language_id)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid language_id: {language_id}")
    
    result = await languages_collection.update_one(
        {"_id": oid},
        {"$set": language_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Language {language_id} not found")
    
    language = await languages_collection.find_one({"_id": oid})
    language["_id"] = str(language["_id"])
    return language


@router.delete("/{language_id}")
async def delete_language(language_id: str):
    """Delete a language."""
    try:
        oid = ObjectId(language_id)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid language_id: {language_id}")
    
    result = await languages_collection.delete_one({"_id": oid})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Language {language_id} not found")
    
    return {"message": "Language deleted successfully"}


@router.get("/enrolled/{user_id}")
async def get_enrolled_languages(user_id: str):
    user = await users_collection.find_one({"_id": user_id})
    if user:
        return user.get("enrolled_languages", [])
    raise HTTPException(status_code=404, detail="User not found")


@router.post("/{language_id}/enroll/{user_id}")
async def enroll_language(language_id: str, user_id: str, enrollment: LanguageEnrollmentModel = None):
    """Enroll a user in a language."""
    try:
        oid = ObjectId(language_id)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid language_id: {language_id}")
    
    enrollment_data = enrollment.model_dump() if enrollment else {"code": language_id, "started_at": datetime.utcnow()}
    
    await users_collection.update_one(
        {"_id": user_id},
        {"$addToSet": {"enrolled_languages": enrollment_data}},
        upsert=True
    )
    return {"message": "Language enrolled successfully"}


@router.post("/add")
async def enroll_language_legacy(user_id: str, enrollment: LanguageEnrollmentModel):
    """Legacy endpoint for language enrollment."""
    await users_collection.update_one(
        {"_id": user_id},
        {"$addToSet": {"enrolled_languages": enrollment.model_dump()}},
        upsert=True
    )
    return {"message": "Language enrolled successfully"}
