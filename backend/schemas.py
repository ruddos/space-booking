from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class AmenityBase(BaseModel):
    name: str

class AmenityCreate(AmenityBase):
    pass

class AmenityResponse(AmenityBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None
    price_per_hour: int
    capacity: int
    image_url: Optional[str] = None

class RoomCreate(RoomBase):
    amenities: List[str] = []

class RoomResponse(RoomBase):
    id: int
    is_active: bool
    amenities: List[AmenityResponse] = []
    
    model_config = ConfigDict(from_attributes=True)