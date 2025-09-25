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
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class SupplierCreate(SupplierBase):
    material_id: int  # 🔑 Se pide aquí porque al crear un proveedor debe asignarse un material


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    material_id: Optional[int] = None


class SupplierOut(SupplierBase):
    id: int
    material_id: int  # 🔑 Para saber qué material vende este proveedor

    class Config:
        orm_mode = True


# -------- MATERIALS --------
class MaterialBase(BaseModel):
    name: str
    type: str
    color: Optional[str] = None
    stock: int = 0
    min_stock: int = 0


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
    suppliers: List[SupplierOut] = Field(default_factory=list)  # ✅ más seguro que "=[]"

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
    supplier_id: int
    material_id: int
    quantity: int


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderUpdate(BaseModel):
    supplier_id: Optional[int] = None
    material_id: Optional[int] = None
    quantity: Optional[int] = None
    status: Optional[str] = None


class PurchaseOrderOut(PurchaseOrderBase):
    id: int
    date: Optional[datetime]
    status: str
    supplier_name: Optional[str] = None  # Campo adicional para mostrar el nombre del proveedor

    class Config:
        orm_mode = True


# -------- KARDEX --------
class KardexBase(BaseModel):
    movement_type: str
    quantity: int
    stock_anterior: int
    stock_nuevo: int
    observaciones: Optional[str] = None
    material_id: Optional[int] = None
    product_id: Optional[int] = None
    user_id: int


class KardexCreate(KardexBase):
    pass


class KardexOut(KardexBase):
    id: int
    date: datetime

    class Config:
        orm_mode = True
