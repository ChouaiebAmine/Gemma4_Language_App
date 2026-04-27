import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_DETAILS = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "language_app")

client = AsyncIOMotorClient(MONGO_DETAILS)
database = client[DB_NAME]

# For backward compatibility with some routes
db = database 

# Collections
topics_collection = database.get_collection("topics")
activities_collection = database.get_collection("activities")
evaluations_collection = database.get_collection("evaluations")
languages_collection = database.get_collection("languages")
users_collection = database.get_collection("users")
achievements_collection = database.get_collection("achievements")
user_progress_collection = database.get_collection("user_progress")
activity_logs_collection = database.get_collection("activity_logs")
