import React, { useState, useEffect } from "react";

// Inlined API logic to make the file self-contained
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
  getMaterials: () => {
    return fetch("http://127.0.0.1:8000/materials/", {
      headers: getHeaders(),
    }).then(handleResponse);
  },
  getOrders: () => {
    return fetch("http://127.0.0.1:8000/purchases/orders", {
      headers: getHeaders(),
    }).then(handleResponse);
  },
  createOrder: (orderData) => {
    return fetch("http://127.0.0.1:8000/purchases/orders", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(orderData),
    }).then(handleResponse);
  },
  completeOrder: (orderId) => {
    return fetch(`http://127.0.0.1:8000/purchases/orders/${orderId}/complete`, {
      method: "PUT",
      headers: getHeaders(),
    }).then(handleResponse);
  },
  getSuppliers: () => {
    return fetch("http://127.0.0.1:8000/suppliers/", {
      headers: getHeaders(),
    }).then(handleResponse);
  },
 getMaterialSuppliers: (materialId) => {
  return fetch(`http://127.0.0.1:8000/suppliers/by-material/${materialId}`, {
    headers: getHeaders(),
  }).then(handleResponse);
},
};

const Purchases = () => {
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

  const fetchMaterials = async () => {
    try {
      const data = await api.getMaterials();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching materials:", err);
      setError("Error al cargar los materiales: " + err.message);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Error al cargar las órdenes de compra: " + err.message);
    }
  };

  const fetchMaterialSuppliers = async (materialId) => {
    try {
      const data = await api.getMaterialSuppliers(materialId);
      setAvailableSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching material suppliers:", err);
      // Si no hay endpoint específico, cargar todos los suppliers
      try {
        const allSuppliers = await api.getSuppliers();
        setAvailableSuppliers(Array.isArray(allSuppliers) ? allSuppliers : []);
      } catch (fallbackErr) {
        setError("Error al cargar los proveedores: " + err.message);
      }
    }
  };

  useEffect(() => {
  fetchMaterials(); // prioridad

  // Cargar historial en segundo plano después de 2 segundos
  const timer = setTimeout(() => {
    fetchOrders();
  }, 2000);

  return () => clearTimeout(timer);
}, []);


  const handleMaterialChange = async (materialId) => {
    setSelectedMaterial(materialId);
    setSelectedSupplier("");
    setSelectedSupplierData(null);
    setAvailableSuppliers([]);

    if (materialId) {
      // Buscar los datos del material seleccionado
      const material = materials.find(m => m.id === parseInt(materialId));
      setSelectedMaterialData(material);

      // Cargar proveedores disponibles para este material
      await fetchMaterialSuppliers(materialId);
    } else {
      setSelectedMaterialData(null);
    }
  };

  const handleSupplierChange = (supplierId) => {
    setSelectedSupplier(supplierId);

    if (supplierId) {
      // Buscar los datos del proveedor seleccionado
      const supplier = availableSuppliers.find(s => s.id === parseInt(supplierId));
      setSelectedSupplierData(supplier);
    } else {
      setSelectedSupplierData(null);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validaciones
    if (!selectedMaterial) {
      setError("Por favor, selecciona un material.");
      return;
    }

    if (!selectedSupplier) {
      setError("Por favor, selecciona un proveedor.");
      return;
    }

    const quantityNum = parseInt(quantity);
    if (!quantity || quantityNum <= 0 || isNaN(quantityNum)) {
      setError("Por favor, especifica una cantidad válida mayor a 0.");
      return;
    }

    try {
      if (!selectedSupplierData) {
        setError("Datos del proveedor no encontrados.");
        return;
      }

      const orderData = {
        supplier_id: parseInt(selectedSupplier), // Cambio: enviar supplier_id en lugar de supplier_name
        material_id: parseInt(selectedMaterial),
        quantity: quantityNum,
      };

      console.log("Enviando orden:", orderData);
      const result = await api.createOrder(orderData);
      console.log("Orden creada:", result);

      setSuccess("Orden de compra creada exitosamente.");

      // Limpiar formulario
      setSelectedMaterial("");
      setSelectedMaterialData(null);
      setSelectedSupplier("");
      setSelectedSupplierData(null);
      setAvailableSuppliers([]);
      setQuantity("");

      // Recargar órdenes
      await fetchOrders();
    } catch (err) {
      console.error("Error creating order:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      });

      let errorMsg = "Error desconocido";
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === 'string') {
        errorMsg = err;
      } else {
        errorMsg = JSON.stringify(err);
      }

      setError("Error al crear la orden: " + errorMsg);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    setError("");
    setSuccess("");

    try {
      console.log("Completando orden:", orderId);
      await api.completeOrder(orderId);
      setSuccess("Orden de compra completada y stock actualizado.");
      await fetchOrders();
    } catch (err) {
      console.error("Error completing order:", err);
      setError("Error al completar la orden: " + err.message);
    }
  };

  return (
    <>
      <style>
        {`
          :root {
            --bg-color: #f3f4f6;
            --text-color: #374151;
            --card-bg: #ffffff;
            --border-color: #e5e7eb;
            --primary-color: #4f46e5;
            --primary-hover-color: #4338ca;
            --error-bg: #fee2e2;
            --error-text: #b91c1c;
            --success-bg: #dcfce7;
            --success-text: #166534;
            --table-header-bg: #f9fafb;
            --yellow-bg: #fef3c7;
            --yellow-text: #92400e;
            --green-bg: #d1fae5;
            --green-text: #065f46;
            --info-bg: #dbeafe;
            --info-text: #1e40af;
            --info-border: #3b82f6;
          }

          @media (prefers-color-scheme: dark) {
            :root {
              --bg-color: #111827;
              --text-color: #d1d5db;
              --card-bg: #1f2937;
              --border-color: #374151;
              --error-bg: #450a0a;
              --error-text: #fca5a5;
              --success-bg: #064e3b;
              --success-text: #6ee7b7;
              --table-header-bg: #1f2937;
              --yellow-bg: #44400e;
              --yellow-text: #fde68a;
              --green-bg: #065f46;
              --green-text: #a7f3d0;
              --info-bg: #1e3a8a;
              --info-text: #93c5fd;
              --info-border: #3b82f6;
            }
          }

          .container {
            padding: 1.5rem;
            background-color: var(--bg-color);
            min-height: 100vh;
            color: var(--text-color);
          }

          .title {
            font-size: 2.25rem;
            font-weight: 700;
            color: var(--text-color);
            margin-bottom: 1.5rem;
          }

          .card {
            background-color: var(--card-bg);
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .subtitle {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-color);
            margin-bottom: 1rem;
          }

          .alert {
            padding: 1rem;
            margin-bottom: 1rem;
            border-left: 4px solid;
            border-radius: 0.5rem;
          }

          .alert.error {
            background-color: var(--error-bg);
            border-color: var(--error-text);
            color: var(--error-text);
          }

          .alert.success {
            background-color: var(--success-bg);
            border-color: var(--success-text);
            color: var(--success-text);
          }

          .info-panel {
            background-color: var(--info-bg);
            border: 1px solid var(--info-border);
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 1rem;
          }

          .info-title {
            font-weight: 600;
            color: var(--info-text);
            margin-bottom: 0.5rem;
          }

          .info-content {
            color: var(--info-text);
            font-size: 0.875rem;
            line-height: 1.5;
          }

          .form-group {
            margin-bottom: 1rem;
          }

          .form-label {
            display: block;
            color: var(--text-color);
            margin-bottom: 0.25rem;
            font-weight: 500;
          }

          .form-input, .form-select {
            display: block;
            width: 100%;
            padding: 0.5rem;
            border-radius: 0.375rem;
            border: 1px solid var(--border-color);
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            background-color: var(--card-bg);
            color: var(--text-color);
          }

          .form-select:focus, .form-input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
          }

          .button {
            width: 100%;
            background-color: var(--primary-color);
            color: #ffffff;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
            font-weight: 500;
          }

          .button:hover {
            background-color: var(--primary-hover-color);
          }

          .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .table-container {
            overflow-x: auto;
          }

          .table {
            width: 100%;
            border-collapse: collapse;
          }

          .table thead {
            background-color: var(--table-header-bg);
          }

          .table th {
            padding: 0.75rem 1.5rem;
            text-align: left;
            font-size: 0.75rem;
            font-weight: 500;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .table td {
            padding: 1rem 1.5rem;
            white-space: nowrap;
            border-bottom: 1px solid var(--border-color);
          }

          .table tbody tr {
            background-color: var(--card-bg);
          }

          .status-badge {
            display: inline-flex;
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
            border-radius: 9999px;
          }

          .status-badge.realizada {
            background-color: var(--green-bg);
            color: var(--green-text);
          }

          .status-badge.pendiente {
            background-color: var(--yellow-bg);
            color: var(--yellow-text);
          }

          .action-button {
            padding: 0.5rem;
            color: var(--primary-color);
            border: none;
            background: none;
            cursor: pointer;
          }

          .action-button:hover {
            color: var(--primary-hover-color);
          }
        `}
      </style>
      <div className="container">
        <h1 className="title">Órdenes de Compra</h1>

        {/* Sección para crear una nueva orden */}
        <div className="card">
          <h2 className="subtitle">Crear Orden</h2>
          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <form onSubmit={handleCreateOrder}>
            <div className="form-group">
              <label htmlFor="material-select" className="form-label">1. Seleccionar Material/Producto</label>
              <select
                id="material-select"
                value={selectedMaterial}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="form-select"
              >
                <option value="">-- Selecciona un material --</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} (ID: {material.id}) - Stock: {material.stock}
                  </option>
                ))}
              </select>
            </div>

            {selectedMaterialData && (
              <div className="info-panel">
                <div className="info-title">Material Seleccionado</div>
                <div className="info-content">
                  <strong>Nombre:</strong> {selectedMaterialData.name}<br/>
                  <strong>Stock actual:</strong> {selectedMaterialData.stock} unidades<br/>
                  {selectedMaterialData.description && (
                    <>
                      <strong>Descripción:</strong> {selectedMaterialData.description}<br/>
                    </>
                  )}
                  {selectedMaterialData.unit && (
                    <>
                      <strong>Unidad:</strong> {selectedMaterialData.unit}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="supplier-select" className="form-label">2. Seleccionar Proveedor</label>
              <select
                id="supplier-select"
                value={selectedSupplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="form-select"
                disabled={!selectedMaterial}
              >
                <option value="">-- Selecciona un proveedor --</option>
                {availableSuppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedSupplierData && (
              <div className="info-panel">
                <div className="info-title">Proveedor Seleccionado</div>
                <div className="info-content">
                  <strong>Nombre:</strong> {selectedSupplierData.name}<br/>
                  {selectedSupplierData.contact_person && (
                    <>
                      <strong>Contacto:</strong> {selectedSupplierData.contact_person}<br/>
                    </>
                  )}
                  {selectedSupplierData.phone && (
                    <>
                      <strong>Teléfono:</strong> {selectedSupplierData.phone}<br/>
                    </>
                  )}
                  {selectedSupplierData.email && (
                    <>
                      <strong>Email:</strong> {selectedSupplierData.email}<br/>
                    </>
                  )}
                  {selectedSupplierData.address && (
                    <>
                      <strong>Dirección:</strong> {selectedSupplierData.address}
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="quantity-input" className="form-label">3. Cantidad</label>
              <input
                id="quantity-input"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="form-input"
                placeholder="Ingresa la cantidad"
                disabled={!selectedSupplier}
              />
            </div>

            <button
              type="submit"
              className="button"
              disabled={!selectedMaterial || !selectedSupplier || !quantity}
            >
              Crear Orden de Compra
            </button>
          </form>
        </div>

        {/* Historial de Órdenes */}
        <div className="card">
          <h2 className="subtitle">Historial de Órdenes</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Material</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => {
                    const material = materials.find(m => m.id === order.material_id);
                    return (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{new Date(order.date).toLocaleDateString()}</td>
                        <td>{order.supplier_name}</td>
                        <td>
                          {material ? material.name : `ID: ${order.material_id}`}
                        </td>
                        <td>{order.quantity}</td>
                        <td>
                          <span className={`status-badge ${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          {order.status === 'pendiente' && (
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              className="action-button"
                              title="Marcar como realizada"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-8.8"/><path d="M22 4L12 14.01l-3-3"/></svg>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", color: "#6b7280" }}>
                      No hay órdenes de compra registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Purchases;