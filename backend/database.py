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


import asyncio
from database import languages_collection

async def seed_languages():
    # Define the languages you want to offer
    sample_languages = [
        {"name": "Spanish", "code": "ES", "native_speakers": 485000, "level": "Beginner"},
        {"name": "French", "code": "FR", "native_speakers": 77000, "level": "Intermediate"},
        {"name": "German", "code": "DE", "native_speakers": 76000, "level": "Beginner"},
        {"name": "Japanese", "code": "JA", "native_speakers": 125000, "level": "Advanced"},
        {"name": "Italian", "code": "IT", "native_speakers": 64000, "level": "Beginner"}
    ]
    
    # Clear existing (optional) and insert new ones
    await languages_collection.delete_many({})
    result = await languages_collection.insert_many(sample_languages)
    print(f"Successfully added {len(result.inserted_ids)} languages to the database!")

if __name__ == "__main__":
    asyncio.run(seed_languages())