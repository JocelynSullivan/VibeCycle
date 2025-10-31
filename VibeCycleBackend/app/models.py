from sqlmodel import SQLModel, Field
from typing import Optional

class User(SQLModel, table=True):
    __tablename__ = "users"
    username: str = Field(primary_key=True)
    hashed_password: str

class Tasks(SQLModel, table=True):
    task_name: str = Field(primary_key=True)
    routine_type: str | None = None
    necessity_level: int | None = None
    difficulty_level: int | None = None
    amount_of_time: int | None = None
    owner: str | None = None


class SavedRoutine(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    owner: str
    title: str | None = None
    content: str
