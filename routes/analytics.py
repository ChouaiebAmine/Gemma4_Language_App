from fastapi import APIRouter, HTTPException
from .database import db
from bson import ObjectId

router = APIRouter()

@router.get("/analytics/{user_id}")
async def get_performance_analytics(user_id: str):
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$activity_type", 
            "avg_score": {"$avg": "$score"}, # calculate average scores per activity type 
            "total_completed": {"$sum": 1}
        }}
    ]
    cursor = db.db["activity_logs"].aggregate(pipeline)
    return await cursor.to_list(None)