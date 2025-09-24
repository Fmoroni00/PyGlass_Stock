import React, { useState, useEffect } from "react";

// Inlined API logic to make the file self-contained
let token = localStorage.getItem("token");

const getHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Error en la petición");
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
};

const Purchases = () => {
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchMaterials = async () => {
    try {
      const data = await api.getMaterials();
      setMaterials(data);
    } catch (err) {
      setError("Error al cargar los materiales.");
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      setError("Error al cargar las órdenes de compra.");
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchOrders();
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedMaterial || quantity <= 0) {
      setError("Por favor, selecciona un material y especifica una cantidad mayor a 0.");
      return;
    }

    const [materialId, supplierName] = selectedMaterial.split('|');

    const orderData = {
      supplier_name: supplierName,
      material_id: parseInt(materialId),
      quantity: quantity,
    };

    try {
      await api.createOrder(orderData);
      setSuccess("Orden de compra creada exitosamente.");
      fetchOrders();
    } catch (err) {
      setError("Error al crear la orden. " + err.message);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    setError("");
    setSuccess("");
    try {
      await api.completeOrder(orderId);
      setSuccess("Orden de compra completada y stock actualizado.");
      fetchOrders(); // Recargar la lista para ver el cambio de estado
    } catch (err) {
      setError("Error al completar la orden. " + err.message);
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

          .form-group {
            margin-bottom: 1rem;
          }

          .form-label {
            display: block;
            color: var(--text-color);
            margin-bottom: 0.25rem;
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

          .button {
            width: 100%;
            background-color: var(--primary-color);
            color: #ffffff;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
          }

          .button:hover {
            background-color: var(--primary-hover-color);
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
              <label htmlFor="material-select" className="form-label">Seleccionar Material</label>
              <select
                id="material-select"
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="form-select"
              >
                <option value="">-- Selecciona un material --</option>
                {materials.map((material) => (
                  <option key={material.id} value={`${material.id}|${material.supplier_name}`}>
                    {material.name} (ID: {material.id}) - Proveedor: {material.supplier_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="quantity-input" className="form-label">Cantidad</label>
              <input
                id="quantity-input"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="form-input"
              />
            </div>
            <button
              type="submit"
              className="button"
            >
              Crear Orden
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
                  <th>ID Material</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{new Date(order.date).toLocaleDateString()}</td>
                      <td>{order.supplier_name}</td>
                      <td>{order.material_id}</td>
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
                  ))
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
