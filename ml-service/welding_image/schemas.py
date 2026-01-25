from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional

class DefectItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    class_: str = Field(..., alias="class")
    confidence: float
    bbox: List[float]

class DefectResponse(BaseModel):
    status: str
    defects: List[DefectItem] = []
    original_image_url: str
    result_image_url: Optional[str] = None
