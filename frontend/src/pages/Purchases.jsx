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
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 3px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .company-name { font-size: 28px; font-weight: bold; color: #0d9488; }
            .document-title { font-size: 18px; color: #666; }
            .order-number { font-size: 24px; font-weight: bold; color: #0d9488; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 14px; font-weight: bold; color: #0d9488; margin-bottom: 10px; text-transform: uppercase; }
            .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; width: 150px; color: #666; }
            .info-value { flex: 1; }
            .table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .table th { background-color: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; border: 1px solid #ddd; }
            .table td { padding: 12px; border: 1px solid #ddd; }
            .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .status-pendiente { background-color: #fffbe6; color: #a16207; }
            .status-realizada { background-color: #dcfce7; color: #16a34a; }
            .status-cancelada { background-color: #fee2e2; color: #dc2626; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
            @media print { body { padding: 20px; } .no-print { display: none; } }
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
              <div class="info-value">${new Date(order.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div class="info-row">
              <div class="info-label">Estado:</div>
              <div class="info-value"><span class="status-badge status-${order.status}">${order.status}</span></div>
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
                <tr><th>ID Material</th><th>Descripción</th><th>Cantidad</th><th>Unidad</th></tr>
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
            <button onclick="window.print()" style="background-color: #0d9488; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-right: 10px;">Imprimir / Guardar PDF</button>
            <button onclick="window.close()" style="background-color: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">Cerrar</button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-teal mb-3" role="status" style={{ width: '3rem', height: '3rem', color: '#0d9488' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)' }}>
            <span style={{ fontSize: '32px' }}>🛒</span>
          </div>
          <div>
            <h1 className="h3 fw-bold mb-1" style={{ color: '#0d9488' }}>Órdenes de Compra</h1>
            <p className="text-muted mb-0 small">Gestión de pedidos a proveedores</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
        </div>
      )}

      {/* Crear Orden Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header" style={{ backgroundColor: '#0d9488', color: 'white' }}>
          <h5 className="mb-0">Crear Nueva Orden</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {/* Paso 1: Material */}
            <div className="col-12">
              <label className="form-label fw-semibold">1. Seleccionar Material</label>
              <select
                value={selectedMaterial}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="form-select"
              >
                <option value="">-- Selecciona un material --</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (ID: {m.id}) - Stock: {m.stock}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Info */}
            {selectedMaterialData && (
              <div className="col-12">
                <div className="alert alert-info mb-0">
                  <h6 className="alert-heading">Material Seleccionado</h6>
                  <div className="small">
                    <strong>Nombre:</strong> {selectedMaterialData.name}<br/>
                    <strong>Stock actual:</strong> {selectedMaterialData.stock} unidades<br/>
                    {selectedMaterialData.description && <><strong>Descripción:</strong> {selectedMaterialData.description}<br/></>}
                    {selectedMaterialData.unit && <><strong>Unidad:</strong> {selectedMaterialData.unit}</>}
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Proveedor */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">2. Seleccionar Proveedor</label>
              <select
                value={selectedSupplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="form-select"
                disabled={!selectedMaterial || availableSuppliers.length === 0}
              >
                <option value="">-- Selecciona un proveedor --</option>
                {availableSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {!selectedMaterial && <small className="text-muted d-block mt-1">Selecciona un material primero.</small>}
              {selectedMaterial && availableSuppliers.length === 0 && <small className="text-danger d-block mt-1">No hay proveedores para este material.</small>}
            </div>

            {/* Paso 3: Cantidad */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">3. Cantidad</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="form-control"
                placeholder="Cantidad a solicitar"
                disabled={!selectedSupplier}
              />
            </div>

            {/* Supplier Info */}
            {selectedSupplierData && (
              <div className="col-12">
                <div className="alert alert-success mb-0">
                  <h6 className="alert-heading">Proveedor Seleccionado</h6>
                  <div className="small">
                    <strong>Nombre:</strong> {selectedSupplierData.name}<br/>
                    {selectedSupplierData.contact_person && <><strong>Contacto:</strong> {selectedSupplierData.contact_person}<br/></>}
                    {selectedSupplierData.phone && <><strong>Teléfono:</strong> {selectedSupplierData.phone}<br/></>}
                    {selectedSupplierData.email && <><strong>Email:</strong> {selectedSupplierData.email}<br/></>}
                    {selectedSupplierData.address && <><strong>Dirección:</strong> {selectedSupplierData.address}</>}
                  </div>
                </div>
              </div>
            )}

            {/* Botón Crear */}
            <div className="col-12">
              <button
                onClick={handleCreateOrder}
                className="btn w-100"
                style={{ backgroundColor: '#0d9488', color: 'white' }}
                disabled={!selectedMaterial || !selectedSupplier || !quantity}
              >
                Crear Orden de Compra
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Órdenes */}
      <div className="card shadow-sm border-0">
        <div className="card-header" style={{ backgroundColor: '#0d9488', color: 'white' }}>
          <h5 className="mb-0">Historial de Órdenes</h5>
        </div>
        <div className="card-body p-0">
          {/* Desktop Table */}
          <div className="table-responsive d-none d-lg-block">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Material</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => {
                    const material = materials.find(m => m.id === order.material_id);
                    return (
                      <tr key={order.id}>
                        <td className="align-middle"><span className="badge bg-secondary">{order.id}</span></td>
                        <td className="align-middle"><small>{new Date(order.date).toLocaleDateString('es-ES')}</small></td>
                        <td className="align-middle">{order.supplier_name || 'Desconocido'}</td>
                        <td className="align-middle fw-semibold">{material ? material.name : `ID: ${order.material_id}`}</td>
                        <td className="align-middle">{order.quantity}</td>
                        <td className="align-middle">
                          <span className={`badge ${order.status === 'realizada' ? 'bg-success' : order.status === 'cancelada' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="align-middle text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            {order.status === 'pendiente' && (
                              <>
                                <button onClick={() => handleCompleteOrder(order.id)} className="btn btn-sm btn-success" title="Completar">✓</button>
                                <button onClick={() => handleCancelOrder(order.id)} className="btn btn-sm btn-danger" title="Cancelar">✕</button>
                              </>
                            )}
                            <button onClick={() => handlePrintOrder(order)} className="btn btn-sm btn-primary" title="Imprimir">🖨️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="7" className="text-center text-muted py-4">No hay órdenes registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="d-lg-none p-3">
            {orders.length > 0 ? (
              orders.map((order) => {
                const material = materials.find(m => m.id === order.material_id);
                return (
                  <div key={order.id} className="card mb-3 border">
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-2">
                        <h6 className="mb-0">Orden #{order.id}</h6>
                        <span className={`badge ${order.status === 'realizada' ? 'bg-success' : order.status === 'cancelada' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="small mb-3">
                        <div className="mb-1"><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString('es-ES')}</div>
                        <div className="mb-1"><strong>Proveedor:</strong> {order.supplier_name || 'Desconocido'}</div>
                        <div className="mb-1"><strong>Material:</strong> {material ? material.name : `ID: ${order.material_id}`}</div>
                        <div><strong>Cantidad:</strong> {order.quantity}</div>
                      </div>
                      <div className="d-flex gap-2">
                        {order.status === 'pendiente' && (
                          <>
                            <button onClick={() => handleCompleteOrder(order.id)} className="btn btn-sm btn-success flex-grow-1">✓ Completar</button>
                            <button onClick={() => handleCancelOrder(order.id)} className="btn btn-sm btn-danger flex-grow-1">✕ Cancelar</button>
                          </>
                        )}
                        <button onClick={() => handlePrintOrder(order)} className="btn btn-sm btn-primary">🖨️ Imprimir</button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted py-4">No hay órdenes registradas.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}