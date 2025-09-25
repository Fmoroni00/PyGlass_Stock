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
    materials = db.query(models.Material).all()
    return materials


# Obtener una materia prima por ID con sus proveedores
@router.get("/{material_id}", response_model=schemas.MaterialOut)
def get_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material no encontrado")
    return material


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

    old_stock = material.stock

    for key, value in update.dict(exclude_unset=True).items():
        setattr(material, key, value)

    db.commit()
    db.refresh(material)

    # Registrar en Kardex si cambió el stock
    if "stock" in update.dict(exclude_unset=True) and material.stock != old_stock:
        movement_type = "entrada" if material.stock > old_stock else "salida"
        kardex = models.Kardex(
            movement_type=movement_type,
            quantity=abs(material.stock - old_stock),
            stock_anterior=old_stock,
            stock_nuevo=material.stock,
            observaciones="Actualización manual de stock",
            material_id=material.id,
            user_id=current_user.id,
        )
        db.add(kardex)
        db.commit()

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

    old_stock = material.stock
    material.stock += quantity
    db.commit()
    db.refresh(material)

    # Kardex entrada
    kardex = models.Kardex(
        movement_type="entrada",
        quantity=quantity,
        stock_anterior=old_stock,
        stock_nuevo=material.stock,
        observaciones="Ingreso manual de stock",
        material_id=material.id,
        user_id=current_user.id,
    )
    db.add(kardex)
    db.commit()

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

    old_stock = material.stock
    material.stock -= quantity
    db.commit()
    db.refresh(material)

    # Kardex salida
    kardex = models.Kardex(
        movement_type="salida",
        quantity=quantity,
        stock_anterior=old_stock,
        stock_nuevo=material.stock,
        observaciones="Salida manual de stock",
        material_id=material.id,
        user_id=current_user.id,
    )
    db.add(kardex)
    db.commit()

    return material


# Agregar este endpoint a tu archivo app/routers/materials.py existente

@router.get("/{material_id}/suppliers", response_model=List[schemas.SupplierOut])
def get_suppliers_for_material(
        material_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """
    Obtiene los proveedores disponibles para un material específico.
    Si el material tiene un supplier_id específico, devuelve solo ese proveedor.
    Si no, devuelve todos los proveedores disponibles.
    """
    # Verificar que el material existe
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado")

    # Si el material tiene un proveedor específico asignado, devolverlo
    if material.supplier_id:
        supplier = db.query(models.Supplier).filter(models.Supplier.id == material.supplier_id).first()
        if supplier:
            return [supplier]
        else:
            # Si el supplier_id no existe, devolver todos los proveedores
            return db.query(models.Supplier).all()
    else:
        # Si no tiene proveedor específico, devolver todos los proveedores disponibles
        return db.query(models.Supplier).all()