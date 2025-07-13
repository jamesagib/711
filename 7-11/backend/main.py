from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class VideoInput(BaseModel):
    title: str
    description: str

CATEGORIES = ["Entertainment", "Study", "Motivation", "How To", "Money & Career", "Gaming", "Politics"]

# classifier = pipeline("zero-shot-classification", model="typeform/distilbert-base-uncased-mnli")
classifier = pipeline(model="facebook/bart-large-mnli")


@app.post("/classify")
def classify_video(video: VideoInput):
    try:
        input_text = f"{video.title}. {video.description}"
        result = classifier(input_text, candidate_labels=CATEGORIES)
        most_likely = result["labels"][0]
        return {"category": most_likely, "scores": result["scores"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
