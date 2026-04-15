from fastapi import FastAPI
import routes.languages as languages
app = FastAPI()

app.include_router(languages.router, prefix="/languages",tags=["languages"])
@app.get("/")
async def read_root():
    return {"message": "welcome to the language app"}