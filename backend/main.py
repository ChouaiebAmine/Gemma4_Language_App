from fastapi import FastAPI
from routes.topics.topics import router as topic_router
from routes.activities import router as activities_router
from routes.evaluate import router as eval_router
from routes.achievements import router as achievements_router
from routes.languages import router as languages_router
from routes.analytics import router as analytics_router
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:3000",  # React Native default
    "http://localhost:19006",
      "http://localhost:8081"  # Expo default
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Adjust this in production to specific domains
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.get("/")
async def read_root():
    return {"message": "welcome to the language app"}

app.include_router(topic_router)
app.include_router(activities_router)
app.include_router(eval_router)
app.include_router(achievements_router)
app.include_router(languages_router)
app.include_router(analytics_router)

