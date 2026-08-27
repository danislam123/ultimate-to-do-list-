from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import Session
from db import Base, engine, get_db

# 1. Database Model (Matches your MySQL table structure: todo_id, todo_name, is_completed)
class Todo(Base):
    __tablename__ = "todos"  # Update this string if your MySQL table has a different name

    todo_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    todo_name = Column(String(255), nullable=False)
    is_completed = Column(Boolean, default=False)

# Ensure tables are created in the database
Base.metadata.create_all(bind=engine)

# 2. Pydantic Schemas for Requests & Responses
class TodoCreate(BaseModel):
    todo_name: str

class TodoUpdate(BaseModel):
    is_completed: bool

class TodoResponse(BaseModel):
    todo_id: int
    todo_name: str
    is_completed: bool

    class Config:
        from_attributes = True

# 3. FastAPI App & Routes
app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/todos", response_model=list[TodoResponse])
def get_all_todos(db: Session = Depends(get_db)):
    return db.query(Todo).all()

@app.post("/todos", response_model=TodoResponse)
def create_todo(todo: TodoCreate, db: Session = Depends(get_db)):
    db_todo = Todo(todo_name=todo.todo_name)
    db.add(db_todo)
    db.commit()
    db.refresh(db_todo)
    return db_todo

@app.put("/todos/{todo_id}", response_model=TodoResponse)
def update_todo_status(todo_id: int, data: TodoUpdate, db: Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.todo_id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db_todo.is_completed = data.is_completed
    db.commit()
    db.refresh(db_todo)
    return db_todo

@app.delete("/todos/{todo_id}")
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    db_todo = db.query(Todo).filter(Todo.todo_id == todo_id).first()
    if not db_todo:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_todo)
    db.commit()
    return {"message": "Task deleted successfully"}
