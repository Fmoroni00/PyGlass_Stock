import React, { useState, useEffect } from "react";

const API_URL = "https://pyglass-stock.onrender.com";

// Variable global mutable para el token
let token = null;

/**
 * Guardar token en memoria y en localStorage
 */
function setToken(newToken) {
  token = newToken;
  if (typeof window !== 'undefined') {
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
  }
}

/**
 * Cargar token desde memoria o localStorage
 */
function loadToken() {
  if (!token) {
    // Verificar si estamos en un entorno de navegador
    if (typeof window !== 'undefined') {
        token = localStorage.getItem("token");
    }
  }
  return token;
}

/**
 * Request genérico con autenticación y manejo de errores
 */
async function request(endpoint, method = "GET", body = null) {

  // USAMOS la API_URL que ahora apunta directamente a Render.
  const baseUrl = API_URL;

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const authToken = loadToken();
  if (authToken) {
    options.headers["Authorization"] = `Bearer ${authToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  // Se añaden reintentos con backoff exponencial para mejorar la resiliencia contra fallos de red
  // o problemas temporales de Render (hot start/sleep).
  const MAX_RETRIES = 3;
  let res;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      res = await fetch(`${baseUrl}${endpoint}`, options);
      if (res.ok || res.status < 500) {
        break; // Éxito o error manejable
      }
    } catch (error) {
      // Ignorar el error de red en el reintento si no es el último intento
      if (i === MAX_RETRIES - 1) {
        throw new Error(`Error de red tras ${MAX_RETRIES} intentos: ${error.message}`);
      }
    }
    // Espera exponencial: 500ms, 1000ms, 2000ms...
    await new Promise(resolve => setTimeout(resolve, 500 * (2 ** i)));
  }

  if (!res || !res.ok) {
    // Si res es null (todos los fetch fallaron por error de red) o no es ok
    if (!res) throw new Error("Fallo de conexión persistente con el servidor.");

    // Intenta obtener el error detallado del JSON
    const errorData = await res.json().catch(() => ({}));
    let errorMessage = `Error ${res.status}: `;

    if (errorData && errorData.detail) {
        if (typeof errorData.detail === 'string') {
            errorMessage += errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
            // Manejar errores de validación de Pydantic/FastAPI
            errorMessage += errorData.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(', ');
        } else {
            errorMessage += "Ocurrió un error desconocido en el servidor.";
        }
    } else if (res.statusText) {
        errorMessage += res.statusText;
    } else {
        errorMessage += "Error de red o servidor desconocido.";
    }

    // Loguear el error para debugging
    console.error("API Error Details:", errorData);
    throw new Error(errorMessage);
  }

  // Si la respuesta es 204 No Content (DELETE, PUT), no intentamos parsear JSON
  if (res.status === 204) {
      return {};
  }

  return res.json();
}

/**
 * Objeto API con todos los endpoints relevantes.
 */
const api = {
  // 📦 Materiales
  getMaterials: () => request("/materials/"),

  // 📝 Órdenes de Compra (Métodos necesarios para este componente)
  getOrders: () => request("/purchases/orders"),
  createOrder: (data) => request("/purchases/orders", "POST", data),
  completeOrder: (orderId) => request(`/purchases/orders/${orderId}/complete`, "PUT"),

  // 🚛 Proveedores
  getSuppliers: () => request("/suppliers/"),
  getMaterialSuppliers: (materialId) => request(`/suppliers/by-material/${materialId}`),
};

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================

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
  const [isLoading, setIsLoading] = useState(true); // Nuevo estado de carga

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
      // Asegurarse de que el campo 'status' esté en minúsculas para el CSS
      const formattedOrders = Array.isArray(data)
        ? data.map(order => ({
            ...order,
            status: order.status ? order.status.toLowerCase() : 'pendiente'
          }))
        : [];
      setOrders(formattedOrders);
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
      // Fallback a cargar todos los proveedores si la ruta específica falla
      try {
        const allSuppliers = await api.getSuppliers();
        setAvailableSuppliers(Array.isArray(allSuppliers) ? allSuppliers : []);
      } catch (fallbackErr) {
        setError("Error al cargar los proveedores: " + err.message);
      }
    }
  };

  // Carga inicial de datos
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(""); // Limpiar errores previos
      await Promise.all([
        fetchMaterials(),
        fetchOrders()
      ]);
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
        supplier_id: parseInt(selectedSupplier),
        material_id: parseInt(selectedMaterial),
        quantity: quantityNum,
      };

      const result = await api.createOrder(orderData);

      setSuccess(`Orden de compra #${result.id} creada exitosamente.`);

      // Limpiar formulario
      setSelectedMaterial("");
      setSelectedMaterialData(null);
      setSelectedSupplier("");
      setSelectedSupplierData(null);
      setAvailableSuppliers([]);
      setQuantity("");

      // Recargar materiales y órdenes (el stock del material habrá cambiado)
      await fetchMaterials();
      await fetchOrders();
    } catch (err) {
      setError("Error al crear la orden: " + err.message);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    setError("");
    setSuccess("");

    try {
      await api.completeOrder(orderId);
      setSuccess("Orden de compra completada y stock actualizado.");
      // Recargar materiales y órdenes (el stock del material habrá cambiado)
      await fetchMaterials();
      await fetchOrders();
    } catch (err) {
      setError("Error al completar la orden: " + err.message);
    }
  };

  if (isLoading) {
    return (
        <div className="container" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column'}}>
            <h1 style={{color: '#0d9488', fontSize: '1.5rem'}}>Cargando datos del servidor...</h1>
            <div style={{
                border: '4px solid rgba(0, 0, 0, 0.1)',
                borderTop: '4px solid #0d9488',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite',
                marginTop: '1rem'
            }}></div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
  }


  return (
    <>
      <style>
        {`
          :root {
            /* Colores Base - Tema de luz brillante */
            --bg-color: #f7f9fc; /* Fondo claro/blanco roto */
            --text-color: #1f2937; /* Texto oscuro */
            --card-bg: #ffffff; /* Fondo de tarjetas blanco puro */
            --border-color: #e5e7eb; /* Borde claro */
            --primary-color: #0d9488; /* Teal vibrante como color principal */
            --primary-hover-color: #0f766e;

            /* Alertas y Estados */
            --error-bg: #fee2e2; /* Red 100 */
            --error-text: #b91c1c; /* Red 700 */
            --success-bg: #dcfce7; /* Green 100 */
            --success-text: #16a34a; /* Green 700 */
            --table-header-bg: #f3f4f6; /* Gris muy claro */
            --yellow-bg: #fffbe6; /* Yellow 50 */
            --yellow-text: #a16207; /* Yellow 700 */
            --green-bg: #d1fae5; /* Green 100 */
            --green-text: #059669; /* Green 600 */
            --info-bg: #e0f2f1; /* Teal 100 */
            --info-text: #0d9488; /* Teal 600 */
            --info-border: #2dd4bf; /* Teal 300 */
          }

          /* Modo oscuro anulado para mantener la consistencia de los colores claros */
          @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #f7f9fc;
                --text-color: #1f2937;
                --card-bg: #ffffff;
                --border-color: #e5e7eb;
                --table-header-bg: #f3f4f6;
            }
          }

          .container {
            padding: 1.5rem;
            background-color: var(--bg-color);
            min-height: 100vh;
            color: var(--text-color);
            font-family: 'Inter', sans-serif;
            transition: background-color 0.3s;
          }

          .title {
            font-size: 2.25rem;
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 1.5rem;
          }

          .card {
            background-color: var(--card-bg);
            border-radius: 0.75rem; /* Ligeramente más redondeado */
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* Sombra más pronunciada */
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            transition: box-shadow 0.3s;
          }

          .card:hover {
             box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          }

          .subtitle {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-color);
            margin-bottom: 1rem;
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 0.5rem;
          }

          .alert {
            padding: 1rem;
            margin-bottom: 1rem;
            border-left: 5px solid; /* Borde más grueso */
            border-radius: 0.375rem;
            font-size: 0.9rem;
            font-weight: 500;
            line-height: 1.4;
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
            color: var(--info-text);
          }

          .info-title {
            font-weight: 700;
            color: var(--primary-color);
            margin-bottom: 0.5rem;
          }

          .info-content {
            font-size: 0.875rem;
            line-height: 1.6;
            color: var(--info-text);
          }

          .form-group {
            margin-bottom: 1rem;
          }

          .form-label {
            display: block;
            color: var(--text-color);
            margin-bottom: 0.4rem;
            font-weight: 600; /* Más énfasis */
            font-size: 0.95rem;
          }

          .form-input, .form-select {
            display: block;
            width: 100%;
            padding: 0.6rem;
            border-radius: 0.5rem;
            border: 1px solid var(--border-color);
            box-shadow: inset 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            background-color: var(--card-bg);
            color: var(--text-color);
            transition: border-color 0.2s, box-shadow 0.2s;
          }

          .form-select:focus, .form-input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.2); /* Sombra de enfoque con color primario */
          }

          .button {
            width: 100%;
            background-color: var(--primary-color);
            color: #ffffff;
            padding: 0.75rem 1rem;
            border-radius: 0.5rem;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s, transform 0.1s;
            font-weight: 700;
            margin-top: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            letter-spacing: 0.025em;
          }

          .button:hover:not(:disabled) {
            background-color: var(--primary-hover-color);
            transform: translateY(-1px);
          }

          .button:active:not(:disabled) {
            transform: translateY(0);
          }

          .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .table-container {
            overflow-x: auto;
            border-radius: 0.5rem;
            border: 1px solid var(--border-color);
          }

          .table {
            width: 100%;
            border-collapse: collapse;
            min-width: 900px; /* Ancho mínimo para legibilidad */
          }

          .table thead {
            background-color: var(--table-header-bg);
            border-bottom: 2px solid var(--border-color);
          }

          .table th {
            padding: 0.8rem 1.5rem;
            text-align: left;
            font-size: 0.75rem;
            font-weight: 700;
            color: #4b5563; /* Gris más oscuro */
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .table td {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--border-color);
            font-size: 0.875rem;
            color: var(--text-color);
          }

          .table tbody tr:last-child td {
            border-bottom: none;
          }

          .table tbody tr:hover {
            background-color: #f9f9fb; /* Gris muy ligero al pasar el ratón */
          }

          .status-badge {
            display: inline-flex;
            padding: 0.3rem 0.6rem;
            font-size: 0.75rem;
            font-weight: 700;
            border-radius: 9999px;
            text-transform: capitalize;
            letter-spacing: 0.05em;
          }

          .status-badge.realizada {
            background-color: var(--success-bg);
            color: var(--success-text);
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
            transition: color 0.2s, transform 0.1s;
            border-radius: 0.375rem;
          }

          .action-button:hover {
            color: var(--primary-hover-color);
            background-color: #f0fdfa; /* Teal 50 */
          }

          .action-button:active {
            transform: scale(0.95);
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
                disabled={!selectedMaterial || availableSuppliers.length === 0}
              >
                <option value="">-- Selecciona un proveedor --</option>
                {availableSuppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {!selectedMaterial && <small style={{display: 'block', marginTop: '0.5rem', color: '#6b7280'}}>Selecciona un material primero para ver los proveedores.</small>}
              {selectedMaterial && availableSuppliers.length === 0 && <small style={{display: 'block', marginTop: '0.5rem', color: '#dc2626'}}>⚠️ No se encontraron proveedores para este material.</small>}
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
                placeholder="Ingresa la cantidad a solicitar"
                disabled={!selectedSupplier}
              />
            </div>

            <button
              type="submit"
              className="button"
              disabled={!selectedMaterial || !selectedSupplier || !quantity}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '8px'}}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
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
                        <td>{order.supplier_name || 'Desconocido'}</td>
                        <td>
                          {material ? material.name : `ID: ${order.material_id}`}
                        </td>
                        <td>{order.quantity}</td>
                        <td>
                          {/* El status ahora está garantizado en minúsculas */}
                          <span className={`status-badge ${order.status}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          {order.status === 'pendiente' && (
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              className="action-button"
                              title="Marcar como recibida y actualizar stock"
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
