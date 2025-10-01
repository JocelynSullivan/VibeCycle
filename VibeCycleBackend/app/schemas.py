from pydantic import BaseModel

class CreateRoutineRequest(BaseModel):
    routine: dict[str, str]

class CreateUserRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str 