from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.validation import ValidationRequest, ValidationResponse
from app.services.compatibility import validate_configuration

router = APIRouter(prefix="/validate", tags=["Validation"])


@router.post("/", response_model=ValidationResponse)
def validate(request: ValidationRequest, db: Session = Depends(get_db)):
    """
    Validate a multi-channel speaker / amplifier configuration.

    ### Request body

    ```json
    {
      "channels": [
        {
          "label": "Main Left",
          "amplifier_id": 13,
          "speakers": [{"component_id": 1, "count": 6}],
          "wiring": "parallel",
          "bridged": false
        },
        {
          "label": "Sub Array",
          "amplifier_id": 14,
          "speakers": [{"component_id": 3, "count": 4}],
          "wiring": "parallel",
          "bridged": false
        }
      ]
    }
    ```

    ### Response

    Returns per-channel metrics, a list of compatibility issues with
    educational explanations, and a system-level summary.

    Issue severities:
    - **error** — Will cause hardware damage or system failure. Must be fixed.
    - **warning** — May degrade performance. Should be reviewed.
    - **info** — Best-practice recommendation.
    """
    return validate_configuration(request, db)
