from fastapi import APIRouter, HTTPException
from database import database
from bson import ObjectId

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/{user_id}")
async def get_performance_analytics(user_id: str):
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$activity_type", 
            "avg_score": {"$avg": "$score"}, # calculate average scores per activity type 
            "total_completed": {"$sum": 1}
        }}
    ]
    cursor = database["activity_logs"].aggregate(pipeline)
    return await cursor.to_list(None)
