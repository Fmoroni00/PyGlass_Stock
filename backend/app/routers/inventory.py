from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/inventory",
    tags=["inventory"]
)

# -------- MATERIALES --------
@router.get("/materials", response_model=List[schemas.MaterialOut])
def get_materials(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Material).all()


@router.post("/materials", response_model=schemas.MaterialOut)
def create_material(material: schemas.MaterialCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_material = models.Material(**material.dict())
    db.add(new_material)
    db.commit()
    db.refresh(new_material)
    return new_material


@router.put("/materials/{material_id}", response_model=schemas.MaterialOut)
def update_material(material_id: int, update: schemas.MaterialUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")

    for key, value in update.dict(exclude_unset=True).items():
        setattr(material, key, value)

    db.commit()
    db.refresh(material)
    return material


# -------- PRODUCTOS --------
@router.get("/products", response_model=List[schemas.ProductOut])
def get_products(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Product).all()


@router.post("/products", response_model=schemas.ProductOut)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_product = models.Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@router.put("/products/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, update: schemas.ProductUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    for key, value in update.dict(exclude_unset=True).items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)
    return product


# -------- ALERTAS DE STOCK BAJO --------
@router.get("/alerts/materials", response_model=List[schemas.MaterialOut])
def low_stock_materials(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """ Devuelve los materiales cuyo stock es menor al mínimo configurado """
    return db.query(models.Material).filter(models.Material.stock < models.Material.min_stock).all()


@router.get("/alerts/products", response_model=List[schemas.ProductOut])
def low_stock_products(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """ Devuelve los productos cuyo stock es menor al mínimo configurado """
    return db.query(models.Product).filter(models.Product.stock < models.Product.min_stock).all()
