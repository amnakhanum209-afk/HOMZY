
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

app = FastAPI(
    title="HOMZY AI Service",
    description="Local AI assistant for HOMZY",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


@app.get("/")
def home():
    return {
        "message": "Welcome to HOMZY AI Service!",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HOMZY AI"
    }


@app.post("/chat")
async def chat(request: ChatRequest):

    instructions = (
        "You are HOMZY AI, a friendly home rental assistant. "
        "Help tenants and property owners with rental questions, "
        "property searches, recommendations and visits. "
        "Never invent property listings, prices or availability. "
        "Give simple and helpful answers."
    )

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(
                "http://localhost:11434/api/chat",
                json={
                    "model": "qwen2.5:0.5b",
                    "messages": [
                        {
                            "role": "system",
                            "content": instructions
                        },
                        {
                            "role": "user",
                            "content": request.message
                        }
                    ],
                    "stream": False
                }
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Ollama could not generate a response."
            )

        data = response.json()

        return {
            "reply": data["message"]["content"],
            "status": "success"
        }

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Please start Ollama."
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="HOMZY AI took too long to respond."
        )
