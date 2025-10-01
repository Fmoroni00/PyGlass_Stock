import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await api.getProducts();
      setProducts(res);
      setError(null);
    } catch (err) {
      setError("Error al cargar productos");
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
      const product = products.find((p) => p.id === id);
      if (!product) return;
      await api.updateProduct(id, { ...product, stock: parsed });
      setEditingId(null);
      await fetchProducts();
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

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="row align-items-center mb-4">
        <div className="col-md-8">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 p-3 rounded-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM7 12H9V17H7V12ZM11 7H13V17H11V7ZM15 10H17V17H15V10Z" fill="#198754"/>
              </svg>
            </div>
            <div>
              <h1 className="h3 fw-bold text-success mb-1">Productos Fabricados</h1>
              <p className="text-muted mb-0 small">Inventario de productos terminados</p>
            </div>
          </div>
        </div>
        <div className="col-md-4 text-md-end mt-3 mt-md-0">
          <button onClick={fetchProducts} className="btn btn-success d-inline-flex align-items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12S7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12S8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
            </svg>
            Actualizar
          </button>
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
      <div className="card shadow-sm border-0 d-none d-md-block">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th className="fw-semibold">ID</th>
                <th className="fw-semibold">Nombre del Producto</th>
                <th className="fw-semibold">Stock Disponible</th>
                <th className="fw-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="align-middle">
                    <span className="badge bg-secondary">{p.id}</span>
                  </td>
                  <td className="align-middle fw-semibold">{p.name}</td>
                  <td className="align-middle">
                    {editingId === p.id ? (
                      <input
                        type="number"
                        value={newStock}
                        onChange={(e) => setNewStock(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, p.id)}
                        className="form-control form-control-sm"
                        style={{ width: '100px' }}
                        autoFocus
                        disabled={isSaving}
                      />
                    ) : (
                      <span className="badge bg-success bg-opacity-25 text-success fw-bold fs-6">
                        {p.stock} unidades
                      </span>
                    )}
                  </td>
                  <td className="align-middle text-center">
                    {editingId === p.id ? (
                      <div className="d-flex gap-2 justify-content-center">
                        <button
                          onClick={() => saveStock(p.id)}
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
                          setEditingId(p.id);
                          setNewStock(p.stock);
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        ✏️ Modificar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards - Hidden on desktop */}
      <div className="d-md-none">
        {products.map((p) => (
          <div key={p.id} className="card shadow-sm border-0 mb-3">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="card-title fw-bold mb-2">{p.name}</h5>
                  <span className="badge bg-secondary">ID: {p.id}</span>
                </div>
              </div>

              <div className="mb-3">
                <small className="text-muted d-block mb-2">Stock Disponible</small>
                {editingId === p.id ? (
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, p.id)}
                    className="form-control"
                    autoFocus
                    disabled={isSaving}
                    placeholder="Ingrese nuevo stock"
                  />
                ) : (
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success bg-opacity-25 text-success fw-bold fs-5">
                      {p.stock}
                    </span>
                    <span className="text-muted small">unidades</span>
                  </div>
                )}
              </div>

              <div className="d-grid gap-2">
                {editingId === p.id ? (
                  <div className="d-flex gap-2">
                    <button
                      onClick={() => saveStock(p.id)}
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
                      setEditingId(p.id);
                      setNewStock(p.stock);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    ✏️ Modificar Stock
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {products.length === 0 && !error && (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5">
            <div className="mb-3" style={{ fontSize: '3rem' }}>📋</div>
            <h3 className="h5 fw-semibold mb-2">No hay productos registrados</h3>
            <p className="text-muted mb-0">Aún no se han agregado productos al sistema</p>
          </div>
        </div>
      )}
    </div>
  );
}