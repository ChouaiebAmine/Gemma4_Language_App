from fastapi import APIRouter, HTTPException
from database import database, evaluations_collection, activities_collection, users_collection
from bson import ObjectId
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/user/{user_id}")
async def get_user_stats(user_id: str):
    """Get comprehensive user statistics."""
    
    # Get evaluation records
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$type", 
            "avg_score": {"$avg": "$result.total_score"}, 
            "total_completed": {"$sum": 1}
        }}
    ]
    cursor = database["evaluations"].aggregate(pipeline)
    activity_stats = await cursor.to_list(None)
    
    # Calculate overall stats
    total_activities = 0
    total_score = 0
    activity_breakdown = {}
    
    for stat in activity_stats:
        activity_type = stat.get("_id", "unknown")
        count = stat.get("total_completed", 0)
        avg = stat.get("avg_score", 0)
        
        total_activities += count
        total_score += avg * count
        activity_breakdown[activity_type] = {
            "completed": count,
            "average_score": round(avg, 2)
        }
    
    overall_avg = round(total_score / total_activities, 2) if total_activities > 0 else 0
    
    return {
        "user_id": user_id,
        "total_activities_completed": total_activities,
        "overall_average_score": overall_avg,
        "activity_breakdown": activity_breakdown,
        "streak": 0,
        "points": total_activities * 10,
        "lessons_completed": total_activities,
        "correct_answers": int(total_activities * (overall_avg / 100)) if overall_avg > 0 else 0,
        "learning_time": total_activities * 5,
        "progress_percentage": min(100, (total_activities / 20) * 100)
    }


@router.get("/progress/{user_id}")
async def get_user_progress(user_id: str):
    """Get detailed learning progress."""
    
    # Get all evaluations for this user
    cursor = evaluations_collection.find({"user_id": user_id})
    evaluations = await cursor.to_list(None)
    
    if not evaluations:
        return {
            "user_id": user_id,
            "total_lessons": 0,
            "completed_lessons": 0,
            "progress_percentage": 0,
            "recent_activities": []
        }
    
    # Sort by date and get recent activities
    evaluations.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
    recent = evaluations[:5]
    
    recent_activities = []
    for eval_record in recent:
        recent_activities.append({
            "type": eval_record.get("type"),
            "difficulty": eval_record.get("difficulty"),
            "score": eval_record.get("result", {}).get("total_score", 0),
            "completed_at": eval_record.get("created_at")
        })
    
    return {
        "user_id": user_id,
        "total_lessons": len(evaluations),
        "completed_lessons": len(evaluations),
        "progress_percentage": min(100, (len(evaluations) / 20) * 100),
        "recent_activities": recent_activities
    }


@router.get("/streak/{user_id}")
async def get_user_streak(user_id: str):
    """Get user's learning streak."""
    
    # Get evaluations from the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    cursor = evaluations_collection.find({
        "user_id": user_id,
        "created_at": {"$gte": thirty_days_ago}
    })
    recent_evals = await cursor.to_list(None)
    
    if not recent_evals:
        return {
            "user_id": user_id,
            "current_streak": 0,
            "longest_streak": 0,
            "total_days_active": 0
        }
    
    # Group by date
    days_active = set()
    for eval_record in recent_evals:
        created_at = eval_record.get("created_at", datetime.utcnow())
        day = created_at.date()
        days_active.add(day)
    
    # Calculate current streak
    today = datetime.utcnow().date()
    current_streak = 0
    check_date = today
    
    for i in range(30):
        if check_date in days_active:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    
    return {
        "user_id": user_id,
        "current_streak": current_streak,
        "longest_streak": current_streak,
        "total_days_active": len(days_active)
    }


@router.get("/learning-path/{user_id}")
async def get_learning_path(user_id: str, language_id: str = None):
    """Get user's learning path and recommendations, optionally filtered by language."""    
    # Get user's completed activities (optionally scoped to a language)
    query = {"user_id": user_id}
    if language_id:
        query["language_id"] = language_id
    cursor = evaluations_collection.find(query)
    evaluations = await cursor.to_list(None)
    
    # Get activity types completed
    completed_types = set()
    difficulty_levels = {}
    
    for eval_record in evaluations:
        activity_type = eval_record.get("type")
        difficulty = eval_record.get("difficulty", 0)
        
        completed_types.add(activity_type)
        
        if activity_type not in difficulty_levels:
            difficulty_levels[activity_type] = difficulty
        else:
            difficulty_levels[activity_type] = max(difficulty_levels[activity_type], difficulty)
    
    # Recommend next activities
    all_types = ["listening", "writing", "reading"]
    recommendations = []
    
    for activity_type in all_types:
        if activity_type not in completed_types:
            recommendations.append({
                "type": activity_type,
                "reason": f"Start learning {activity_type} skills",
                "difficulty": 0
            })
        else:
            current_difficulty = difficulty_levels.get(activity_type, 0)
            if current_difficulty < 2:
                recommendations.append({
                    "type": activity_type,
                    "reason": f"Advance your {activity_type} skills",
                    "difficulty": current_difficulty + 1
                })
    
    return {
        "user_id": user_id,
        "completed_types": list(completed_types),
        "difficulty_levels": difficulty_levels,
        "total_activities_completed": len(evaluations),
        "recommendations": recommendations
    }


@router.get("/{user_id}")
async def get_performance_analytics(user_id: str):
    """Legacy endpoint for performance analytics."""
    
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$type", 
            "avg_score": {"$avg": "$result.total_score"}, 
            "total_completed": {"$sum": 1}
        }}
    ]
    cursor = database["evaluations"].aggregate(pipeline)
    return await cursor.to_list(None)