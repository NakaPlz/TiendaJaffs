from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# --- PRODUCTS ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    available: bool = True
    order_index: int = 0
    category_id: int
    tags: Optional[List[str]] = []

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    class Config:
        from_attributes = True

# --- CATEGORIES ---
class CategoryBase(BaseModel):
    name: str
    image_url: Optional[str] = None
    order_index: int = 0

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    products: List[Product] = []
    class Config:
        from_attributes = True

# --- ORDERS ---
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    special_instructions: Optional[str] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    unit_price: float
    product: Product
    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    customer_name: str
    order_type: str # 'delivery' o 'take_away'
    delivery_address: Optional[str] = None
    delivery_references: Optional[str] = None
    payment_method: str
    shipping_cost: float = 0.0

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: int
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItem]
    class Config:
        from_attributes = True

# --- SETTINGS ---
class StoreSettingsBase(BaseModel):
    is_open: bool
    whatsapp_number: str
    delivery_cost: float
    order_message: str
    schedules: Optional[dict] = None

class StoreSettingsCreate(StoreSettingsBase):
    pass

class StoreSettings(StoreSettingsBase):
    id: int
    class Config:
        from_attributes = True
