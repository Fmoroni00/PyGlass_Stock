import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const res = await api.getMaterials();
      setMaterials(res);
      setError(null);
    } catch (err) {
      setError("Error al cargar materiales");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveStock = async (id) => {
    const parsed = parseInt(newStock, 10);
    if (isNaN(parsed)) {
      alert("El valor debe ser un número válido");
      return;
    }
    try {
      setIsSaving(true);
      const material = materials.find((m) => m.id === id);
      if (!material) return;
      await api.updateMaterial(id, { ...material, stock: parsed });
      setEditingId(null);
      await fetchMaterials();
    } catch (err) {
      console.error("Error modificando stock:", err);
      alert("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e, id) => {
    if (e.key === 'Enter') {
      saveStock(id);
    }
    if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const getStockStatus = (stock, minStock) => {
    if (stock <= minStock) return 'danger';
    if (stock <= minStock * 1.5) return 'warning';
    return 'success';
  };

  const getStatusText = (status) => {
    if (status === 'danger') return '🔴 Crítico';
    if (status === 'warning') return '🟡 Bajo';
    return '🟢 Normal';
  };

  if (isLoading) {
    return (
      <div className="container-fluid bg-light min-vh-100 py-4">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando materiales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container-xxl">
        {/* Header */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-lg-8 col-md-7 mb-3 mb-md-0">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V8H19V19ZM7 10V12H9V10H7ZM11 10V12H13V10H11ZM15 10V12H17V10H15Z" fill="#0d6efd"/>
                    </svg>
                  </div>
                  <div>
                    <h1 className="h3 fw-bold text-primary mb-1">Materias Primas</h1>
                    <p className="text-muted mb-0 small">Gestión de inventario y stock</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-md-5 text-md-end">
                <button onClick={fetchMaterials} className="btn btn-primary d-inline-flex align-items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12S7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12S8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
                  </svg>
                  Actualizar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
            <span className="me-2">⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {/* Desktop Table - Hidden on mobile */}
        <div className="card shadow-sm border-0 d-none d-lg-block">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="fw-semibold">ID</th>
                  <th className="fw-semibold">Nombre</th>
                  <th className="fw-semibold">Tipo</th>
                  <th className="fw-semibold">Color</th>
                  <th className="fw-semibold">Stock Actual</th>
                  <th className="fw-semibold">Stock Mínimo</th>
                  <th className="fw-semibold">Estado</th>
                  <th className="fw-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => {
                  const stockStatus = getStockStatus(m.stock, m.min_stock);
                  return (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td className="fw-semibold">{m.name}</td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary">{m.type}</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              backgroundColor: m.color,
                              borderRadius: '50%',
                              border: '2px solid white',
                              boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                            }}
                          ></div>
                          <span className="small">{m.color}</span>
                        </div>
                      </td>
                      <td>
                        {editingId === m.id ? (
                          <input
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            onKeyDown={(e) => handleKeyPress(e, m.id)}
                            className="form-control form-control-sm"
                            style={{ width: '100px' }}
                            autoFocus
                            disabled={isSaving}
                          />
                        ) : (
                          <span className={`badge bg-${stockStatus} bg-opacity-25 text-${stockStatus} fw-bold`}>
                            {m.stock}
                          </span>
                        )}
                      </td>
                      <td className="text-muted">{m.min_stock}</td>
                      <td>
                        <span className={`badge bg-${stockStatus}`}>
                          {getStatusText(stockStatus)}
                        </span>
                      </td>
                      <td className="text-center">
                        {editingId === m.id ? (
                          <div className="d-flex gap-2 justify-content-center">
                            <button
                              onClick={() => saveStock(m.id)}
                              className="btn btn-success btn-sm d-flex align-items-center gap-1"
                              disabled={isSaving}
                            >
                              {isSaving ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status"></span>
                                  Guardando...
                                </>
                              ) : (
                                <>💾 Guardar</>
                              )}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn btn-danger btn-sm"
                              disabled={isSaving}
                            >
                              ❌ Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(m.id);
                              setNewStock(m.stock);
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            ✏️ Modificar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards - Hidden on desktop */}
        <div className="d-lg-none">
          {materials.map((m) => {
            const stockStatus = getStockStatus(m.stock, m.min_stock);
            return (
              <div key={m.id} className="card shadow-sm border-0 mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="card-title fw-bold mb-1">{m.name}</h5>
                      <span className="badge bg-primary bg-opacity-10 text-primary">{m.type}</span>
                    </div>
                    <span className="badge bg-secondary">ID: {m.id}</span>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Color</small>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            backgroundColor: m.color,
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                          }}
                        ></div>
                        <span className="small">{m.color}</span>
                      </div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Estado</small>
                      <span className={`badge bg-${stockStatus}`}>
                        {getStatusText(stockStatus)}
                      </span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Stock Actual</small>
                      {editingId === m.id ? (
                        <input
                          type="number"
                          value={newStock}
                          onChange={(e) => setNewStock(e.target.value)}
                          onKeyDown={(e) => handleKeyPress(e, m.id)}
                          className="form-control form-control-sm"
                          autoFocus
                          disabled={isSaving}
                        />
                      ) : (
                        <span className={`badge bg-${stockStatus} bg-opacity-25 text-${stockStatus} fw-bold fs-6`}>
                          {m.stock}
                        </span>
                      )}
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Stock Mínimo</small>
                      <span className="text-muted fw-semibold">{m.min_stock}</span>
                    </div>
                  </div>

                  <div className="d-grid gap-2">
                    {editingId === m.id ? (
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => saveStock(m.id)}
                          className="btn btn-success btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <span className="spinner-border spinner-border-sm" role="status"></span>
                              Guardando...
                            </>
                          ) : (
                            <>💾 Guardar</>
                          )}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn btn-danger btn-sm flex-grow-1"
                          disabled={isSaving}
                        >
                          ❌ Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(m.id);
                          setNewStock(m.stock);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        ✏️ Modificar Stock
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {materials.length === 0 && !error && (
          <div className="card shadow-sm border-0">
            <div className="card-body text-center py-5">
              <div className="mb-3" style={{ fontSize: '3rem' }}>📦</div>
              <h3 className="h5 fw-semibold mb-2">No hay materiales registrados</h3>
              <p className="text-muted mb-0">Aún no se han agregado materias primas al sistema</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}