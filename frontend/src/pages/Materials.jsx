import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const res = await api.getMaterials();
      setMaterials(res);
      setError(null);
    } catch (err) {
      setError("Error al cargar materiales");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStock = async (id) => {
    const parsed = parseInt(newStock, 10);
    if (isNaN(parsed)) {
      alert("El valor debe ser un número válido");
      return;
    }
    try {
      setIsSaving(true);
      const material = materials.find((m) => m.id === id);
      if (!material) return;
      await api.updateMaterial(id, { ...material, stock: parsed });
      setEditingId(null);
      await fetchMaterials();
    } catch (err) {
      console.error("Error modificando stock:", err);
      alert("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e, id) => {
    if (e.key === 'Enter') {
      saveStock(id);
    }
    if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const getStockStatus = (stock, minStock) => {
    if (stock <= minStock) return 'critical';
    if (stock <= minStock * 1.5) return 'warning';
    return 'normal';
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Cargando materiales...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.titleSection}>
          <div style={styles.iconContainer}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={styles.headerIcon}>
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10V12H9V10H7ZM11 10V12H13V10H11ZM15 10V12H17V10H15Z" fill="#1e40af"/>
            </svg>
          </div>
          <div>
            <h1 style={styles.title}>Materias Primas</h1>
            <p style={styles.subtitle}>Gestión de inventario y stock</p>
          </div>
        </div>
        <button onClick={fetchMaterials} style={styles.refreshButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={styles.refreshIcon}>
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12S7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12S8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
          </svg>
          Actualizar
        </button>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      <div style={styles.tableContainer}>
        <div style={styles.tableWrapper}>
          <div style={styles.tableHeader}>
            <div style={styles.headerCell}>ID</div>
            <div style={styles.headerCell}>Nombre</div>
            <div style={styles.headerCell}>Tipo</div>
            <div style={styles.headerCell}>Color</div>
            <div style={styles.headerCell}>Stock Actual</div>
            <div style={styles.headerCell}>Stock Mínimo</div>
            <div style={styles.headerCell}>Estado</div>
            <div style={styles.headerCell}>Acciones</div>
          </div>

          {materials.map((m) => {
            const stockStatus = getStockStatus(m.stock, m.min_stock);
            return (
              <div key={m.id} style={styles.tableRow}>
                <div style={styles.cell}>{m.id}</div>
                <div style={styles.cellName}>{m.name}</div>
                <div style={styles.cell}>
                  <span style={styles.typeBadge}>{m.type}</span>
                </div>
                <div style={styles.cell}>
                  <div style={styles.colorIndicator}>
                    <div
                      style={{
                        ...styles.colorDot,
                        backgroundColor: m.color
                      }}
                    ></div>
                    {m.color}
                  </div>
                </div>
                <div style={styles.cell}>
                  {editingId === m.id ? (
                    <input
                      type="number"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, m.id)}
                      style={styles.stockInput}
                      autoFocus
                      disabled={isSaving}
                    />
                  ) : (
                    <span style={{
                      ...styles.stockValue,
                      ...styles[`stock${stockStatus.charAt(0).toUpperCase() + stockStatus.slice(1)}`]
                    }}>
                      {m.stock}
                    </span>
                  )}
                </div>
                <div style={styles.cell}>
                  <span style={styles.minStock}>{m.min_stock}</span>
                </div>
                <div style={styles.cell}>
                  <span style={{
                    ...styles.statusBadge,
                    ...styles[`status${stockStatus.charAt(0).toUpperCase() + stockStatus.slice(1)}`]
                  }}>
                    {stockStatus === 'critical' ? '🔴 Crítico' :
                     stockStatus === 'warning' ? '🟡 Bajo' : '🟢 Normal'}
                  </span>
                </div>
                <div style={styles.cellActions}>
                  {editingId === m.id ? (
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => saveStock(m.id)}
                        style={styles.saveButton}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <div style={styles.miniSpinner}></div>
                            Guardando...
                          </>
                        ) : (
                          <>
                            💾 Guardar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={styles.cancelButton}
                        disabled={isSaving}
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(m.id);
                        setNewStock(m.stock);
                      }}
                      style={styles.editButton}
                    >
                      ✏️ Modificar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {materials.length === 0 && !error && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📦</div>
          <h3 style={styles.emptyTitle}>No hay materiales registrados</h3>
          <p style={styles.emptyText}>Aún no se han agregado materias primas al sistema</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    backgroundColor: "white",
    padding: "24px",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0"
  },
  titleSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px"
  },
  iconContainer: {
    padding: "12px",
    backgroundColor: "#eff6ff",
    borderRadius: "12px"
  },
  headerIcon: {
    display: "block"
  },
  title: {
    margin: "0 0 4px 0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#1e40af",
    letterSpacing: "-0.025em"
  },
  subtitle: {
    margin: "0",
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "400"
  },
  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  refreshIcon: {
    display: "block"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    gap: "16px"
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  miniSpinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    fontSize: "16px",
    color: "#64748b",
    margin: "0"
  },
  errorContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "12px",
    padding: "16px",
    marginBottom: "24px"
  },
  errorIcon: {
    fontSize: "20px"
  },
  errorText: {
    color: "#dc2626",
    margin: "0",
    fontSize: "14px",
    fontWeight: "500"
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0",
    overflow: "hidden"
  },
  tableWrapper: {
    display: "flex",
    flexDirection: "column"
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "60px 200px 120px 150px 120px 120px 120px 200px",
    backgroundColor: "#f8fafc",
    borderBottom: "2px solid #e2e8f0"
  },
  headerCell: {
    padding: "16px 12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    textAlign: "left",
    borderRight: "1px solid #e2e8f0"
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "60px 200px 120px 150px 120px 120px 120px 200px",
    borderBottom: "1px solid #f1f5f9",
    transition: "all 0.2s ease"
  },
  cell: {
    padding: "16px 12px",
    fontSize: "14px",
    color: "#374151",
    borderRight: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center"
  },
  cellName: {
    padding: "16px 12px",
    fontSize: "14px",
    color: "#1e293b",
    fontWeight: "600",
    borderRight: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center"
  },
  cellActions: {
    padding: "12px",
    borderRight: "1px solid #f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  typeBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600"
  },
  colorIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  colorDot: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "2px solid white",
    boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.1)"
  },
  stockInput: {
    padding: "8px 12px",
    border: "2px solid #2563eb",
    borderRadius: "6px",
    fontSize: "14px",
    width: "80px",
    textAlign: "center",
    outline: "none",
    fontWeight: "600"
  },
  stockValue: {
    fontWeight: "700",
    fontSize: "16px",
    padding: "4px 8px",
    borderRadius: "6px"
  },
  stockNormal: {
    color: "#059669",
    backgroundColor: "#d1fae5"
  },
  stockWarning: {
    color: "#d97706",
    backgroundColor: "#fed7aa"
  },
  stockCritical: {
    color: "#dc2626",
    backgroundColor: "#fecaca"
  },
  minStock: {
    color: "#64748b",
    fontWeight: "500"
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600"
  },
  statusNormal: {
    backgroundColor: "#d1fae5",
    color: "#059669"
  },
  statusWarning: {
    backgroundColor: "#fed7aa",
    color: "#d97706"
  },
  statusCritical: {
    backgroundColor: "#fecaca",
    color: "#dc2626"
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  editButton: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  saveButton: {
    backgroundColor: "#059669",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  cancelButton: {
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #e2e8f0"
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px"
  },
  emptyTitle: {
    color: "#374151",
    fontSize: "20px",
    fontWeight: "600",
    margin: "0 0 8px 0"
  },
  emptyText: {
    color: "#6b7280",
    fontSize: "14px",
    margin: "0"
  }
};

// Inyectar estilos CSS para animaciones y efectos hover
if (typeof document !== 'undefined') {
  const styleId = 'materials-component-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = styleId;
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .tableRow:hover {
        background-color: #f8fafc !important;
      }

      button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      }

      button:active:not(:disabled) {
        transform: translateY(0);
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none !important;
      }

      input:focus {
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1) !important;
      }
    `;
    document.head.appendChild(styleSheet);
  }
}