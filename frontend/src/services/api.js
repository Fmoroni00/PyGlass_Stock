export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

let token = null;

/**
 * Guardar token en memoria y en localStorage
 */
export function setToken(newToken) {
  token = newToken;
  if (newToken) {
    localStorage.setItem("token", newToken);
  } else {
    localStorage.removeItem("token");
  }
}

/**
 * Cargar token desde memoria o localStorage
 */
function loadToken() {
  if (!token) {
    token = localStorage.getItem("token");
  }
  return token;
}

/**
 * Request genérico con autenticación
 */
async function request(endpoint, method = "GET", body = null) {
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

  const res = await fetch(`${API_URL}${endpoint}`, options);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      `Error ${res.status}: ${errorData.detail || "Ocurrió un error"}`
    );
  }

  return res.json();
}

export const api = {
  /**
   * 🔐 Login
   */
  login: async (username, password) => {
    const data = new URLSearchParams();
    data.append("username", username);
    data.append("password", password);

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: data,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `Error ${res.status}: ${errorData.detail || "Login fallido"}`
      );
    }

    const result = await res.json();
    setToken(result.access_token);
    return result;
  },

  /**
   * 📦 Materias Primas
   */
  getMaterials: () => request("/materials/"),
  addMaterial: (data) => request("/materials/", "POST", data), //
  updateMaterial: (id, data) => request(`/materials/${id}`, "PUT", data),
  deleteMaterial: (id) => request(`/materials/${id}`, "DELETE"),

  /**
   * 🛠️ Productos
   */
  getProducts: () => request("/products/"),
  addProduct: (data) => request("/products/", "POST", data),
  updateProduct: (id, data) => request(`/products/${id}/`, "PUT", data),
  deleteProduct: (id) => request(`/products/${id}/`, "DELETE"),
  addStock: (id, quantity = 1) =>
    request(`/products/${id}/add/?quantity=${quantity}`, "POST"),
  removeStock: (id, quantity = 1) =>
    request(`/products/${id}/remove/?quantity=${quantity}`, "POST"),

  /**
   * 🚨 Alertas
   */
  getMaterialAlerts: () => request("/inventory/alerts/materials/"),
  getProductAlerts: () => request("/inventory/alerts/products/"),

  /**
   * 📝 Órdenes de Compra
   */
  getOrders: () => request("/purchases/orders/"),
  createOrder: (data) => request("/purchases/orders/", "POST", data),
  completeOrder: (orderId) => request(`/purchases/orders/${orderId}/complete`, "PUT"),
  cancelOrder: (orderId) => request(`/purchases/orders/${orderId}/cancel`, "PUT"),

  /**
   * 🏢 Proveedores
   */
  getSuppliers: () => request("/suppliers/"), // <-- AÑADIR ESTA LÍNEA
  addSupplier: (data) => request("/suppliers/", "POST", data), // <-- AÑADIR ESTA LÍNEA
  getMaterialSuppliers: (materialId) => request(`/suppliers/by-material/${materialId}`),
  /**
   *
   * 📊 Kardex
   */
  getKardex: () => request("/kardex/"),
};