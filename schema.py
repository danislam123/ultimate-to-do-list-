from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class todo_name(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)

class Todocreate(todo_name):
    pass

class is_completed(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    completed: Optional[bool] = None

class todo_date(todo_name):
    id: int
    completed: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True