import { useState } from "react";
import { api, setToken } from "../services/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await api.login(username, password);
      setToken(data.access_token);
      onLogin();
    } catch (err) {
      setError("Credenciales inválidas");
    }
  };

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "24px",
      maxWidth: "400px",
      width: "100%",
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      width: "100%",
    },
    input: {
      width: "100%",
      padding: "16px 20px",
      border: "2px solid #e5e7eb",
      borderRadius: "12px",
      fontSize: "16px",
      transition: "all 0.3s ease",
      outline: "none",
      background: "#ffffff",
      boxSizing: "border-box",
      fontWeight: "500",
      color: "#1e293b",
    },
    button: {
      width: "100%",
      padding: "18px",
      background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
      marginTop: "8px",
    },
    error: {
      background: "#fef2f2",
      border: "2px solid #fecaca",
      color: "#dc2626",
      padding: "12px 16px",
      borderRadius: "12px",
      fontSize: "14px",
      fontWeight: "500",
      textAlign: "center",
      width: "100%",
      boxSizing: "border-box",
    },
  };

  return (
    <div style={styles.container}>
      {/* ❌ Eliminado el h2 con "PyGlass Stock" */}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" style={styles.button}>
          Iniciar Sesión
        </button>
      </form>

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}
