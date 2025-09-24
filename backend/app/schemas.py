from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# -------- USERS --------
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    class Config:
        orm_mode = True


# -------- MATERIALS --------
class MaterialBase(BaseModel):
    name: str
    type: str
    color: Optional[str] = None
    stock: int = 0
    min_stock: int = 0
    supplier_name: Optional[str] = None

class MaterialCreate(MaterialBase):
    pass

class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    stock: Optional[int] = None
    min_stock: Optional[int] = None
    supplier_name: Optional[str] = None

class MaterialOut(MaterialBase):
    id: int
    class Config:
        orm_mode = True


# -------- PRODUCTS --------
class ProductBase(BaseModel):
    name: str
    type: str
    color: Optional[str] = None
    stock: int = 0
    min_stock: int = 0
    sale_price: float

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    stock: Optional[int] = None
    min_stock: Optional[int] = None
    sale_price: Optional[float] = None

class ProductOut(ProductBase):
    id: int
    class Config:
        orm_mode = True


# -------- PURCHASE ORDERS --------
class PurchaseOrderBase(BaseModel):
    supplier_name: str
    material_id: int
    quantity: int

class PurchaseOrderCreate(PurchaseOrderBase):
    pass

class PurchaseOrderOut(PurchaseOrderBase):
    id: int
    date: Optional[datetime]  # ✅ acepta NULL
    status: str
    class Config:
        orm_mode = True
