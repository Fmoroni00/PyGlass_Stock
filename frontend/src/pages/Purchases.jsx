import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

let sessionToken = null;

function setToken(newToken) {
  sessionToken = newToken;
  if (typeof window !== 'undefined' && window.localStorage) {
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
  }
}

function getToken() {
  if (!sessionToken && typeof window !== 'undefined' && window.localStorage) {
    sessionToken = localStorage.getItem("token");
  }
  return sessionToken;
}

async function request(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  const authToken = getToken();
  if (authToken) {
    options.headers["Authorization"] = `Bearer ${authToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const MAX_RETRIES = 3;
  let res;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      res = await fetch(`${API_URL}${endpoint}`, options);
      if (res.ok || res.status < 500) break;
    } catch (error) {
      if (i === MAX_RETRIES - 1) {
        throw new Error(`Error de red: ${error.message}`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500 * (2 ** i)));
  }

  if (!res || !res.ok) {
    if (!res) throw new Error("Fallo de conexión con el servidor.");
    const errorData = await res.json().catch(() => ({}));
    let errorMessage = `Error ${res.status}: `;
    if (errorData?.detail) {
      if (typeof errorData.detail === 'string') {
        errorMessage += errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        errorMessage += errorData.detail.map(e => e.msg || e.message).join(', ');
      }
    } else {
      errorMessage += res.statusText || "Error desconocido";
    }
    throw new Error(errorMessage);
  }

  if (res.status === 204) return {};
  return res.json();
}

const api = {
  getMaterials: () => request("/materials/"),
  getOrders: () => request("/purchases/orders"),
  createOrder: (data) => request("/purchases/orders", "POST", data),
  completeOrder: (orderId) => request(`/purchases/orders/${orderId}/complete`, "PUT"),
  cancelOrder: (orderId) => request(`/purchases/orders/${orderId}/cancel`, "PUT"),
  getMaterialSuppliers: (materialId) => request(`/suppliers/by-material/${materialId}`),
};

export default function Purchases() {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [selectedMaterialData, setSelectedMaterialData] = useState(null);
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedSupplierData, setSelectedSupplierData] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchMaterials = async () => {
    try {
      const data = await api.getMaterials();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Error al cargar materiales: " + err.message);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      const formatted = Array.isArray(data)
        ? data.map(order => ({
            ...order,
            status: order.status?.toLowerCase() || 'pendiente'
          }))
        : [];
      setOrders(formatted);
    } catch (err) {
      setError("Error al cargar órdenes: " + err.message);
    }
  };

  const fetchMaterialSuppliers = async (materialId) => {
    try {
      const data = await api.getMaterialSuppliers(materialId);
      setAvailableSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      setAvailableSuppliers([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMaterials(), fetchOrders()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleMaterialChange = async (materialId) => {
    setSelectedMaterial(materialId);
    setSelectedSupplier("");
    setSelectedSupplierData(null);
    setAvailableSuppliers([]);
    setError("");

    if (materialId) {
      const material = materials.find(m => m.id === parseInt(materialId));
      setSelectedMaterialData(material);
      await fetchMaterialSuppliers(materialId);
    } else {
      setSelectedMaterialData(null);
    }
  };

  const handleSupplierChange = (supplierId) => {
    setSelectedSupplier(supplierId);
    setError("");
    if (supplierId) {
      const supplier = availableSuppliers.find(s => s.id === parseInt(supplierId));
      setSelectedSupplierData(supplier);
    } else {
      setSelectedSupplierData(null);
    }
  };

  const handleCreateOrder = async () => {
    setError("");
    setSuccess("");

    if (!selectedMaterial) {
      setError("Selecciona un material.");
      return;
    }
    if (!selectedSupplier) {
      setError("Selecciona un proveedor.");
      return;
    }
    const qty = parseInt(quantity);
    if (!quantity || qty <= 0 || isNaN(qty)) {
      setError("Ingresa una cantidad válida mayor a 0.");
      return;
    }

    try {
      const orderData = {
        supplier_id: parseInt(selectedSupplier),
        material_id: parseInt(selectedMaterial),
        quantity: qty,
      };
      const result = await api.createOrder(orderData);
      setSuccess(`Orden #${result.id} creada exitosamente.`);

      setSelectedMaterial("");
      setSelectedMaterialData(null);
      setSelectedSupplier("");
      setSelectedSupplierData(null);
      setAvailableSuppliers([]);
      setQuantity("");

      await fetchMaterials();
      await fetchOrders();
    } catch (err) {
      setError("Error al crear orden: " + err.message);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    setError("");
    setSuccess("");
    try {
      await api.completeOrder(orderId);
      setSuccess("Orden completada y stock actualizado.");
      await fetchMaterials();
      await fetchOrders();
    } catch (err) {
      setError("Error al completar orden: " + err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setError("");
    setSuccess("");

    if (!window.confirm("¿Estás seguro de cancelar esta orden? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await api.cancelOrder(orderId);
      setSuccess("Orden cancelada exitosamente.");
      await fetchOrders();
    } catch (err) {
      setError("Error al cancelar orden: " + err.message);
    }
  };

  const handlePrintOrder = (order) => {
    const material = materials.find(m => m.id === order.material_id);
    const printWindow = window.open('', '_blank');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Orden de Compra #${order.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            .header {
              border-bottom: 3px solid #0d9488;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .company-name {
              font-size: 28px;
              font-weight: bold;
              color: #0d9488;
            }
            .document-title {
              font-size: 18px;
              color: #666;
            }
            .order-number {
              font-size: 24px;
              font-weight: bold;
              color: #0d9488;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #0d9488;
              margin-bottom: 10px;
              text-transform: uppercase;
            }
            .info-row {
              display: flex;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .info-label {
              font-weight: bold;
              width: 150px;
              color: #666;
            }
            .info-value {
              flex: 1;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .table th {
              background-color: #f3f4f6;
              padding: 12px;
              text-align: left;
              font-size: 12px;
              text-transform: uppercase;
              border: 1px solid #ddd;
            }
            .table td {
              padding: 12px;
              border: 1px solid #ddd;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-pendiente {
              background-color: #fffbe6;
              color: #a16207;
            }
            .status-realizada {
              background-color: #dcfce7;
              color: #16a34a;
            }
            .status-cancelada {
              background-color: #fee2e2;
              color: #dc2626;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company-name">PyGlass Stock</div>
              <div class="document-title">Sistema de Inventario para Vidriería</div>
            </div>
            <div style="text-align: right;">
              <div class="document-title">ORDEN DE COMPRA</div>
              <div class="order-number">#${order.id}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Información General</div>
            <div class="info-row">
              <div class="info-label">Fecha:</div>
              <div class="info-value">${new Date(order.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Estado:</div>
              <div class="info-value">
                <span class="status-badge status-${order.status}">${order.status}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Proveedor</div>
            <div class="info-row">
              <div class="info-label">Nombre:</div>
              <div class="info-value">${order.supplier_name || 'Desconocido'}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Detalle de la Orden</div>
            <table class="table">
              <thead>
                <tr>
                  <th>ID Material</th>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${order.material_id}</td>
                  <td>${material ? material.name : 'Material no encontrado'}</td>
                  <td><strong>${order.quantity}</strong></td>
                  <td>${material?.unit || 'Unidad'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Documento generado por PyGlass Stock - ${new Date().toLocaleString('es-ES')}</p>
            <p style="margin-top: 30px;">_______________________</p>
            <p>Firma y Sello del Proveedor</p>
          </div>

          <div class="no-print" style="text-align: center; margin-top: 30px;">
            <button onclick="window.print()" style="
              background-color: #0d9488;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin-right: 10px;
            ">Imprimir / Guardar PDF</button>
            <button onclick="window.close()" style="
              background-color: #6b7280;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
            ">Cerrar</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <h1 style={styles.loadingTitle}>Cargando datos...</h1>
        <div style={styles.spinner}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Órdenes de Compra</h1>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Crear Orden</h2>
        {error && <div style={styles.alertError}>{error}</div>}
        {success && <div style={styles.alertSuccess}>{success}</div>}

        <div style={styles.formGroup}>
          <label style={styles.label}>1. Seleccionar Material/Producto</label>
          <select
            value={selectedMaterial}
            onChange={(e) => handleMaterialChange(e.target.value)}
            style={styles.select}
          >
            <option value="">-- Selecciona un material --</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (ID: {m.id}) - Stock: {m.stock}
              </option>
            ))}
          </select>
        </div>

        {selectedMaterialData && (
          <div style={styles.infoPanel}>
            <div style={styles.infoTitle}>Material Seleccionado</div>
            <div style={styles.infoContent}>
              <strong>Nombre:</strong> {selectedMaterialData.name}<br/>
              <strong>Stock actual:</strong> {selectedMaterialData.stock} unidades<br/>
              {selectedMaterialData.description && <><strong>Descripción:</strong> {selectedMaterialData.description}<br/></>}
              {selectedMaterialData.unit && <><strong>Unidad:</strong> {selectedMaterialData.unit}</>}
            </div>
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>2. Seleccionar Proveedor</label>
          <select
            value={selectedSupplier}
            onChange={(e) => handleSupplierChange(e.target.value)}
            style={styles.select}
            disabled={!selectedMaterial || availableSuppliers.length === 0}
          >
            <option value="">-- Selecciona un proveedor --</option>
            {availableSuppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {!selectedMaterial && <small style={styles.helpText}>Selecciona un material primero.</small>}
          {selectedMaterial && availableSuppliers.length === 0 && <small style={styles.warningText}>No hay proveedores para este material.</small>}
        </div>

        {selectedSupplierData && (
          <div style={styles.infoPanel}>
            <div style={styles.infoTitle}>Proveedor Seleccionado</div>
            <div style={styles.infoContent}>
              <strong>Nombre:</strong> {selectedSupplierData.name}<br/>
              {selectedSupplierData.contact_person && <><strong>Contacto:</strong> {selectedSupplierData.contact_person}<br/></>}
              {selectedSupplierData.phone && <><strong>Teléfono:</strong> {selectedSupplierData.phone}<br/></>}
              {selectedSupplierData.email && <><strong>Email:</strong> {selectedSupplierData.email}<br/></>}
              {selectedSupplierData.address && <><strong>Dirección:</strong> {selectedSupplierData.address}</>}
            </div>
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>3. Cantidad</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={styles.input}
            placeholder="Cantidad a solicitar"
            disabled={!selectedSupplier}
          />
        </div>

        <button
          onClick={handleCreateOrder}
          style={{
            ...styles.button,
            opacity: (!selectedMaterial || !selectedSupplier || !quantity) ? 0.5 : 1,
            cursor: (!selectedMaterial || !selectedSupplier || !quantity) ? 'not-allowed' : 'pointer'
          }}
          disabled={!selectedMaterial || !selectedSupplier || !quantity}
        >
          Crear Orden de Compra
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.subtitle}>Historial de Órdenes</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Fecha</th>
                <th style={styles.th}>Proveedor</th>
                <th style={styles.th}>Material</th>
                <th style={styles.th}>Cantidad</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((order) => {
                  const material = materials.find(m => m.id === order.material_id);
                  return (
                    <tr key={order.id} style={styles.tr}>
                      <td style={styles.td}>{order.id}</td>
                      <td style={styles.td}>{new Date(order.date).toLocaleDateString()}</td>
                      <td style={styles.td}>{order.supplier_name || 'Desconocido'}</td>
                      <td style={styles.td}>{material ? material.name : `ID: ${order.material_id}`}</td>
                      <td style={styles.td}>{order.quantity}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          ...(order.status === 'realizada' ? styles.badgeSuccess :
                              order.status === 'cancelada' ? styles.badgeCanceled :
                              styles.badgePending)
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {order.status === 'pendiente' ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              style={styles.actionBtnComplete}
                              title="Completar orden"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              style={styles.actionBtnCancel}
                              title="Cancelar orden"
                            >
                              ✕
                            </button>
                            <button
                              onClick={() => handlePrintOrder(order)}
                              style={styles.actionBtnPrint}
                              title="Imprimir orden"
                            >
                              🖨️
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handlePrintOrder(order)}
                            style={styles.actionBtnPrint}
                            title="Imprimir orden"
                          >
                            🖨️
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" style={styles.emptyRow}>
                    No hay órdenes registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "1.5rem",
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    color: "#1f2937",
    fontFamily: "'Inter', sans-serif",
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
  },
  loadingTitle: {
    color: '#0d9488',
    fontSize: '1.5rem',
    marginBottom: '1rem',
  },
  spinner: {
    border: '4px solid rgba(0,0,0,0.1)',
    borderTop: '4px solid #0d9488',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    animation: 'spin 1s linear infinite',
  },
  title: {
    fontSize: "2.25rem",
    fontWeight: "700",
    color: "#0d9488",
    marginBottom: "1.5rem",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "0.75rem",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  },
  subtitle: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "1rem",
    borderBottom: "2px solid #e5e7eb",
    paddingBottom: "0.5rem",
  },
  alertError: {
    padding: "1rem",
    marginBottom: "1rem",
    borderLeft: "5px solid #b91c1c",
    borderRadius: "0.375rem",
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
    fontWeight: "500",
  },
  alertSuccess: {
    padding: "1rem",
    marginBottom: "1rem",
    borderLeft: "5px solid #16a34a",
    borderRadius: "0.375rem",
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    fontWeight: "500",
  },
  infoPanel: {
    backgroundColor: "#e0f2f1",
    border: "1px solid #2dd4bf",
    borderRadius: "0.5rem",
    padding: "1rem",
    marginBottom: "1rem",
  },
  infoTitle: {
    fontWeight: "700",
    color: "#0d9488",
    marginBottom: "0.5rem",
  },
  infoContent: {
    fontSize: "0.875rem",
    lineHeight: "1.6",
    color: "#0d9488",
  },
  formGroup: {
    marginBottom: "1rem",
  },
  label: {
    display: "block",
    color: "#1f2937",
    marginBottom: "0.4rem",
    fontWeight: "600",
    fontSize: "0.95rem",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "0.6rem",
    borderRadius: "0.5rem",
    border: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    color: "#1f2937",
    fontSize: "1rem",
  },
  select: {
    display: "block",
    width: "100%",
    padding: "0.6rem",
    borderRadius: "0.5rem",
    border: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    color: "#1f2937",
    fontSize: "1rem",
  },
  helpText: {
    display: 'block',
    marginTop: '0.5rem',
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  warningText: {
    display: 'block',
    marginTop: '0.5rem',
    color: '#dc2626',
    fontSize: '0.875rem',
  },
  button: {
    width: "100%",
    backgroundColor: "#0d9488",
    color: "#ffffff",
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    border: "none",
    fontWeight: "700",
    marginTop: "1.25rem",
    fontSize: "1rem",
    transition: "all 0.2s",
  },
  tableContainer: {
    overflowX: "auto",
    borderRadius: "0.5rem",
    border: "1px solid #e5e7eb",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
  },
  th: {
    padding: "0.8rem 1.5rem",
    textAlign: "left",
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "#4b5563",
    textTransform: "uppercase",
    backgroundColor: "#f3f4f6",
    borderBottom: "2px solid #e5e7eb",
  },
  tr: {
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "1rem 1.5rem",
    fontSize: "0.875rem",
    color: "#1f2937",
  },
  emptyRow: {
    padding: "1rem 1.5rem",
    textAlign: "center",
    color: "#6b7280",
  },
  badge: {
    display: "inline-flex",
    padding: "0.3rem 0.6rem",
    fontSize: "0.75rem",
    fontWeight: "700",
    borderRadius: "9999px",
    textTransform: "capitalize",
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
  },
  badgePending: {
    backgroundColor: "#fffbe6",
    color: "#a16207",
  },
  badgeCanceled: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
  },
  actionBtnComplete: {
    padding: "0.5rem",
    color: "#16a34a",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "1.2rem",
    transition: "all 0.2s",
  },
  actionBtnCancel: {
    padding: "0.5rem",
    color: "#dc2626",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "1.2rem",
    transition: "all 0.2s",
  },
  actionBtnPrint: {
    padding: "0.5rem",
    color: "#3b82f6",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontSize: "1.2rem",
    transition: "all 0.2s",
  },
};