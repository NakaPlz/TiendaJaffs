from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, timedelta
from database import Base

# Zona horaria Argentina (UTC-3)
ARGENTINA_TZ = timezone(timedelta(hours=-3))

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    image_url = Column(String, nullable=True)
    order_index = Column(Integer, default=0) # Para ordenar en el admin
    
    products = relationship("Product", back_populates="category", order_by="Product.order_index.desc()")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    price = Column(Float)
    image_url = Column(String, nullable=True) # Imagen opcional (req. del usuario)
    available = Column(Boolean, default=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    order_index = Column(Integer, default=0)
    tags = Column(JSON, default=list)  # Ej: ["recomendados", "ofertas"]
    
    category = relationship("Category", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String)
    order_type = Column(String) # 'delivery' o 'take_away'
    delivery_address = Column(String, nullable=True)
    delivery_references = Column(String, nullable=True)
    payment_method = Column(String) # 'efectivo' o 'transferencia'
    total_amount = Column(Float)
    shipping_cost = Column(Float, default=0.0)
    status = Column(String, default="pending") # pending, completed, cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(ARGENTINA_TZ))
    
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price = Column(Float)
    special_instructions = Column(String, nullable=True) # Ej: "sin cebolla"
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class StoreSettings(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, index=True)
    is_open = Column(Boolean, default=True)
    whatsapp_number = Column(String, default="5491100000000")
    delivery_cost = Column(Float, default=1500)
    order_message = Column(String, default="¡Hola! Quisiera hacer el siguiente pedido:")
    schedules = Column(JSON, default=lambda: {
        "monday": {"enabled": True, "slots": [{"open": "12:00", "close": "15:00"}, {"open": "19:30", "close": "23:30"}]},
        "tuesday": {"enabled": True, "slots": [{"open": "12:00", "close": "15:00"}, {"open": "19:30", "close": "23:30"}]},
        "wednesday": {"enabled": True, "slots": [{"open": "12:00", "close": "15:00"}, {"open": "19:30", "close": "23:30"}]},
        "thursday": {"enabled": True, "slots": [{"open": "12:00", "close": "15:00"}, {"open": "19:30", "close": "23:30"}]},
        "friday": {"enabled": True, "slots": [{"open": "12:00", "close": "15:00"}, {"open": "19:30", "close": "23:30"}]},
        "saturday": {"enabled": True, "slots": [{"open": "12:00", "close": "15:00"}, {"open": "19:30", "close": "23:30"}]},
        "sunday": {"enabled": True, "slots": [{"open": "19:00", "close": "23:59"}]}
    })
