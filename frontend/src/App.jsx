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

        // Intenta hacer una petición a materials para validar el token
        const response = await fetch(`${API_URL}/materials/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setLogged(true);
        } else {
          // Token inválido o expirado
          localStorage.removeItem("token");
          setToken(null);
          setLogged(false);
        }
      } catch (error) {
        // Error de red o servidor
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
  };

  const baseButtonStyle = {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    whiteSpace: 'nowrap'
  };

  const getButtonStyle = (isActive = false) => ({
    ...baseButtonStyle,
    backgroundColor: isActive ? '#dbeafe' : 'rgba(255, 255, 255, 0.8)',
    color: isActive ? '#1d4ed8' : '#374151',
    boxShadow: isActive ? '0 2px 8px rgba(29, 78, 216, 0.2)' : '0 2px 6px rgba(0,0,0,0.05)',
    fontWeight: isActive ? '600' : '500'
  });

  // Pantalla de carga mientras valida el token
  if (isValidating) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc, #e0f2fe, #cffafe)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter','Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(59, 130, 246, 0.2)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Validando sesión...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!logged) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc, #e0f2fe, #cffafe)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Inter','Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: '48px',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              borderRadius: '50%',
              marginBottom: '16px',
              fontSize: '24px'
            }}>
              📦
            </div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #1d4ed8, #0891b2)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 8px 0'
            }}>
              PyGlass Stock
            </h1>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              Sistema de Inventario para Vidriería
            </p>
          </div>
          <Login onLogin={() => setLogged(true)} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc, #e0f2fe, #cffafe)',
      fontFamily: "'Inter','Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <header style={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                📦
              </div>
              <div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #1d4ed8, #0891b2)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>
                  PyGlass Stock
                </h1>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  Sistema de Inventario
                </p>
              </div>
            </div>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button style={getButtonStyle(page === 'materials')} onClick={() => setPage("materials")}>🧱 Materias Primas</button>
              <button style={getButtonStyle(page === 'products')} onClick={() => setPage("products")}>📋 Productos</button>
              <button style={getButtonStyle(page === 'purchases')} onClick={() => setPage("purchases")}>🛒 Órdenes de Compra</button>
              <button style={getButtonStyle(page === 'cardex')} onClick={() => setPage("cardex")}>📊 Cardex</button>
              <button
                style={{
                  ...baseButtonStyle,
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
                  fontWeight: '600'
                }}
                onClick={handleLogout}
              >
                🚪 Cerrar Sesión
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          padding: '32px',
          minHeight: '500px'
        }}>
          {page === "materials" && <Materials />}
          {page === "products" && <Products />}
          {page === "purchases" && <Purchases />}
          {page === "cardex" && <Cardex />}
        </div>
      </main>
    </div>
  );
}