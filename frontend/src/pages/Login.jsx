import { useState } from "react";
import { api, setToken } from "../services/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const data = await api.login(username, password);
      setToken(data.access_token);
      onLogin();
      window.location.reload();
    } catch (err) {
      setError("Credenciales inválidas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconContainer}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={styles.icon}>
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1L9 7V9C9 10.1 9.9 11 11 11V22H13V11C14.1 11 15 10.1 15 9Z" fill="#2563eb"/>
            </svg>
          </div>
          <h2 style={styles.title}>Iniciar Sesión</h2>
          <p style={styles.subtitle}>Ingresa tus credenciales para continuar</p>
        </div>

        <div style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Usuario</label>
            <input
              type="text"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              style={styles.input}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleSubmit}
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : {}),
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div style={styles.loadingContent}>
                <div style={styles.spinner}></div>
                Iniciando sesión...
              </div>
            ) : (
              "Entrar"
            )}
          </button>
        </div>

        {error && (
          <div style={styles.errorContainer}>
            <div style={styles.errorIcon}>⚠️</div>
            <p style={styles.errorText}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)",
    padding: "20px",
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  card: {
    background: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
    padding: "40px",
    width: "100%",
    maxWidth: "420px",
    border: "1px solid rgba(255, 255, 255, 0.2)"
  },
  header: {
    textAlign: "center",
    marginBottom: "32px"
  },
  iconContainer: {
    display: "inline-block",
    padding: "16px",
    backgroundColor: "#eff6ff",
    borderRadius: "12px",
    marginBottom: "16px"
  },
  icon: {
    display: "block"
  },
  title: {
    color: "#1e40af",
    margin: "0 0 8px 0",
    fontSize: "32px",
    fontWeight: "700",
    letterSpacing: "-0.025em"
  },
  subtitle: {
    color: "#64748b",
    margin: "0",
    fontSize: "15px",
    fontWeight: "400"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    color: "#334155",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "4px"
  },
  input: {
    padding: "14px 16px",
    border: "2px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "16px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    outline: "none",
    backgroundColor: "#ffffff",
    color: "#1e293b",
    fontFamily: "inherit"
  },
  button: {
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "16px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    marginTop: "8px",
    fontFamily: "inherit",
    position: "relative",
    overflow: "hidden"
  },
  buttonDisabled: {
    backgroundColor: "#94a3b8",
    cursor: "not-allowed",
    transform: "none"
  },
  loadingContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px"
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255, 255, 255, 0.3)",
    borderTop: "2px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  errorContainer: {
    marginTop: "24px",
    padding: "16px",
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  errorIcon: {
    fontSize: "18px"
  },
  errorText: {
    color: "#dc2626",
    margin: "0",
    fontSize: "14px",
    fontWeight: "500",
    flex: 1
  }
};

// Inyectar estilos CSS para animaciones y efectos hover
if (typeof document !== 'undefined') {
  const styleId = 'login-component-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement("style");
    styleSheet.id = styleId;
    styleSheet.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      input:focus {
        border-color: #2563eb !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1) !important;
        transform: translateY(-1px);
      }

      input:hover:not(:disabled) {
        border-color: #3b82f6 !important;
      }

      button:hover:not(:disabled) {
        background-color: #1d4ed8 !important;
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(29, 78, 216, 0.4) !important;
      }

      button:active:not(:disabled) {
        transform: translateY(0);
      }

      button:before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
      }

      button:hover:before {
        left: 100%;
      }
    `;
    document.head.appendChild(styleSheet);
  }
}