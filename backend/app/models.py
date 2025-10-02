from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

# -------- USERS --------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

    purchase_orders = relationship("PurchaseOrder", back_populates="user")
    kardex_entries = relationship("Kardex", back_populates="user")


# -------- SUPPLIERS --------
class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=True)  # nullable=True
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)

    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)  # nullable=True
    material = relationship("Material", back_populates="suppliers")

    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


# -------- MATERIALS --------
class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=True)
    type = Column(String(50), nullable=True)
    color = Column(String(50), nullable=True)
    stock = Column(Integer, default=0, nullable=True)
    min_stock = Column(Integer, default=0, nullable=True)

    suppliers = relationship("Supplier", back_populates="material", cascade="all, delete-orphan")
    purchase_orders = relationship("PurchaseOrder", back_populates="material")
    kardex_entries = relationship("Kardex", back_populates="material")


# -------- PRODUCTS --------
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=True)
    type = Column(String(50), nullable=True)
    color = Column(String(50), nullable=True)
    stock = Column(Integer, default=0, nullable=True)
    min_stock = Column(Integer, default=0, nullable=True)
    sale_price = Column(Float, default=0.0, nullable=True)

    kardex_entries = relationship("Kardex", back_populates="product")


# -------- PURCHASE ORDERS --------
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    quantity = Column(Integer, nullable=True)
    status = Column(String(20), default="pendiente")

    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    supplier = relationship("Supplier", back_populates="purchase_orders")

    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    material = relationship("Material", back_populates="purchase_orders")

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="purchase_orders")


# -------- KARDEX --------
class Kardex(Base):
    __tablename__ = "kardex"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    movement_type = Column(String(20), nullable=True)  # nullable=True
    quantity = Column(Integer, nullable=True)
    stock_anterior = Column(Integer, nullable=True)
    stock_nuevo = Column(Integer, nullable=True)
    observaciones = Column(String(255), nullable=True)

    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    material = relationship("Material", back_populates="kardex_entries")
    product = relationship("Product", back_populates="kardex_entries")
    user = relationship("User", back_populates="kardex_entries")
