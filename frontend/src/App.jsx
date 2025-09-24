import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Materials from "./pages/Materials";
import Products from "./pages/Products";
import Purchases from "./pages/Purchases";
import { setToken } from "./services/api";

export default function App() {
  const [logged, setLogged] = useState(false);
  const [page, setPage] = useState("materials"); // por defecto materias primas
  const [showInventoryMenu, setShowInventoryMenu] = useState(false);

  // Al montar, verificar si ya hay token en localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setToken(token); // ⬅️ muy importante para que api.js tenga el token en memoria
      setLogged(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Limpia token
    setToken(null); // Reset en memoria
    setLogged(false);
    setPage("materials");
  };

  if (!logged) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>PyGlass Stock</h1>
        <Login onLogin={() => setLogged(true)} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", margin: "20px" }}>
      <header
        style={{
          backgroundColor: "#222",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <h1>PyGlass Stock</h1>
        <nav>
          {/* Inventario con submenú */}
          <button
            style={{ marginRight: "10px" }}
            onClick={() => setShowInventoryMenu(!showInventoryMenu)}
          >
            Inventario
          </button>
          {showInventoryMenu && (
            <span style={{ marginLeft: "10px" }}>
              <button
                style={{ marginRight: "10px" }}
                onClick={() => setPage("materials")}
              >
                Materias Primas
              </button>
              <button
                style={{ marginRight: "10px" }}
                onClick={() => setPage("products")}
              >
                Productos
              </button>
            </span>
          )}

          <button
            style={{ marginRight: "10px" }}
            onClick={() => setPage("purchases")}
          >
            Órdenes de Compra
          </button>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </nav>
      </header>

      <main style={{ marginTop: "20px" }}>
        {page === "materials" && <Materials />}
        {page === "products" && <Products />}
        {page === "purchases" && <Purchases />}
      </main>
    </div>
  );
}
