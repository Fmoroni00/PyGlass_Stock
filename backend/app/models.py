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
    name = Column(String(100), unique=True, nullable=False)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(String(255), nullable=True)

    # Relación 1 proveedor -> 1 material
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)

    # Inversa: accedo al material de este proveedor
    material = relationship("Material", back_populates="suppliers")

    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


# -------- MATERIALS --------
class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # ej: vidrio, metal
    color = Column(String(50), nullable=True)
    stock = Column(Integer, default=0)
    min_stock = Column(Integer, default=0)

    # Relación 1 material -> muchos proveedores
    suppliers = relationship("Supplier", back_populates="material", cascade="all, delete-orphan")

    purchase_orders = relationship("PurchaseOrder", back_populates="material")
    kardex_entries = relationship("Kardex", back_populates="material")


# -------- PRODUCTS --------
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    color = Column(String(50), nullable=True)
    stock = Column(Integer, default=0)
    min_stock = Column(Integer, default=0)
    sale_price = Column(Float, nullable=False, default=0.0)

    kardex_entries = relationship("Kardex", back_populates="product")


# -------- PURCHASE ORDERS --------
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    quantity = Column(Integer, nullable=False)
    status = Column(String(20), default="pendiente")

    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    supplier = relationship("Supplier", back_populates="purchase_orders")

    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    material = relationship("Material", back_populates="purchase_orders")

    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="purchase_orders")


# -------- KARDEX --------
class Kardex(Base):
    __tablename__ = "kardex"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    movement_type = Column(String(20), nullable=False)  # entrada | salida
    quantity = Column(Integer, nullable=False)

    stock_anterior = Column(Integer, nullable=False)
    stock_nuevo = Column(Integer, nullable=False)
    observaciones = Column(String(255), nullable=True)

    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    material = relationship("Material", back_populates="kardex_entries")
    product = relationship("Product", back_populates="kardex_entries")
    user = relationship("User", back_populates="kardex_entries")
