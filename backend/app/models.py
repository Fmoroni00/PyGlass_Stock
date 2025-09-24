from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


# User table
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)

    # Relationship to purchase orders
    purchase_orders = relationship("PurchaseOrder", back_populates="user")


# Materials table
class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # e.g., 'glass'
    color = Column(String(50), nullable=True)
    stock = Column(Integer, default=0)
    min_stock = Column(Integer, default=0)
    supplier_name = Column(String(100), nullable=True)

# Products table
class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)
    color = Column(String(50), nullable=True)
    stock = Column(Integer, default=0)
    min_stock = Column(Integer, default=0)
    sale_price = Column(Float, nullable=False, default=0.0)


# Purchase orders table
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    supplier_name = Column(String(100), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String(20), default="pendiente")  # New status field

    # Relationship to user
    user_id = Column(Integer, ForeignKey("users.id"))
    user = relationship("User", back_populates="purchase_orders")

    # Relationship to material
    material = relationship("Material", backref="purchase_orders")
