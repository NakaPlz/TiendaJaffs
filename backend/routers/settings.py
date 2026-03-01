from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)

@router.get("/", response_model=schemas.StoreSettings)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.StoreSettings).first()
    if not settings:
        # Create default settings if it doesn't exist yet
        settings = models.StoreSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/", response_model=schemas.StoreSettings)
def update_settings(settings_in: schemas.StoreSettingsCreate, db: Session = Depends(get_db)):
    settings = db.query(models.StoreSettings).first()
    if not settings:
        settings = models.StoreSettings(**settings_in.model_dump())
        db.add(settings)
    else:
        for key, value in settings_in.model_dump().items():
            setattr(settings, key, value)
            
    db.commit()
    db.refresh(settings)
    return settings
