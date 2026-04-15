from motor.motor_asyncio import AsyncIOMotorClient
import os

class Database:
    client: AsyncIOMotorClient = None
    db = None

db = Database()

async def connect_to_mongo():
    db.client = AsyncIOMotorClient("mongodb://localhost:27017")
    db.db = db.client.your_database_name

async def close_mongo_connection():
    db.client.close()