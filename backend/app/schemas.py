from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

# -------- USERS --------
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int

    class Config:
        orm_mode = True


# -------- SUPPLIERS --------
class SupplierBase(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    material_id: Optional[int] = None  # Ahora puede ser NULL

class SupplierUpdate(SupplierBase):
    material_id: Optional[int] = None

class SupplierOut(SupplierBase):
    id: int
    material_id: Optional[int] = None  # Puede ser NULL

    class Config:
        orm_mode = True


# -------- MATERIALS --------
class MaterialBase(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    stock: Optional[int] = 0
    min_stock: Optional[int] = 0

class MaterialCreate(MaterialBase):
    pass

class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    stock: Optional[int] = None
    min_stock: Optional[int] = None

class MaterialOut(MaterialBase):
    id: int
    suppliers: List[SupplierOut] = Field(default_factory=list)

    class Config:
        orm_mode = True


# -------- PRODUCTS --------
class ProductBase(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    stock: Optional[int] = 0
    min_stock: Optional[int] = 0
    sale_price: Optional[float] = None

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
    supplier_id: Optional[int] = None
    material_id: Optional[int] = None
    quantity: Optional[int] = None

class PurchaseOrderCreate(PurchaseOrderBase):
    pass

class PurchaseOrderUpdate(PurchaseOrderBase):
    status: Optional[str] = None

class PurchaseOrderOut(PurchaseOrderBase):
    id: int
    date: Optional[datetime] = None
    status: Optional[str] = None
    supplier_name: Optional[str] = None
    user_name: Optional[str] = None
    user_id: int

    class Config:
        orm_mode = True


# -------- KARDEX --------
class KardexBase(BaseModel):
    movement_type: Optional[str] = None
    quantity: Optional[int] = None
    stock_anterior: Optional[int] = None
    stock_nuevo: Optional[int] = None
    observaciones: Optional[str] = None
    material_id: Optional[int] = None
    product_id: Optional[int] = None
    user_id: Optional[int] = None

class KardexCreate(KardexBase):
    pass

class KardexOut(KardexBase):
    id: int
    date: Optional[datetime] = None

    class Config:
        orm_mode = True
