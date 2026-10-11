
from fastapi import FastAPI

from routes.recommendations import router as recommendations_router


app = FastAPI(
    title="SmartWallet AI API",
    description="AI-powered credit card rewards optimization",
    version="0.1.0"
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "SmartWallet AI Backend"
    }


app.include_router(recommendations_router)
