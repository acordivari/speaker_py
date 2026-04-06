from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import create_tables, SessionLocal
from app.data.seed import seed_database
from app.api.manufacturers import router as manufacturers_router
from app.api.components import router as components_router
from app.api.validation import router as validation_router
from app.api.soundcheck import router as soundcheck_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed reference data on startup."""
    create_tables()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="Sound Design API",
    description=(
        "Educational API for live sound engineers. "
        "Browse professional speaker and amplifier components, "
        "then validate multi-channel configurations for impedance, "
        "power matching, and connector compatibility."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the React dev server (and any localhost origin) during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
app.include_router(manufacturers_router, prefix=API_PREFIX)
app.include_router(components_router, prefix=API_PREFIX)
app.include_router(validation_router, prefix=API_PREFIX)
app.include_router(soundcheck_router, prefix=API_PREFIX)

# Serve the audio directory so the browser can stream the FLAC file directly.
# StaticFiles handles Range requests, so large files stream correctly.
_audio_dir = Path(__file__).resolve().parents[1] / "audio"
_audio_dir.mkdir(exist_ok=True)
app.mount("/audio", StaticFiles(directory=str(_audio_dir)), name="audio")


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "service": "Sound Design API"}
