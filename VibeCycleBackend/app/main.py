from datetime import timedelta, datetime, timezone
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlmodel import Session, select
from typing import Annotated

from app.database import get_db
from app.models import User, Tasks
from app.schemas import CreateUserRequest, Token, CreateRoutineRequest
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

### GET ###

@app.get("/tasks")
def get_tasks(db: Session = Depends(get_db)) -> list[Tasks]:
    return db.exec(select(Tasks)).all()

@app.get("/tasks/{task_name}")
def get_task(task_name: str, db: Session = Depends(get_db)) -> Tasks:
    task: Tasks | None = db.get(Tasks, task_name)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{task_name}' not found")
    return task

@app.get("/users")
async def get_users(db: Session = Depends(get_db)) -> list[User]:
    users = db.exec(select(User)).all()

    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    return users

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(auth.get_current_user)) -> User:
    return current_user

@app.get("/users/me/items")
async def read_own_items(current_user: User = Depends(auth.get_current_user)) -> list[dict]:
    return [{"item_id": "Foo", "owner_id": current_user.username}]

### POST ###

@app.post("/tasks", status_code=status.HTTP_201_CREATED)
def create_task(task: Tasks, db: Session = Depends(get_db)) -> dict:
    task: Tasks = Tasks(task_name=task.task_name)

    db.add(task)
    db.commit()
    return {'response': "task created"}

@app.post("/routine")
def generate_routine(energy_level: int, db: Session = Depends(get_db)) -> dict:
    # if routine_type.lower() not in ["morning", "evening"]:
    #     raise HTTPException(status_code=400, detail="Routine type must be either 'morning' or 'evening'")
    # if energy_level < 1 or energy_level > 5:
    #     raise HTTPException(status_code=400, detail="Energy level must be between 1 and 5")
    # tasks: list[Tasks] = db.exec(select(Tasks).where(Tasks.routine_type == routine_type.lower())).all()
    tasks: list[Tasks] = db.exec(select(Tasks)).all()
    if not tasks:
        # raise HTTPException(status_code=404, detail=f"No tasks found for {routine_type} routine")
        raise HTTPException(status_code=404, detail=f"No tasks found")
    prompt: str = f"Generate one morning routine and one evening routine in a list format that include the estimated amount of time for each task with the total estimated amount of time at the end of each list for someone with an energy level of {energy_level}. Include optional additional tasks that can be done if the person has a little more energy. Choose some or all of these tasks: {tasks}"
    try:
        response = ollama.generate(model="llama3", prompt=prompt)
        return {"routine": response['response']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating routine: {str(e)}")

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

### DELETE ###

@app.delete("/tasks/{task_name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_name: str, db: Session = Depends(get_db)) -> None:
    task: Tasks | None = db.get(Tasks, task_name)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task '{task_name}' not found")
    db.delete(task)
    db.commit()

@app.delete("/users/{username}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(username: str, db: Session = Depends(get_db)) -> None:
    user: User | None = db.get(User, username)
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")
    db.delete(user)
    db.commit()