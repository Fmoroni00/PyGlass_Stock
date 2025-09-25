from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/suppliers",
    tags=["suppliers"]
)


# 🔹 Obtener todos los proveedores
@router.get("/", response_model=List[schemas.SupplierOut])
def get_suppliers(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    suppliers = db.query(models.Supplier).all()
    for s in suppliers:
        if s.material_id:
            material = db.query(models.Material).filter(models.Material.id == s.material_id).first()
            s.material_name = material.name if material else None
    return suppliers


# 🔹 Obtener un proveedor por ID
@router.get("/{supplier_id}", response_model=schemas.SupplierOut)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")

    if supplier.material_id:
        material = db.query(models.Material).filter(models.Material.id == supplier.material_id).first()
        supplier.material_name = material.name if material else None

    return supplier


# 🔹 Obtener proveedores filtrados por material
@router.get("/by-material/{material_id}", response_model=List[schemas.SupplierOut])
def get_suppliers_by_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Devuelve solo los proveedores que están asociados a un material específico.
    Ideal para usar en el paso de selección de proveedor al crear una orden de compra.
    """
    suppliers = db.query(models.Supplier).filter(models.Supplier.material_id == material_id).all()
    if not suppliers:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay proveedores para este material")

    for s in suppliers:
        material = db.query(models.Material).filter(models.Material.id == s.material_id).first()
        s.material_name = material.name if material else None

    return suppliers


# 🔹 Alias para que el frontend pueda llamar a /materials/{id}/suppliers
@router.get("/materials/{material_id}/suppliers", response_model=List[schemas.SupplierOut])
def get_suppliers_for_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Alias de /by-material/{material_id}, necesario porque el frontend espera esta ruta.
    """
    suppliers = db.query(models.Supplier).filter(models.Supplier.material_id == material_id).all()
    if not suppliers:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No hay proveedores para este material")

    for s in suppliers:
        material = db.query(models.Material).filter(models.Material.id == s.material_id).first()
        s.material_name = material.name if material else None

    return suppliers


# 🔹 Crear un nuevo proveedor
@router.post("/", response_model=schemas.SupplierOut, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier: schemas.SupplierCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing_supplier = db.query(models.Supplier).filter(models.Supplier.name == supplier.name).first()
    if existing_supplier:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe un proveedor con este nombre")

    material = db.query(models.Material).filter(models.Material.id == supplier.material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado")

    new_supplier = models.Supplier(
        name=supplier.name,
        contact_person=supplier.contact_person,
        phone=supplier.phone,
        email=supplier.email,
        address=supplier.address,
        material_id=supplier.material_id
    )

    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)

    new_supplier.material_name = material.name
    return new_supplier


# 🔹 Actualizar proveedor existente
@router.put("/{supplier_id}", response_model=schemas.SupplierOut)
def update_supplier(
    supplier_id: int,
    supplier: schemas.SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")

    if supplier.name:
        existing_supplier = db.query(models.Supplier).filter(
            models.Supplier.name == supplier.name,
            models.Supplier.id != supplier_id
        ).first()
        if existing_supplier:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe otro proveedor con este nombre")

    if supplier.material_id:
        material = db.query(models.Material).filter(models.Material.id == supplier.material_id).first()
        if not material:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado")
        db_supplier.material_id = supplier.material_id

    update_data = supplier.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_supplier, key, value)

    db.commit()
    db.refresh(db_supplier)

    if db_supplier.material_id:
        material = db.query(models.Material).filter(models.Material.id == db_supplier.material_id).first()
        db_supplier.material_name = material.name

    return db_supplier


# 🔹 Eliminar un proveedor
@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")

    db.delete(db_supplier)
    db.commit()
    return {"message": "Proveedor eliminado correctamente"}
