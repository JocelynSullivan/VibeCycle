from datetime import timedelta, datetime, timezone
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlmodel import Session, select
from sqlalchemy import text
from typing import Annotated

from app.database import get_db
from app.models import User, Tasks, SavedRoutine
from app.schemas import CreateUserRequest, Token, CreateRoutineRequest, UpdateSavedRoutine
from app.routers import ai, auth
from pydantic import BaseModel
from app.routers.auth import get_current_user
from app.schemas import CreateSavedRoutine

import ollama

app = FastAPI(title="Vibe Cycle")


# Allow calls from the frontend dev server and provide permissive headers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    # Return a JSON response for uncaught exceptions so the frontend can see details
    # and the CORS middleware will still attach the Access-Control-Allow-* headers.
    from fastapi.responses import JSONResponse
    import traceback

    tb = traceback.format_exc()
    return JSONResponse(status_code=500, content={"detail": "Internal server error", "error": str(exc), "trace": tb})

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])

### GET ###

@app.get("/tasks")
def get_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[Tasks]:
    # return only tasks owned by the authenticated user
    return db.exec(select(Tasks).where(Tasks.owner == current_user.username)).all()

@app.get("/tasks/{task_name}")
def get_task(task_name: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Tasks:
    task: Tasks | None = db.get(Tasks, task_name)
    if not task or task.owner != current_user.username:
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
def create_task(task: Tasks, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    # Normalize incoming task to only include the name for lookup
    incoming = Tasks(task_name=task.task_name)

    # Check for existing task with the same primary key
    existing: Tasks | None = db.get(Tasks, incoming.task_name)
    if existing:
        # If it belongs to another user, refuse to create/update
        if existing.owner and existing.owner != current_user.username:
            raise HTTPException(status_code=409, detail="Task name already exists for another user")
        # Otherwise treat as an idempotent update for the same owner
        existing.owner = current_user.username
        # copy optional fields if provided
        if getattr(task, "routine_type", None) is not None:
            existing.routine_type = task.routine_type
        if getattr(task, "necessity_level", None) is not None:
            existing.necessity_level = task.necessity_level
        if getattr(task, "difficulty_level", None) is not None:
            existing.difficulty_level = task.difficulty_level
        if getattr(task, "amount_of_time", None) is not None:
            existing.amount_of_time = task.amount_of_time
        db.add(existing)
        db.commit()
        db.refresh(existing)
        return {"response": "task updated"}

    # No existing task, create new and set owner
    incoming.owner = current_user.username
    # copy optional metadata
    incoming.routine_type = getattr(task, "routine_type", None)
    incoming.necessity_level = getattr(task, "necessity_level", None)
    incoming.difficulty_level = getattr(task, "difficulty_level", None)
    incoming.amount_of_time = getattr(task, "amount_of_time", None)

    db.add(incoming)
    db.commit()
    db.refresh(incoming)
    return {"response": "task created"}

@app.post("/routine")
def generate_routine(energy_level: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    # if routine_type.lower() not in ["morning", "evening"]:
    #     raise HTTPException(status_code=400, detail="Routine type must be either 'morning' or 'evening'")
    # if energy_level < 1 or energy_level > 5:
    #     raise HTTPException(status_code=400, detail="Energy level must be between 1 and 5")
    # tasks: list[Tasks] = db.exec(select(Tasks).where(Tasks.routine_type == routine_type.lower())).all()
    tasks: list[Tasks] = db.exec(select(Tasks).where(Tasks.owner == current_user.username)).all()
    if not tasks:
        return {"routine": "No tasks found. Add some tasks first to generate routines."}

    # Build a readable list of user-entered tasks to include in the prompt
    task_descriptions: list[str] = []
    for t in tasks:
        desc = t.task_name
        # if the task has an estimated amount_of_time stored, include it for context
        if getattr(t, "amount_of_time", None):
            desc += f" ({t.amount_of_time} min)"
        task_descriptions.append(desc)
    task_list = "; ".join(task_descriptions)

    prompt: str = (
        f"Generate one morning routine and one evening routine in a list format that includes the estimated amount of time for each task with the total estimated amount of time at the end of each list for someone with an energy level of {energy_level}. "
        f"Include optional additional tasks that can be done if the person has a little more energy. "
        f"Prefer tasks from the user's available tasks list and use that list as the primary source. "
        f"User tasks: {task_list}. "
    f"If a task from the list is not applicable, you may skip it, but favor items from the provided list. "
    f"Do not use the '*' character anywhere in the output; avoid asterisk bullets. Use hyphens ('-') or numbered lists instead."
    f" Produce ONLY a list of tasks with an estimated duration for each task, followed by a single line with the total estimated time. "
    f"Do NOT include section headings, explanations, optional sections, or any extra commentary. "
    f"Each task must appear on its own line in one of these formats (examples):\n"
    f"- Task name (10 min)\n"
    f"1. Task name - 10 min\n"
    f"At the end include exactly one line that starts with 'Total estimated time:' followed by the total (e.g. 'Total estimated time: 45 min')."
    f" If the user has no tasks, return a single line: 'No tasks available.'"
    )
    try:
        response = ollama.generate(model="llama3", prompt=prompt)
        return {"routine": response['response']}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating routine: {str(e)}")


@app.post("/routines", status_code=status.HTTP_201_CREATED)
def save_routine(body: CreateSavedRoutine, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    # store a routine snapshot
    routine = SavedRoutine(owner=current_user.username, title=body.title, content=body.content)
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return {"id": routine.id, "owner": routine.owner, "title": routine.title}


@app.get("/routines")
def list_routines(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[SavedRoutine]:
    routines = db.exec(select(SavedRoutine).where(SavedRoutine.owner == current_user.username)).all()
    return routines


@app.get("/routines/{routine_id}")
def get_routine(routine_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SavedRoutine:
    routine: SavedRoutine | None = db.get(SavedRoutine, routine_id)
    if not routine or routine.owner != current_user.username:
        raise HTTPException(status_code=404, detail="Routine not found")
    return routine


@app.put("/routines/{routine_id}")
def update_routine(routine_id: int, body: UpdateSavedRoutine, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    routine: SavedRoutine | None = db.get(SavedRoutine, routine_id)
    if not routine or routine.owner != current_user.username:
        raise HTTPException(status_code=404, detail="Routine not found")
    if body.title is not None:
        routine.title = body.title
    # optionally update content if provided
    if hasattr(body, 'content') and getattr(body, 'content') is not None:
        routine.content = getattr(body, 'content')
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return {"id": routine.id, "title": routine.title}


@app.delete("/routines/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(routine_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    routine: SavedRoutine | None = db.get(SavedRoutine, routine_id)
    if not routine or routine.owner != current_user.username:
        raise HTTPException(status_code=404, detail="Routine not found")
    db.delete(routine)
    db.commit()


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
def delete_task(task_name: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    task: Tasks | None = db.get(Tasks, task_name)
    if not task or task.owner != current_user.username:
        raise HTTPException(status_code=404, detail=f"Task '{task_name}' not found")
    db.delete(task)
    db.commit()


@app.delete("/users/empty", status_code=status.HTTP_204_NO_CONTENT)
def delete_empty_users(db: Session = Depends(get_db)) -> None:
    # delete any users with empty username
    db.exec(text("""DELETE FROM users WHERE COALESCE(username, '') = ''"""))
    db.commit()


@app.delete("/users/{username}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(username: str, db: Session = Depends(get_db)) -> None:
    user: User | None = db.get(User, username)
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")
    db.delete(user)
    db.commit()


@app.get("/admin/tasks")
def admin_list_tasks(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    """Temporary diagnostic endpoint: lists all tasks with owner for debugging.
    Only callable by authenticated users in the local environment. Remove after use."""
    tasks = db.exec(select(Tasks)).all()
    return [{"task_name": t.task_name, "owner": t.owner} for t in tasks]