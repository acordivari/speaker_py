from pathlib import Path
from fastapi import APIRouter

router = APIRouter(prefix="/soundcheck", tags=["Soundcheck"])

AUDIO_DIR = Path(__file__).resolve().parents[2] / "audio"
AUDIO_FILE = AUDIO_DIR / "soundcheck.flac"


@router.get("/info")
def soundcheck_info():
    """
    Return availability metadata for the soundcheck audio file.
    The frontend uses this to enable/disable the Run Soundcheck button.
    """
    if AUDIO_FILE.exists():
        stat = AUDIO_FILE.stat()
        return {
            "available": True,
            "filename": AUDIO_FILE.name,
            "size_mb": round(stat.st_size / 1_048_576, 2),
            "url": "/audio/soundcheck.flac",
        }
    return {
        "available": False,
        "filename": None,
        "size_mb": None,
        "url": None,
    }
