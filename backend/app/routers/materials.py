from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/materials",
    tags=["materials"]
)


# Obtener todas las materias primas
@router.get("/", response_model=List[schemas.MaterialOut])
def get_materials(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Material).all()


# Crear materia prima
@router.post("/", response_model=schemas.MaterialOut)
def create_material(
    material: schemas.MaterialCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_material = models.Material(**material.dict())
    db.add(new_material)
    db.commit()
    db.refresh(new_material)
    return new_material


# Actualizar materia prima
@router.put("/{material_id}", response_model=schemas.MaterialOut)
def update_material(
    material_id: int,
    update: schemas.MaterialUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")

    for key, value in update.dict(exclude_unset=True).items():
        setattr(material, key, value)

    db.commit()
    db.refresh(material)
    return material


# Agregar stock
@router.post("/{material_id}/add", response_model=schemas.MaterialOut)
def add_material(
    material_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    material = db.query(models.Material).get(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")

    material.stock += quantity
    db.commit()
    db.refresh(material)
    return material


# Restar stock
@router.post("/{material_id}/remove", response_model=schemas.MaterialOut)
def remove_material(
    material_id: int,
    quantity: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    material = db.query(models.Material).get(material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")

    if material.stock < quantity:
        raise HTTPException(status_code=400, detail="Stock insuficiente")

    material.stock -= quantity
    db.commit()
    db.refresh(material)
    return material
