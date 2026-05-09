import os
from fastapi import FastAPI
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
    # Expanded list of global languages
    sample_languages = [
        # Original languages
        {"name": "Spanish", "code": "ES", "native_speakers": 485000, "level": "Beginner"},
        {"name": "French", "code": "FR", "native_speakers": 77000, "level": "Intermediate"},
        {"name": "German", "code": "DE", "native_speakers": 76000, "level": "Beginner"},
        {"name": "Japanese", "code": "JA", "native_speakers": 125000, "level": "Advanced"},
        {"name": "Italian", "code": "IT", "native_speakers": 64000, "level": "Beginner"},
        
        # New additions
        {"name": "English", "code": "EN", "native_speakers": 380000, "level": "Beginner"},
        {"name": "Mandarin Chinese", "code": "ZH", "native_speakers": 930000, "level": "Advanced"},
        {"name": "Arabic", "code": "AR", "native_speakers": 370000, "level": "Advanced"},
        {"name": "Hindi", "code": "HI", "native_speakers": 345000, "level": "Intermediate"},
        {"name": "Portuguese", "code": "PT", "native_speakers": 230000, "level": "Beginner"},
        {"name": "Russian", "code": "RU", "native_speakers": 150000, "level": "Intermediate"},
        {"name": "Korean", "code": "KO", "native_speakers": 80000, "level": "Advanced"},
        {"name": "Turkish", "code": "TR", "native_speakers": 80000, "level": "Intermediate"},
        {"name": "Vietnamese", "code": "VI", "native_speakers": 85000, "level": "Intermediate"},
        {"name": "Dutch", "code": "NL", "native_speakers": 25000, "level": "Beginner"},
        {"name": "Swedish", "code": "SV", "native_speakers": 10000, "level": "Beginner"},
        {"name": "Greek", "code": "EL", "native_speakers": 13000, "level": "Intermediate"},
        {"name": "Polish", "code": "PL", "native_speakers": 40000, "level": "Intermediate"},
        {"name": "Indonesian", "code": "ID", "native_speakers": 43000, "level": "Beginner"},
        {"name": "Bengali", "code": "BN", "native_speakers": 230000, "level": "Intermediate"}
    ]
    
    # Clear existing and insert new ones
    await languages_collection.delete_many({})
    result = await languages_collection.insert_many(sample_languages)
    print(f"Successfully added {len(result.inserted_ids)} languages to the database!")

async def load_languages():
    result = await languages_collection.find({}).to_list()
    if len(result) == 0:
        await seed_languages()




if __name__ == "__main__":
    asyncio.run(seed_languages())