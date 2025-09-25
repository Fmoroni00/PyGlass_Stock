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

    old_stock = product.stock

    for key, value in update.dict(exclude_unset=True).items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    # Kardex si se modificó stock
    if "stock" in update.dict(exclude_unset=True) and product.stock != old_stock:
        movement_type = "entrada" if product.stock > old_stock else "salida"
        kardex = models.Kardex(
            movement_type=movement_type,
            quantity=abs(product.stock - old_stock),
            stock_anterior=old_stock,
            stock_nuevo=product.stock,
            observaciones="Actualización manual de stock (producto)",
            product_id=product.id,
            user_id=current_user.id,
        )
        db.add(kardex)
        db.commit()

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

    old_stock = product.stock
    product.stock += quantity
    db.commit()
    db.refresh(product)

    # Kardex entrada
    kardex = models.Kardex(
        movement_type="entrada",
        quantity=quantity,
        stock_anterior=old_stock,
        stock_nuevo=product.stock,
        observaciones="Ingreso manual de stock (producto)",
        product_id=product.id,
        user_id=current_user.id,
    )
    db.add(kardex)
    db.commit()

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

    old_stock = product.stock
    product.stock -= quantity
    db.commit()
    db.refresh(product)

    # Kardex salida
    kardex = models.Kardex(
        movement_type="salida",
        quantity=quantity,
        stock_anterior=old_stock,
        stock_nuevo=product.stock,
        observaciones="Salida manual de stock (producto)",
        product_id=product.id,
        user_id=current_user.id,
    )
    db.add(kardex)
    db.commit()

    return product
