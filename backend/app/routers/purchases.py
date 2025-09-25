from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/purchases",
    tags=["purchases"]
)


# 🔹 Obtener todas las órdenes de compra del usuario autenticado
@router.get("/orders", response_model=List[schemas.PurchaseOrderOut])
def get_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    orders = db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.user_id == current_user.id
    ).all()

    for order in orders:
        supplier = db.query(models.Supplier).filter(models.Supplier.id == order.supplier_id).first()
        order.supplier_name = supplier.name if supplier else f"Proveedor ID: {order.supplier_id}"

    return orders


# 🔹 Crear una nueva orden de compra
@router.post("/orders", response_model=schemas.PurchaseOrderOut, status_code=status.HTTP_201_CREATED)
def create_order(
    order: schemas.PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verifica que el material exista
    material = db.query(models.Material).filter(models.Material.id == order.material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado")

    # Verifica que el proveedor exista
    supplier = db.query(models.Supplier).filter(models.Supplier.id == order.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")

    # 🔑 Validar que el proveedor pertenezca al material seleccionado
    if supplier.material_id != order.material_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El proveedor '{supplier.name}' no está asociado al material '{material.name}'"
        )

    # Crear la orden
    new_order = models.PurchaseOrder(
        supplier_id=order.supplier_id,
        material_id=order.material_id,
        quantity=order.quantity,
        user_id=current_user.id
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    new_order.supplier_name = supplier.name
    return new_order


# 🔹 Completar una orden de compra
@router.put("/orders/{order_id}/complete", response_model=schemas.PurchaseOrderOut)
def complete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    order_query = db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.id == order_id,
        models.PurchaseOrder.user_id == current_user.id
    )
    order = order_query.first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")

    if order.status == "realizada":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La orden ya ha sido completada")

    material = db.query(models.Material).filter(models.Material.id == order.material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material asociado no encontrado")

    # Stock anterior
    old_stock = material.stock

    # Actualiza stock y estado
    material.stock += order.quantity
    order.status = "realizada"

    db.commit()
    db.refresh(order)
    db.refresh(material)

    # Registrar movimiento en Kardex
    kardex_entry = models.Kardex(
        movement_type="entrada",
        quantity=order.quantity,
        stock_anterior=old_stock,
        stock_nuevo=material.stock,
        observaciones=f"Orden de compra #{order.id} completada",
        material_id=material.id,
        user_id=current_user.id,
    )
    db.add(kardex_entry)
    db.commit()
    db.refresh(kardex_entry)

    # Agregar nombre del proveedor
    supplier = db.query(models.Supplier).filter(models.Supplier.id == order.supplier_id).first()
    order.supplier_name = supplier.name if supplier else f"Proveedor ID: {order.supplier_id}"

    return order
