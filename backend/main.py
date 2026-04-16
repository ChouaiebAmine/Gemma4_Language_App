from fastapi import FastAPI
from routes.topics.topics import router as topic_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()


@app.get("/")
async def read_root():
    return {"message": "welcome to the language app"}

app.include_router(topic_router)