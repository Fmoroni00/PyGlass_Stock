import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Materials from "./pages/Materials";
import Products from "./pages/Products";
import Purchases from "./pages/Purchases";
import Cardex from "./pages/Cardex";
import { setToken } from "./services/api";

export default function App() {
  const [logged, setLogged] = useState(false);
  const [page, setPage] = useState("materials"); // Página por defecto
  const [showInventoryMenu, setShowInventoryMenu] = useState(false);

  // Al montar, verificar si ya hay token en localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setToken(token); // Guardar token en memoria para api.js
      setLogged(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); // Limpia token del storage
    setToken(null); // Reset en memoria
    setLogged(false);
    setPage("materials"); // Vuelve a la página por defecto
  };

  // Si NO está logueado → mostrar login
  if (!logged) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>PyGlass Stock</h1>
        <Login onLogin={() => setLogged(true)} />
      </div>
    );
  }

  // Si está logueado → mostrar menú + contenido
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
          {/* Botón de Inventario con submenú */}
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

          <button
            style={{ marginRight: "10px" }}
            onClick={() => setPage("cardex")}
          >
            Cardex
          </button>



          <button onClick={handleLogout}>Cerrar Sesión</button>
        </nav>
      </header>

      <main style={{ marginTop: "20px" }}>
        {page === "materials" && <Materials />}
        {page === "products" && <Products />}
        {page === "purchases" && <Purchases />}
        {page === "cardex" && <Cardex />}
      </main>
    </div>
  );
}

