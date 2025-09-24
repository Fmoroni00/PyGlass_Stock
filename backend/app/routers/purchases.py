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


@router.get("/orders", response_model=List[schemas.PurchaseOrderOut])
def get_orders(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Obtiene todas las órdenes de compra del usuario autenticado.
    """
    return db.query(models.PurchaseOrder).filter(models.PurchaseOrder.user_id == current_user.id).all()


@router.post("/orders", response_model=schemas.PurchaseOrderOut, status_code=status.HTTP_201_CREATED)
def create_order(order: schemas.PurchaseOrderCreate, db: Session = Depends(get_db),
                 current_user: models.User = Depends(get_current_user)):
    """
    Crea una nueva orden de compra para un material.
    """
    # Verifica que el material exista
    material = db.query(models.Material).filter(models.Material.id == order.material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material no encontrado")

    # Crea una nueva instancia de PurchaseOrder
    new_order = models.PurchaseOrder(
        supplier_name=order.supplier_name,
        material_id=order.material_id,
        quantity=order.quantity,
        user_id=current_user.id
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order


@router.put("/orders/{order_id}/complete", response_model=schemas.PurchaseOrderOut)
def complete_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """
    Completa una orden de compra, actualizando su estado a 'realizada' y sumando la cantidad al stock del material.
    """
    # Busca la orden por ID y verifica que pertenezca al usuario actual
    order_query = db.query(models.PurchaseOrder).filter(
        models.PurchaseOrder.id == order_id,
        models.PurchaseOrder.user_id == current_user.id
    )
    order = order_query.first()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")

    if order.status == "realizada":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La orden ya ha sido completada")

    # Busca el material asociado a la orden
    material = db.query(models.Material).filter(models.Material.id == order.material_id).first()
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material asociado no encontrado")

    # Actualiza el stock y el estado de la orden
    material.stock += order.quantity
    order.status = "realizada"

    db.commit()
    db.refresh(order)
    db.refresh(material)

    return order
