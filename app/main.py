from fastapi import FastAPI

from app.routers import ai, auth

app = FastAPI(title="<Replace this with your title>")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])