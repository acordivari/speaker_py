from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.coverage import CoverageRequest, CoverageResponse
from app.services.coverage import compute_coverage

router = APIRouter(prefix="/coverage", tags=["Coverage"])


@router.post("/", response_model=CoverageResponse)
def coverage(request: CoverageRequest, db: Session = Depends(get_db)):
    """
    Predict the SPL coverage map for a positioned speaker/amplifier rig.

    Each channel carries a ``position_key`` (e.g. ``MAIN_L``) locating it in the
    Mission Ballroom. The engine computes each channel's actual delivered power,
    models every cabinet as a directional source (inverse-square falloff plus
    off-axis dispersion), and samples the combined sound field across the
    audience areas.

    ### Request body

    ```json
    {
      "channels": [
        {
          "position_key": "MAIN_L",
          "label": "Main Left",
          "amplifier_id": 13,
          "speakers": [{"component_id": 1, "count": 6}],
          "wiring": "parallel",
          "bridged": false
        }
      ],
      "cell_size": 10
    }
    ```

    ### Response

    Returns a row-major SPL grid over the SVG viewbox (``None`` outside audience
    areas), plus summary statistics (FOH / front-row / back-wall dB and
    front-to-back uniformity) suitable for direct rendering and scoring.
    """
    return compute_coverage(request, db)
