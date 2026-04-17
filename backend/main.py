from fastapi import FastAPI
import routes.languages as languages
import routes.achievements as achievements
import routes.analytics as analytics
import routes.topics as topics  

app = FastAPI()

app.include_router(languages.router, prefix="/languages",tags=["languages"])
app.include_router(achievements.router, prefix="/achievements",tags=["achievements"])
app.include_router(analytics.router, prefix="/analytics",tags=["analytics"])
app.include_router(topics.router, prefix="/topics",tags=["topics"])

@app.get("/")
async def read_root():
    return {"message": "welcome to the language app"}