from pydantic import BaseModel, Field


class CreateRoutineRequest(BaseModel):
    routine: dict[str, str]


class CreateSavedRoutine(BaseModel):
    title: str | None = None
    content: str


class UpdateSavedRoutine(BaseModel):
    title: str | None = None


# require non-empty username and password
class CreateUserRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str 