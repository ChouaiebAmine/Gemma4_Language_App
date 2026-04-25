from fastapi import FastAPI
from routes.topics.topics import router as topic_router
from routes.activities import router as activities_router
from routes.evaluate import router as eval_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()


@app.get("/")
async def read_root():
    return {"message": "welcome to the language app"}

app.include_router(topic_router)
app.include_router(activities_router)
app.include_router(eval_router)