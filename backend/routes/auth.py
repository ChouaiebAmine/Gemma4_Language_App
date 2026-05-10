from fastapi import APIRouter, HTTPException, status
from models import UserRegisterModel, UserLoginModel, UserModel, HashHelper
from database import users_collection
from bson import ObjectId
import secrets

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
async def register(user_data: UserRegisterModel):
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = {
        "email": user_data.email,
        "password": HashHelper.get_password_hash(user_data.password),
        "name": user_data.name,
        "enrolled_languages": [],
        "created_at": ObjectId().generation_time
    }
    
    result = await users_collection.insert_one(new_user)
    
    # Generate a dummy token
    token = secrets.token_hex(16)
    
    return {
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "email": new_user["email"],
            "name": new_user["name"]
        }
    }

@router.post("/login")
async def login(credentials: UserLoginModel):
    user = await users_collection.find_one({"email": credentials.email})
    
    if not user or not HashHelper.verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate a dummy token
    token = secrets.token_hex(16)
    
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"]
        }
    }

@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out"}
