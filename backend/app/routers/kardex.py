from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/kardex",
    tags=["kardex"]
)


@router.get("/", response_model=List[schemas.KardexOut])
def get_kardex(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
        material_id: Optional[int] = None,
        product_id: Optional[int] = None,
        limit: int = 100
):
    """
    Obtiene el historial de movimientos del kardex del usuario autenticado.
    Opcionalmente puede filtrar por material_id o product_id.
    """
    query = db.query(models.Kardex).filter(models.Kardex.user_id == current_user.id)

    # Aplicar filtros opcionales
    if material_id:
        query = query.filter(models.Kardex.material_id == material_id)
    if product_id:
        query = query.filter(models.Kardex.product_id == product_id)

    # Ordenar por fecha descendente (más recientes primero) y limitar resultados
    kardex_records = query.order_by(models.Kardex.date.desc()).limit(limit).all()

    # Enriquecer cada registro con información adicional
    for record in kardex_records:
        # Agregar nombre del usuario
        user = db.query(models.User).filter(models.User.id == record.user_id).first()
        if user:
            record.username = user.username

        # Agregar nombre del material si existe
        if record.material_id:
            material = db.query(models.Material).filter(models.Material.id == record.material_id).first()
            if material and material.name:
                record.material_name = material.name
            else:
                record.material_name = f"Material ID: {record.material_id}"

        # Agregar nombre del producto si existe
        if record.product_id:
            product = db.query(models.Product).filter(models.Product.id == record.product_id).first()
            if product and product.name:
                record.product_name = product.name
            else:
                record.product_name = f"Producto ID: {record.product_id}"

    return kardex_records


@router.get("/material/{material_id}", response_model=List[schemas.KardexOut])
def get_material_kardex(
        material_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
        limit: int = 50
):
    """
    Obtiene el historial de movimientos de un material específico.
    """
    # Verificar que el material existe
    material = db.query(models.Material).filter(models.Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado")

    kardex_records = db.query(models.Kardex).filter(
        models.Kardex.material_id == material_id,
        models.Kardex.user_id == current_user.id
    ).order_by(models.Kardex.date.desc()).limit(limit).all()

    # Enriquecer registros con información adicional
    for record in kardex_records:
        if material and material.name:
            record.material_name = material.name
        else:
            record.material_name = f"Material ID: {material_id}"

        user = db.query(models.User).filter(models.User.id == record.user_id).first()
        if user:
            record.username = user.username

    return kardex_records


@router.get("/product/{product_id}", response_model=List[schemas.KardexOut])
def get_product_kardex(
        product_id: int,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user),
        limit: int = 50
):
    """
    Obtiene el historial de movimientos de un producto específico.
    """
    # Verificar que el producto existe
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    kardex_records = db.query(models.Kardex).filter(
        models.Kardex.product_id == product_id,
        models.Kardex.user_id == current_user.id
    ).order_by(models.Kardex.date.desc()).limit(limit).all()

    # Enriquecer registros con información adicional
    for record in kardex_records:
        if product and product.name:
            record.product_name = product.name
        else:
            record.product_name = f"Producto ID: {product_id}"

        user = db.query(models.User).filter(models.User.id == record.user_id).first()
        if user:
            record.username = user.username

    return kardex_records



@router.post("/", response_model=schemas.KardexOut, status_code=status.HTTP_201_CREATED)
def create_kardex_entry(
        kardex: schemas.KardexCreate,
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
):
    """
    Crea una nueva entrada en el kardex.
    Esto generalmente se usaría internamente por otros endpoints, no directamente por el frontend.
    """
    # Validar que se especifique material_id o product_id, pero no ambos
    if not kardex.material_id and not kardex.product_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe especificar material_id o product_id"
        )

    if kardex.material_id and kardex.product_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede especificar tanto material_id como product_id"
        )

    # Verificar que el material o producto existe
    if kardex.material_id:
        material = db.query(models.Material).filter(models.Material.id == kardex.material_id).first()
        if not material:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado")

    if kardex.product_id:
        product = db.query(models.Product).filter(models.Product.id == kardex.product_id).first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")

    # Crear nueva entrada de kardex
    new_kardex = models.Kardex(
        movement_type=kardex.movement_type,
        quantity=kardex.quantity,
        stock_anterior=kardex.stock_anterior,
        stock_nuevo=kardex.stock_nuevo,
        observaciones=kardex.observaciones,
        material_id=kardex.material_id,
        product_id=kardex.product_id,
        user_id=current_user.id
    )

    db.add(new_kardex)
    db.commit()
    db.refresh(new_kardex)

    return new_kardex
