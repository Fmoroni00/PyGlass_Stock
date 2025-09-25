import React, { useEffect, useState } from "react";

// API inline para mantener el componente autocontenido
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
      errorMessage = error.detail || error.message || errorMessage;
    } catch (e) {
      errorMessage = `Error ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  return response.json();
};

const api = {
  getKardex: () => {
    // Nota: Es posible que la API necesite un parámetro para filtrar por material/producto si se almacenan por separado.
    // Asumiremos que la respuesta del backend incluye los campos 'material_name'/'material_id' o 'product_name'/'product_id'.
    return fetch("http://127.0.0.1:8000/kardex/", {
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
      // Asegurar que 'res' sea un array. Si el backend devuelve un objeto con la data, ajusta esto.
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
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- Lógica para diferenciar Material/Producto (NUEVO) ---

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

  const getItemBadgeStyle = (itemType) => {
      switch (itemType) {
          case 'material':
              return styles.itemMaterialBadge;
          case 'product':
              return styles.itemProductBadge;
          default:
              return styles.movementDefault; // Estilo por defecto si no es ni material ni producto
      }
  };

  // --------------------------------------------------------

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
        `}
      </style>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleSection}>
            <div style={styles.iconContainer}>📊</div>
            <div>
              <h1 style={styles.title}>Kardex</h1>
              <p style={styles.subtitle}>Historial de movimientos de inventario</p>
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

        <div style={styles.tableContainer} className="table-container">
          <div style={styles.tableWrapper}>
            <div style={styles.tableHeader}>
              <div style={styles.headerCell}>Fecha</div>
              <div style={styles.headerCell}>Material/Producto</div>
              <div style={styles.headerCell}>Movimiento</div>
              <div style={styles.headerCell}>Cantidad</div>
              <div style={styles.headerCell}>Stock Anterior</div>
              <div style={styles.headerCell}>Stock Nuevo</div>
              <div style={styles.headerCell}>Usuario</div>
              <div style={styles.headerCell}>Observaciones</div>
            </div>

            {records.map((record, index) => {
              const itemDetails = getItemDetails(record); // Obtener detalles
              return (
                <div key={record.id || index} style={styles.tableRow} className="tableRow">
                  <div style={styles.cell}>{formatDate(record.date)}</div>
                  <div style={styles.cellName}>
                    {/* Renderizado con el tipo de ítem (MODIFICADO) */}
                    <span
                      style={{
                        ...styles.itemBadge,
                        ...getItemBadgeStyle(itemDetails.type),
                      }}
                    >
                      {itemDetails.type === 'material' ? 'M' : itemDetails.type === 'product' ? 'P' : '?' }
                    </span>
                    <span style={{ marginLeft: '8px' }}>{itemDetails.name}</span>
                  </div>
                  <div style={styles.cell}>
                    <span
                      style={{
                        ...styles.movementBadge,
                        ...getMovementStyle(record.movement_type),
                      }}
                    >
                      {getMovementIcon(record.movement_type)} {getMovementLabel(record.movement_type)}
                    </span>
                  </div>
                  <div style={styles.cell}>
                    {record.quantity > 0 ? `+${record.quantity}` : record.quantity}
                  </div>
                  <div style={styles.cell}>{record.stock_anterior || 0}</div>
                  <div style={styles.cell}>{record.stock_nuevo || 0}</div>
                  <div style={styles.cell}>{record.username || record.user_id || '-'}</div>
                  <div style={styles.cell}>{record.observaciones || '-'}</div>
                </div>
              );
            })}
          </div>
        </div>

        {records.length === 0 && !error && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📦</div>
            <h3 style={styles.emptyTitle}>No hay movimientos registrados</h3>
            <p style={styles.emptyText}>
              Aún no se han realizado movimientos de inventario
            </p>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  // ... [Estilos anteriores no modificados para ahorrar espacio, excepto 'styles.cellName' y la adición de los nuevos 'styles.item...']
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter','Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
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
    color: "#1e40af"
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#64748b"
  },
  refreshButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "opacity 0.2s ease",
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "12px",
    marginBottom: "20px",
  },
  errorIcon: {
    fontSize: "18px"
  },
  errorText: {
    color: "#dc2626",
    margin: 0,
    fontSize: "14px"
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
    overflow: "hidden",
  },
  tableWrapper: {
    display: "flex",
    flexDirection: "column"
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "160px 200px 140px 100px 120px 120px 150px 200px",
    backgroundColor: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0",
  },
  headerCell: {
    padding: "12px",
    fontWeight: "600",
    color: "#374151",
    borderRight: "1px solid #e2e8f0",
    fontSize: "13px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "160px 200px 140px 100px 120px 120px 150px 200px",
    borderBottom: "1px solid #f1f5f9",
    transition: "background-color 0.1s ease",
  },
  cell: {
    padding: "12px",
    fontSize: "14px",
    color: "#374151",
    borderRight: "1px solid #f8fafc",
    alignItems: "center",
    display: "flex",
  },
  cellName: { // MODIFICADO: Agregamos flex para alinear insignia y nombre
    padding: "12px",
    fontWeight: "600",
    color: "#1e293b",
    borderRight: "1px solid #f8fafc",
    display: 'flex',
    alignItems: 'center',
  },
  // NUEVO: Estilos para la insignia de Material/Producto
  itemBadge: {
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    width: '18px', // Para asegurar que el 'M' y 'P' tengan un tamaño similar
    textAlign: 'center',
  },
  itemMaterialBadge: { // Color para Material
    backgroundColor: "#dbeafe", // blue-100
    color: "#1e40af", // blue-700
  },
  itemProductBadge: { // Color para Producto
    backgroundColor: "#d1fae5", // green-100
    color: "#059669", // green-700
  },
  movementBadge: {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  movementIn: {
    backgroundColor: "#d1fae5",
    color: "#059669"
  },
  movementOut: {
    backgroundColor: "#fee2e2",
    color: "#dc2626"
  },
  movementAdjust: {
    backgroundColor: "#fef9c3",
    color: "#d97706"
  },
  movementDefault: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280"
  },
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
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
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