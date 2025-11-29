import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Materials from "./pages/Materials";
import Products from "./pages/Products";
import Purchases from "./pages/Purchases";
import Cardex from "./pages/Cardex";
import { setToken } from "./services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function App() {
  const [logged, setLogged] = useState(false);
  const [page, setPage] = useState("materials");
  const [isValidating, setIsValidating] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsValidating(false);
        setLogged(false);
        return;
      }

      try {
        setToken(token);

        const response = await fetch(`${API_URL}/materials/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setLogged(true);
        } else {
          localStorage.removeItem("token");
          setToken(null);
          setLogged(false);
        }
      } catch (error) {
        console.error("Error validating token:", error);
        localStorage.removeItem("token");
        setToken(null);
        setLogged(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setLogged(false);
    setPage("materials");
    setShowMenu(false);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setShowMenu(false);
  };

  if (isValidating) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center"
           style={{ background: 'linear-gradient(135deg, #f8fafc, #e0f2fe, #cffafe)' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Validando sesión...</p>
        </div>
      </div>
    );
  }

  if (!logged) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center p-3"
           style={{ background: 'linear-gradient(135deg, #f8fafc, #e0f2fe, #cffafe)' }}>
        <div className="card shadow-lg border-0" style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                   style={{
                     width: '64px',
                     height: '64px',
                     background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                     fontSize: '24px'
                   }}>
                📦
              </div>
              <h1 className="h2 fw-bold mb-2" style={{
                background: 'linear-gradient(135deg, #1d4ed8, #0891b2)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                PyGlass Stock
              </h1>
              <p className="text-muted small mb-0">Sistema de Inventario para Vidriería</p>
            </div>
            <Login onLogin={() => setLogged(true)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f8fafc, #e0f2fe, #cffafe)' }}>
      {/* Header/Navbar */}
      <nav className="navbar navbar-expand-lg sticky-top shadow-sm"
           style={{
             backgroundColor: 'rgba(255, 255, 255, 0.9)',
             backdropFilter: 'blur(10px)'
           }}>
        <div className="container-fluid px-3 px-lg-4">
          {/* Logo y título */}
          <div className="d-flex align-items-center gap-2 gap-md-3">
            <div className="rounded-3 d-flex align-items-center justify-content-center"
                 style={{
                   width: '40px',
                   height: '40px',
                   background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                   fontSize: '16px'
                 }}>
              📦
            </div>
            <div>
              <h1 className="h5 fw-bold mb-0" style={{
                background: 'linear-gradient(135deg, #1d4ed8, #0891b2)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                PyGlass Stock
              </h1>
              <p className="small text-muted mb-0 d-none d-sm-block">Sistema de Inventario</p>
            </div>
          </div>

          {/* Botón hamburguesa móvil */}
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            style={{ padding: '0.5rem' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

                  {/* Menú de navegación */}
        <div className={`collapse navbar-collapse ${showMenu ? 'show' : ''}`}>
          <div className="navbar-nav ms-auto gap-2 mt-3 mt-lg-0">

            {/* Órdenes de compra */}
            <button
              className={`btn btn-sm ${page === 'purchases' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handlePageChange("purchases")}
            >
              🛒 <span className="d-none d-md-inline">Órdenes de Compra</span>
              <span className="d-md-none">Órdenes</span>
            </button>

            {/* Inventario materiales */}
            <button
              className={`btn btn-sm ${page === 'materials' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handlePageChange("materials")}
            >
              🧱 <span className="d-none d-md-inline">Inventario de Materiales</span>
              <span className="d-md-none">Materiales</span>
            </button>

            {/* Kardex */}
            <button
              className={`btn btn-sm ${page === 'cardex' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handlePageChange("cardex")}
            >
              📊 <span className="d-none d-md-inline">Kardex</span>
              <span className="d-md-none">Kardex</span>
            </button>

            {/* Inventario productos terminados */}
            <button
              className={`btn btn-sm ${page === 'products' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handlePageChange("products")}
            >
              📋 <span className="d-none d-md-inline">Inventario de Productos Terminados</span>
              <span className="d-md-none">Productos</span>
            </button>

            {/* Cerrar sesión */}
            <button
              className="btn btn-sm btn-danger"
              onClick={handleLogout}
            >
              🚪 <span className="d-none d-sm-inline">Cerrar Sesión</span>
              <span className="d-sm-none">Salir</span>
            </button>

          </div>
        </div>
        </div>
        </nav>

        {/* Contenido principal */}
        <main className="container-fluid px-3 px-lg-4 py-4">
          <div className="card shadow-lg border-0" style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            minHeight: '500px'
          }}>
            <div className="card-body p-3 p-md-4">
              {page === "purchases" && <Purchases />}
              {page === "materials" && <Materials />}
              {page === "cardex" && <Cardex />}
              {page === "products" && <Products />}
          </div>
        </div>
      </main>
    </div>
  );
}
