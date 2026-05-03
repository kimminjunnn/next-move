from fastapi import FastAPI

from app.routes import router

app = FastAPI(title="vision-service")
app.include_router(router)
