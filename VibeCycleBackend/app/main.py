from datetime import timedelta, datetime, timezone
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlmodel import Session, select
from typing import Annotated

from app.database import get_db
from app.models import User, Tasks
from app.schemas import CreateUserRequest, Token, TokenData
from app.routers import ai, auth
from pydantic import BaseModel

import ollama

app = FastAPI(title="Vibe Cycle")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])

@app.get("/tasks")
def get_tasks(db: Session = Depends(get_db)) -> list[Tasks]:
    return db.exec(select(Tasks)).all()

@app.get("/tasks/{task_name}")
def get_task(task_name: str, db: Session = Depends(get_db)) -> Tasks:
    task: Tasks | None = db.get(Tasks, task_name)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{task_name}' not found")
    return task

@app.post("/tasks", status_code=status.HTTP_201_CREATED)
def create_task(task: Tasks, db: Session = Depends(get_db)) -> dict:
    task: Tasks = Tasks(**task.model_dump())

    if not task.routine_type or task.routine_type.lower() not in ["morning", "evening"]:
        raise HTTPException(status_code=400, detail="Routine type must be either 'morning' or 'evening'")

    existing_tasks = db.exec(select(Tasks)).all()
    for existing in existing_tasks:
        if existing.task_name.lower() == task.task_name.lower() and existing.routine_type.lower() == task.routine_type.lower():
            raise HTTPException(status_code=400, detail=f"Task '{task.task_name}' for {task.routine_type} routine already exists")

    db.add(task)
    db.commit()
    return {"message": "Task created", "To-Do:": task.task_name}

@app.post("/routine")
def generate_routine(routine_type: str, energy_level: int, db: Session = Depends(get_db)) -> dict:
    if routine_type.lower() not in ["morning", "evening"]:
        raise HTTPException(status_code=400, detail="Routine type must be either 'morning' or 'evening'")
    if energy_level < 1 or energy_level > 5:
        raise HTTPException(status_code=400, detail="Energy level must be between 1 and 5")
    tasks: list[Tasks] = db.exec(select(Tasks).where(Tasks.routine_type == routine_type.lower())).all()
    if not tasks:
        raise HTTPException(status_code=404, detail=f"No tasks found for {routine_type} routine")
    prompt: str = f"Generate a {routine_type} routine for someone with an energy level of {energy_level}. Here are some tasks to choose from: {tasks}"
    try:
        response = ollama.generate(model="llama3", prompt=prompt)
        return {"routine": response["text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating routine: {str(e)}")

@app.delete("/tasks/{task_name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_name: str, db: Session = Depends(get_db)) -> None:
    task: Tasks | None = db.get(Tasks, task_name)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{task_name}' not found")
    db.delete(task)
    db.commit()


@app.get("/users")
async def get_users(db: Session = Depends(get_db)) -> list[User]:
    return db.exec(select(User)).all()

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(auth.get_current_user)) -> User:
    return current_user

@app.get("/users/me/items")
async def read_own_items(current_user: User = Depends(auth.get_current_user)) -> dict:
    return [{"item_id": "Foo", "owner_id": current_user.username}]

@app.post("/token")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)) -> Token:
    user: User | None = db.get(User, form_data.username)
    invalid_creds_message = "Incorrect username or password"

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=invalid_creds_message,
        )
    
    if not auth.verify_password(plain_password=form_data.password, hashed_password=user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=invalid_creds_message,
        )
    
    access_token_expires = timedelta(minutes=int(auth.ACCESS_TOKEN_EXPIRE_MINUTES))
    access_token = auth.create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
    return Token(access_token=access_token, token_type="bearer")

@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(new_user: CreateUserRequest, db: Session = Depends(get_db)) -> None:
    hashed_password: str = auth.get_password_hash(new_user.password)
    user: User = User(**new_user.model_dump(), hashed_password=hashed_password)
    db.add(user)
    db.commit()