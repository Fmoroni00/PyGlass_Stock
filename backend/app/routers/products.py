from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/products",
    tags=["products"]
)


# Obtener todos los productos
@router.get("/", response_model=List[schemas.ProductOut])
def get_products(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Product).all()


# Crear producto
@router.post("/", response_model=schemas.ProductOut)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


# Actualizar producto
@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    for key, value in update.dict(exclude_unset=True).items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


# Agregar stock
@router.post("/{product_id}/add", response_model=schemas.ProductOut)
def add_product(
    product_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    product = db.query(models.Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    product.stock += quantity
    db.commit()
    db.refresh(product)
    return product


# Restar stock
@router.post("/{product_id}/remove", response_model=schemas.ProductOut)
def remove_product(
    product_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    product = db.query(models.Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if product.stock < quantity:
        raise HTTPException(status_code=400, detail="Stock insuficiente")

    product.stock -= quantity
    db.commit()
    db.refresh(product)
    return product
