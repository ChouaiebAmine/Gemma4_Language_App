from fastapi import APIRouter, HTTPException
from database import database, evaluations_collection, activities_collection, users_collection
from bson import ObjectId
from datetime import datetime, timedelta

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/user/{user_id}")
async def get_user_stats(user_id: str):
    """Get comprehensive user statistics."""
    
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
    
    days_active = set()
    for eval_record in recent_evals:
        created_at = eval_record.get("created_at", datetime.utcnow())
        day = created_at.date()
        days_active.add(day)
    
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


@router.get("/topic-progress/{user_id}")
async def get_topic_progress(user_id: str, language_id: str = None):
    """
    Return per-topic completion status for easy difficulty.
    A topic is considered 'easy_completed' when the user has submitted at least one
    evaluation for ALL THREE activity types (listening, writing, reading) at difficulty=0
    for activities belonging to that topic.

    Returns:
      {
        "topic_completions": {
          "<topic_id>": {
            "easy_completed": bool,
            "easy_types_done": ["listening", "writing", ...],
            "medium_completed": bool,
            "hard_completed": bool
          }
        },
        "easy_completed_count": int,
        "total_topics_with_activities": int,
        "easy_progress_pct": int
      }
    """
    ALL_TYPES = {"listening", "writing", "reading"}

    # 1. Fetch all evaluations for this user (optionally filtered by language)
    query = {"user_id": user_id}
    if language_id:
        query["language_id"] = language_id
    cursor = evaluations_collection.find(query)
    evaluations = await cursor.to_list(None)

    # 2. For each evaluation, look up the activity to get its topic_id
    #    Group: { topic_id -> { difficulty -> set(types) } }
    topic_done: dict = {}  # topic_id -> { 0: set, 1: set, 2: set }

    for ev in evaluations:
        activity_id_str = ev.get("reference") or ev.get("activity_id", "")
        ev_type = ev.get("type", "")
        ev_diff = ev.get("difficulty", 0)

        # Try to get topic_id from the evaluation itself first (future-proof)
        topic_id = ev.get("topic_id", "")

        if not topic_id and activity_id_str:
            try:
                act = await activities_collection.find_one({"_id": ObjectId(activity_id_str)})
                if act:
                    topic_id = act.get("topic_id", "")
            except Exception:
                pass

        if not topic_id:
            continue

        if topic_id not in topic_done:
            topic_done[topic_id] = {0: set(), 1: set(), 2: set()}

        topic_done[topic_id][ev_diff].add(ev_type)

    # 3. Build per-topic completion map
    topic_completions = {}
    for topic_id, diff_map in topic_done.items():
        easy_types = diff_map.get(0, set())
        medium_types = diff_map.get(1, set())
        hard_types = diff_map.get(2, set())

        topic_completions[topic_id] = {
            "easy_completed": ALL_TYPES.issubset(easy_types),
            "easy_types_done": list(easy_types),
            "medium_completed": ALL_TYPES.issubset(medium_types),
            "medium_types_done": list(medium_types),
            "hard_completed": ALL_TYPES.issubset(hard_types),
            "hard_types_done": list(hard_types),
        }

    # 4. Also include topics that have activities but no evaluations yet
    #    so the frontend knows total topic count
    act_query = {}
    if language_id:
        # activities don't store language_id directly, but we can filter by topic_ids
        pass  # leave empty — frontend already knows which topics belong to the language
    cursor2 = activities_collection.find({"difficulty": 0}, {"topic_id": 1})
    acts = await cursor2.to_list(None)
    all_topic_ids_with_easy_activities = {
        a.get("topic_id") for a in acts if a.get("topic_id")
    }

    for tid in all_topic_ids_with_easy_activities:
        if tid not in topic_completions:
            topic_completions[tid] = {
                "easy_completed": False,
                "easy_types_done": [],
                "medium_completed": False,
                "medium_types_done": [],
                "hard_completed": False,
                "hard_types_done": [],
            }

    easy_completed_count = sum(
        1 for v in topic_completions.values() if v["easy_completed"]
    )
    total_topics = len(topic_completions)
    easy_pct = round((easy_completed_count / total_topics) * 100) if total_topics > 0 else 0

    return {
        "topic_completions": topic_completions,
        "easy_completed_count": easy_completed_count,
        "total_topics_with_activities": total_topics,
        "easy_progress_pct": easy_pct,
    }


@router.get("/learning-path/{user_id}")
async def get_learning_path(user_id: str, language_id: str = None):
    """Get user's learning path and recommendations, optionally filtered by language."""    
    query = {"user_id": user_id}
    if language_id:
        query["language_id"] = language_id
    cursor = evaluations_collection.find(query)
    evaluations = await cursor.to_list(None)
    
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