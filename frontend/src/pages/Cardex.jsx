import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("token");
  }
  return null;
};

const getHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = "Error en la petición";
    try {
      const error = await response.json();
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (Array.isArray(error.detail)) {
          errorMessage = error.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
        } else {
          errorMessage = JSON.stringify(error.detail);
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = JSON.stringify(error);
      }
    } catch (e) {
      errorMessage = `Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

const api = {
  getKardex: () => {
    return fetch(`${API_URL}/kardex/`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },
};

export default function Cardex() {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCardex();
  }, []);

  const fetchCardex = async () => {
    try {
      setIsLoading(true);
      const res = await api.getKardex();
      setRecords(Array.isArray(res) ? res : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching kardex:", err);
      setError("Error al cargar movimientos de inventario: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) {
      return "Fecha inválida";
    }
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getItemDetails = (record) => {
    if (record.material_id || record.material_name) {
      return {
        name: record.material_name || `Material ID: ${record.material_id}`,
        type: 'material',
        id: record.material_id,
      };
    }
    if (record.product_id || record.product_name) {
      return {
        name: record.product_name || `Producto ID: ${record.product_id}`,
        type: 'product',
        id: record.product_id,
      };
    }
    return {
      name: 'Ítem Desconocido',
      type: 'unknown',
      id: record.id || '-',
    };
  };

  const getMovementIcon = (movementType) => {
    switch (movementType?.toLowerCase()) {
      case "entrada":
      case "compra":
      case "ingreso":
        return "⬆️";
      case "salida":
      case "venta":
      case "consumo":
        return "⬇️";
      case "ajuste":
      case "inventario":
        return "⚙️";
      default:
        return "📦";
    }
  };

  const getMovementLabel = (movementType) => {
    switch (movementType?.toLowerCase()) {
      case "entrada":
      case "compra":
      case "ingreso":
        return "Entrada";
      case "salida":
      case "venta":
      case "consumo":
        return "Salida";
      case "ajuste":
      case "inventario":
        return "Ajuste";
      default:
        return movementType || "Movimiento";
    }
  };

  const getMovementBadgeClass = (movementType) => {
    switch (movementType?.toLowerCase()) {
      case "entrada":
      case "compra":
      case "ingreso":
        return "bg-success";
      case "salida":
      case "venta":
      case "consumo":
        return "bg-danger";
      case "ajuste":
      case "inventario":
        return "bg-warning";
      default:
        return "bg-secondary";
    }
  };

  const formatQuantity = (record) => {
    const movementType = record.movement_type?.toLowerCase() || '';
    const quantity = Math.abs(record.quantity);

    if (movementType.includes('salida') || movementType.includes('venta') || movementType.includes('consumo')) {
      return `-${quantity}`;
    }
    if (movementType.includes('entrada') || movementType.includes('compra') || movementType.includes('ingreso')) {
      return `+${quantity}`;
    }
    return record.quantity >= 0 ? `+${quantity}` : `-${quantity}`;
  };

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted">Cargando movimientos...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="row align-items-center mb-4">
        <div className="col-md-8">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-info bg-opacity-10 p-3 rounded-3">
              <span style={{ fontSize: '32px' }}>📊</span>
            </div>
            <div>
              <h1 className="h3 fw-bold text-info mb-1">Kardex</h1>
              <p className="text-muted mb-0 small">Historial de movimientos de inventario</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 text-md-end mt-3 mt-md-0">
          <button onClick={fetchCardex} className="btn btn-info d-inline-flex align-items-center gap-2" disabled={isLoading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12S7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12S8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
            </svg>
            Actualizar
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <span className="me-2">⚠️</span>
          <div>{error}</div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="card shadow-sm border-0 d-none d-xl-block">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th className="fw-semibold">Fecha</th>
                <th className="fw-semibold">Item</th>
                <th className="fw-semibold">Movimiento</th>
                <th className="fw-semibold">Cantidad</th>
                <th className="fw-semibold">Stock Anterior</th>
                <th className="fw-semibold">Stock Nuevo</th>
                <th className="fw-semibold">Usuario</th>
                <th className="fw-semibold">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, index) => {
                const itemDetails = getItemDetails(record);
                const movementBadgeClass = getMovementBadgeClass(record.movement_type);

                return (
                  <tr key={record.id || index}>
                    <td className="align-middle">
                      <small>{formatDate(record.date)}</small>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${itemDetails.type === 'material' ? 'bg-primary' : 'bg-success'} bg-opacity-25 text-${itemDetails.type === 'material' ? 'primary' : 'success'}`}>
                          {itemDetails.type === 'material' ? 'M' : 'P'}
                        </span>
                        <span className="fw-semibold">{itemDetails.name}</span>
                      </div>
                    </td>
                    <td className="align-middle">
                      <span className={`badge ${movementBadgeClass}`}>
                        {getMovementIcon(record.movement_type)} {getMovementLabel(record.movement_type)}
                      </span>
                    </td>
                    <td className="align-middle fw-bold">
                      {formatQuantity(record)}
                    </td>
                    <td className="align-middle">{record.stock_anterior || 0}</td>
                    <td className="align-middle">{record.stock_nuevo || 0}</td>
                    <td className="align-middle">{record.username || record.user_id || '-'}</td>
                    <td className="align-middle">
                      <small className="text-muted">{record.observaciones || '-'}</small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Cards */}
      <div className="d-xl-none">
        {records.map((record, index) => {
          const itemDetails = getItemDetails(record);
          const movementBadgeClass = getMovementBadgeClass(record.movement_type);

          return (
            <div key={record.id || index} className="card shadow-sm border-0 mb-3">
              <div className="card-body">
                {/* Header con fecha y tipo */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <span className={`badge ${itemDetails.type === 'material' ? 'bg-primary' : 'bg-success'} mb-2`}>
                      {itemDetails.type === 'material' ? '🧱 Material' : '📋 Producto'}
                    </span>
                    <h6 className="fw-bold mb-0">{itemDetails.name}</h6>
                  </div>
                  <small className="text-muted">{formatDate(record.date)}</small>
                </div>

                {/* Movimiento */}
                <div className="mb-3">
                  <span className={`badge ${movementBadgeClass} fs-6`}>
                    {getMovementIcon(record.movement_type)} {getMovementLabel(record.movement_type)}
                  </span>
                </div>

                {/* Información en grid */}
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">Cantidad</small>
                    <span className="fw-bold fs-5">{formatQuantity(record)}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">Stock Anterior</small>
                    <span className="fw-semibold">{record.stock_anterior || 0}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">Stock Nuevo</small>
                    <span className="fw-semibold text-success">{record.stock_nuevo || 0}</span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block mb-1">Usuario</small>
                    <span className="small">{record.username || record.user_id || '-'}</span>
                  </div>
                </div>

                {/* Observaciones */}
                {record.observaciones && (
                  <div className="border-top pt-2">
                    <small className="text-muted d-block mb-1">Observaciones</small>
                    <small>{record.observaciones}</small>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {records.length === 0 && !error && !isLoading && (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5">
            <div className="mb-3" style={{ fontSize: '3rem' }}>📊</div>
            <h3 className="h5 fw-semibold mb-2">No hay movimientos registrados</h3>
            <p className="text-muted mb-0">Aún no se han realizado movimientos de inventario</p>
          </div>
        </div>
      )}
    </div>
  );
}