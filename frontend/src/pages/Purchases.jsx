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
      console.log("Error response:", error); // Para debugging

      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (Array.isArray(error.detail)) {
          // Si es un error de validación de Pydantic, concatenar mensajes
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
    // CORRECCIÓN: Usar la constante API_URL
    return fetch(`${API_URL}/kardex/`, {
      headers: getHeaders(),
    }).then(handleResponse);
  },
};

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

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
      // Opcional: Mostrar la URL que se está usando para debug
      console.log(`Fetching Kardex from: ${API_URL}/kardex/`);

      const res = await api.getKardex();
      // Asegurar que 'res' sea un array.
      setRecords(Array.isArray(res) ? res : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching kardex:", err);
      // Extraemos el mensaje de error de la instancia Error
      setError("Error al cargar movimientos de inventario: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    // Asegurar que la fecha sea válida antes de formatear
    if (isNaN(date)) {
        return "Fecha inválida";
    }
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit" // Añadir segundos para mayor precisión
    });
  };

  const getItemDetails = (record) => {
    // Prioriza material
    if (record.material_id || record.material_name) {
      return {
        name: record.material_name || `Material ID: ${record.material_id}`,
        type: 'material',
        id: record.material_id,
      };
    }
    // Si no es material, busca producto
    if (record.product_id || record.product_name) {
      return {
        name: record.product_name || `Producto ID: ${record.product_id}`,
        type: 'product',
        id: record.product_id,
      };
    }
    // Si no hay ninguno
    return {
      name: 'Ítem Desconocido',
      type: 'unknown',
      id: record.id || '-',
    };
  };

  const getItemBadgeStyle = (itemType) => {
      switch (itemType) {
          case 'material':
              return styles.itemMaterialBadge;
          case 'product':
              return styles.itemProductBadge;
          default:
              return styles.movementDefault; // Estilo por defecto
      }
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

  const getMovementStyle = (movementType) => {
    switch (movementType?.toLowerCase()) {
      case "entrada":
      case "compra":
      case "ingreso":
        return styles.movementIn;
      case "salida":
      case "venta":
      case "consumo":
        return styles.movementOut;
      case "ajuste":
      case "inventario":
        return styles.movementAdjust;
      default:
        return styles.movementDefault;
    }
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Cargando movimientos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .tableRow:hover {
            background-color: #f9fafb !important;
          }
          .refresh-button:hover:not(:disabled) {
            opacity: 0.9;
          }
          .refresh-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .table-container {
            overflow-x: auto;
          }

          /* CLASES DE MODO OSCURO ELIMINADAS O ANULADAS PARA FORZAR EL BLANCO */
          @media (prefers-color-scheme: dark) {
            /* Forzar el fondo del contenedor a blanco en modo oscuro */
            .dark-container { background-color: #ffffff !important; }

            /* Mantener los colores de texto y componentes en modo oscuro para que sean legibles sobre el fondo blanco */
            .dark-header { background-color: #f9fafb !important; }
            .dark-title { color: #1e40af !important; }
            .dark-subtitle { color: #64748b !important; }
            .dark-table-container { background-color: white !important; }
            .dark-table-header { background-color: #f1f5f9 !important; border-color: #e2e8f0 !important; }
            .dark-header-cell { color: #374151 !important; border-color: #e2e8f0 !important; }
            .dark-table-row { border-color: #f1f5f9 !important; }
            .dark-table-row:hover { background-color: #f9fafb !important; }
            .dark-cell, .dark-cell-name { color: #374151 !important; border-color: #f8fafc !important; }
          }
        `}
      </style>
      <div style={styles.container} className="dark-container">
        <div style={styles.header} className="dark-header">
          <div style={styles.titleSection}>
            <div style={styles.iconContainer}>📊</div>
            <div>
              <h1 style={styles.title} className="dark-title">Kardex</h1>
              <p style={styles.subtitle} className="dark-subtitle">Historial de movimientos de inventario</p>
            </div>
          </div>
          <button
            onClick={fetchCardex}
            style={styles.refreshButton}
            className="refresh-button"
            disabled={isLoading}
          >
            🔄 Actualizar
          </button>
        </div>

        {error && (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}

        <div style={styles.tableContainer} className="table-container dark-table-container">
          <div style={styles.tableWrapper}>
            <div style={styles.tableHeader} className="dark-table-header">
              <div style={styles.headerCell} className="dark-header-cell">Fecha</div>
              <div style={styles.headerCell} className="dark-header-cell">Material/Producto</div>
              <div style={styles.headerCell} className="dark-header-cell">Movimiento</div>
              <div style={styles.headerCell} className="dark-header-cell">Cantidad</div>
              <div style={styles.headerCell} className="dark-header-cell">Stock Anterior</div>
              <div style={styles.headerCell} className="dark-header-cell">Stock Nuevo</div>
              <div style={styles.headerCell} className="dark-header-cell">Usuario</div>
              <div style={styles.headerCell} className="dark-header-cell">Observaciones</div>
            </div>

            {records.map((record, index) => {
              const itemDetails = getItemDetails(record); // Obtener detalles
              const movementStyle = getMovementStyle(record.movement_type);

              const isDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
              const movementClassName = isDark ? `dark-movement-${record.movement_type?.toLowerCase().includes('entrada') || record.movement_type?.toLowerCase().includes('compra') ? 'in' : record.movement_type?.toLowerCase().includes('salida') || record.movement_type?.toLowerCase().includes('venta') ? 'out' : 'adjust'}` : '';
              const itemClassName = isDark ? `dark-item-${itemDetails.type}-badge` : '';
              const rowClassName = `tableRow dark-table-row ${index % 2 === 0 ? '' : 'bg-gray-50'}`; // Añadimos clase para hover

              return (
                <div key={record.id || index} style={styles.tableRow} className={rowClassName}>
                  <div style={styles.cell} className="dark-cell">{formatDate(record.date)}</div>
                  <div style={styles.cellName} className="dark-cell-name">
                    <span
                      style={{
                        ...styles.itemBadge,
                        ...getItemBadgeStyle(itemDetails.type),
                      }}
                      className={itemClassName}
                    >
                      {itemDetails.type === 'material' ? 'M' : itemDetails.type === 'product' ? 'P' : '?' }
                    </span>
                    <span style={{ marginLeft: '8px' }}>{itemDetails.name}</span>
                  </div>
                  <div style={styles.cell} className="dark-cell">
                    <span
                      style={{
                        ...styles.movementBadge,
                        ...movementStyle,
                      }}
                      className={movementClassName}
                    >
                      {getMovementIcon(record.movement_type)} {getMovementLabel(record.movement_type)}
                    </span>
                  </div>
                  {/* ===================== MODIFICACIÓN AQUÍ ===================== */}
                  <div style={{ ...styles.cell, fontWeight: '700' }} className="dark-cell">
                    {(() => {
                      const movementType = record.movement_type?.toLowerCase();
                      const quantity = record.quantity;

                      if (['salida', 'venta', 'consumo'].includes(movementType)) {
                        // Para salidas, siempre mostrar signo negativo
                        return `-${Math.abs(quantity)}`;
                      }

                      // Para el resto (entradas, ajustes), mostrar con signo + si es positivo o cero
                      return quantity >= 0 ? `+${quantity}` : quantity;
                    })()}
                  </div>
                  {/* ===================== FIN DE LA MODIFICACIÓN ===================== */}
                  <div style={styles.cell} className="dark-cell">{record.stock_anterior || 0}</div>
                  <div style={styles.cell} className="dark-cell">{record.stock_nuevo || 0}</div>
                  <div style={styles.cell} className="dark-cell">{record.username || record.user_id || '-'}</div>
                  <div style={styles.cell} className="dark-cell">{record.observaciones || '-'}</div>
                </div>
              );
            })}
          </div>
        </div>

        {records.length === 0 && !error && !isLoading && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📦</div>
            <h3 style={styles.emptyTitle}>No hay movimientos registrados</h3>
            <p style={styles.emptyText}>
              Aún no se han realizado movimientos de inventario.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  // Estilos Base
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    // MODIFICACIÓN CLAVE: Fondo blanco
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    fontFamily: "'Inter','Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    transition: 'background-color 0.3s',
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    transition: 'background-color 0.3s, box-shadow 0.3s',
  },
  titleSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  iconContainer: {
    fontSize: "28px"
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
    color: "#1e40af", // blue-700
    transition: 'color 0.3s',
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b", // slate-500
    transition: 'color 0.3s',
  },
  refreshButton: {
    backgroundColor: "#2563eb", // blue-600
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "background-color 0.2s, opacity 0.2s ease",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#fef2f2", // red-50
    border: "1px solid #fecaca", // red-200
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "20px",
  },
  errorIcon: {
    fontSize: "18px",
    color: "#ef4444" // red-500
  },
  errorText: {
    color: "#dc2626", // red-600
    margin: 0,
    fontSize: "14px"
  },

  // Estilos de Tabla
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
    overflow: "hidden",
    transition: 'background-color 0.3s, box-shadow 0.3s',
  },
  tableWrapper: {
    display: "flex",
    flexDirection: "column"
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "160px 200px 140px 100px 120px 120px 150px 200px", // 8 columnas
    backgroundColor: "#f1f5f9", // slate-100
    borderBottom: "1px solid #e2e8f0", // slate-200
    transition: 'background-color 0.3s, border-color 0.3s',
  },
  headerCell: {
    padding: "12px",
    fontWeight: "600",
    color: "#374151", // slate-700
    borderRight: "1px solid #e2e8f0",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    transition: 'color 0.3s, border-color 0.3s',
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "160px 200px 140px 100px 120px 120px 150px 200px",
    borderBottom: "1px solid #f1f5f9",
    transition: "background-color 0.1s ease, border-color 0.3s",
  },
  cell: {
    padding: "12px",
    fontSize: "14px",
    color: "#374151",
    borderRight: "1px solid #f8fafc",
    alignItems: "center",
    display: "flex",
    transition: 'color 0.3s, border-color 0.3s',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cellName: {
    padding: "12px",
    fontWeight: "600",
    color: "#1e293b", // slate-800
    borderRight: "1px solid #f8fafc",
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.3s, border-color 0.3s',
  },

  // Insignias de Material/Producto
  itemBadge: {
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    width: '18px',
    textAlign: 'center',
    transition: 'background-color 0.3s, color 0.3s',
  },
  itemMaterialBadge: {
    backgroundColor: "#dbeafe", // blue-100
    color: "#1e40af", // blue-700
  },
  itemProductBadge: {
    backgroundColor: "#d1fae5", // green-100
    color: "#059669", // green-600
  },

  // Insignias de Movimiento
  movementBadge: {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
    transition: 'background-color 0.3s, color 0.3s',
  },
  movementIn: {
    backgroundColor: "#d1fae5", // green-100
    color: "#059669" // green-600
  },
  movementOut: {
    backgroundColor: "#fee2e2", // red-100
    color: "#dc2626" // red-600
  },
  movementAdjust: {
    backgroundColor: "#fef9c3", // yellow-100
    color: "#d97706" // amber-700
  },
  movementDefault: {
    backgroundColor: "#f3f4f6", // gray-100
    color: "#6b7280" // gray-500
  },

  // Estado de Carga y Vacío
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    gap: "12px",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "16px",
    color: "#64748b"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "white",
    borderRadius: "12px",
    marginTop: "20px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px"
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#374151",
    margin: "0 0 8px 0",
  },
  emptyText: {
    fontSize: "14px",
    color: "#6b7280",
    margin: 0,
  },
};