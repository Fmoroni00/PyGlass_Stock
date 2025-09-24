import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null); // ID del producto en edición
  const [newStock, setNewStock] = useState(""); // valor temporal

  // Cargar productos al montar
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.getProducts();
      setProducts(res);
      setError(null);
    } catch (err) {
      setError("Error al cargar productos");
      console.error(err);
    }
  };

  // Guardar nuevo stock
  const saveStock = async (id) => {
    const parsed = parseInt(newStock, 10);
    if (isNaN(parsed)) {
      alert("El valor debe ser un número válido");
      return;
    }
    try {
      const product = products.find((p) => p.id === id);
      if (!product) return;
      await api.updateProduct(id, { ...product, stock: parsed });
      setEditingId(null); // salir del modo edición
      fetchProducts();
    } catch (err) {
      console.error("Error modificando stock:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Productos Fabricados</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table
        border="1"
        cellPadding="10"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>
                {editingId === p.id ? (
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    style={{ width: "70px", textAlign: "center" }}
                  />
                ) : (
                  p.stock
                )}
              </td>
              <td>
                {editingId === p.id ? (
                  <>
                    <button onClick={() => saveStock(p.id)}>💾 Guardar</button>
                    <button onClick={() => setEditingId(null)}>❌ Cancelar</button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(p.id);
                      setNewStock(p.stock); // inicializa con el stock actual
                    }}
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
  );
}
