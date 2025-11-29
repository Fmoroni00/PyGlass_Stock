import { useState } from "react";
import { api, setToken } from "../services/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await api.login(username, password);
      setToken(data.access_token);
      onLogin();
    } catch (err) {
      setError("Credenciales inválidas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-100">
      <form onSubmit={handleSubmit}>
        {/* Username Input */}
        <div className="mb-3">
          <input
            type="text"
            className="form-control form-control-lg"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={isLoading}
            style={{
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              padding: '14px 18px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          />
        </div>

        {/* Password Input */}
        <div className="mb-3">
          <input
            type="password"
            className="form-control form-control-lg"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            style={{
              borderRadius: '12px',
              border: '2px solid #e5e7eb',
              padding: '14px 18px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger py-2 mb-3" role="alert">
            <small className="mb-0">{error}</small>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="btn btn-primary btn-lg w-100 fw-semibold"
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #93c5fd 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '14px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
            fontSize: '16px'
          }}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Iniciando...
            </>
          ) : (
            'Iniciar Sesión'
          )}
        </button>
      </form>
    </div>
  );
}