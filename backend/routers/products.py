from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=List[schemas.Product])
def get_products(category_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Product).order_by(models.Product.order_index.desc())
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    return query.all()

@router.post("/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    # Validamos que existe la categoria
    db_cat = db.query(models.Category).filter(models.Category.id == product.category_id).first()
    if not db_cat:
        raise HTTPException(status_code=400, detail="Invalid category_id")
        
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product_update: schemas.ProductCreate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    for key, value in product_update.dict().items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Eliminar order_items vinculados para no disparar Foreign Key constraints de BD
    db.query(models.OrderItem).filter(models.OrderItem.product_id == product_id).delete(synchronize_session=False)
        
    db.delete(db_product)
    db.commit()
    return {"ok": True}
