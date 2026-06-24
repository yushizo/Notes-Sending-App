from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import sqlite3
import uuid
import re

app = FastAPI(title="Secret Note API")

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")

def init_db():
    conn = sqlite3.connect("notes.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            is_burn INTEGER DEFAULT 0
        )
    """)
    conn.commit()
    conn.close()

init_db()

class NoteInput(BaseModel):
    content: str
    is_burn: bool = False
    title: str = None  # NEW: Optional custom title

@app.post("/api/notes")
def create_note(note: NoteInput):
    conn = sqlite3.connect("notes.db")
    cursor = conn.cursor()
    
    # Handle the custom title if provided
    if note.title:
        # Convert to a URL-safe format (e.g., "My Note 1!" becomes "my-note-1")
        safe_title = re.sub(r'[^a-zA-Z0-9-]', '-', note.title.strip().replace(' ', '-')).lower()
        # Remove double dashes
        safe_title = re.sub(r'-+', '-', safe_title).strip('-')
        
        if not safe_title:
             safe_title = str(uuid.uuid4())
             
        note_id = safe_title
        
        # Check for collisions
        cursor.execute("SELECT id FROM notes WHERE id = ?", (note_id,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail=f"The title '{note_id}' is already taken.")
    else:
        note_id = str(uuid.uuid4())
        
    is_burn_int = 1 if note.is_burn else 0
    
    cursor.execute("INSERT INTO notes (id, content, is_burn) VALUES (?, ?, ?)", (note_id, note.content, is_burn_int))
    conn.commit()
    conn.close()
    
    return {"id": note_id}

@app.get("/api/notes/{note_id}")
def read_note(note_id: str):
    conn = sqlite3.connect("notes.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT content, is_burn FROM notes WHERE id = ?", (note_id,))
    row = cursor.fetchone()
    
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Note not found.")
        
    content = row[0]
    is_burn = row[1]
    
    if is_burn == 1:
        cursor.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        conn.commit()
        
    conn.close()
    
    return {"content": content, "is_burn": bool(is_burn)}