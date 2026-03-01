from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    # Devuelve categorias con sus productos relacionados
    return db.query(models.Category).order_by(models.Category.order_index).all()

@router.post("/", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    products = db.query(models.Product).filter(models.Product.category_id == category_id).all()
    for p in products:
        db.query(models.OrderItem).filter(models.OrderItem.product_id == p.id).delete(synchronize_session=False)
        db.delete(p)
    
    db.delete(db_category)
    db.commit()
    return {"ok": True}

@router.put("/{category_id}", response_model=schemas.Category)
def update_category(category_id: int, category_update: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    for key, value in category_update.dict().items():
        setattr(db_category, key, value)
        
    db.commit()
    db.refresh(db_category)
    return db_category
