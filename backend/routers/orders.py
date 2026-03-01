from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, timedelta

import models
import schemas
from database import get_db

# Zona horaria Argentina (UTC-3)
ARGENTINA_TZ = timezone(timedelta(hours=-3))

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("/", response_model=List[schemas.Order])
def get_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.created_at.desc()).all()

@router.post("/", response_model=schemas.Order)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    # 1. Calcular el total amount y armar los items validando precios
    total_amount = order.shipping_cost
    
    db_order = models.Order(
        customer_name=order.customer_name,
        order_type=order.order_type,
        delivery_address=order.delivery_address,
        delivery_references=order.delivery_references,
        payment_method=order.payment_method,
        shipping_cost=order.shipping_cost,
        status="pending",
        total_amount=0, # Inicial temporal
        created_at=datetime.now(ARGENTINA_TZ).replace(tzinfo=None) # Hora Argentina sin tz info para PostgreSQL
    )
    
    db.add(db_order)
    db.flush() # Para obtener el order.id
    
    db_items = []
    
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product '{item.product_id}' not found")
        
        unit_price = product.price
        total_amount += (unit_price * item.quantity)
        
        db_item = models.OrderItem(
            order_id=db_order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=unit_price,
            special_instructions=item.special_instructions
        )
        db_items.append(db_item)
        db.add(db_item)
        
    db_order.total_amount = total_amount
    db.commit()
    db.refresh(db_order)
    
    return db_order

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Eliminar items vinculados manualmente
    db.query(models.OrderItem).filter(models.OrderItem.order_id == order_id).delete(synchronize_session=False)
    
    db.delete(db_order)
    db.commit()
    return {"ok": True}
