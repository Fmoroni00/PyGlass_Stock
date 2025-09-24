import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Inventory() {
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [mats, prods] = await Promise.all([
          api.getMaterials(),
          api.getProducts(),
        ]);
        setMaterials(mats);
        setProducts(prods);
      } catch (err) {
        setError("Error al cargar inventario");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <p>Cargando inventario...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Inventario</h2>

      <h3>Materiales</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Stock</th>
            <th>Mínimo</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr
              key={m.id}
              style={{
                backgroundColor: m.stock < m.min_stock ? "#ffcccc" : "white",
              }}
            >
              <td>{m.name}</td>
              <td>{m.stock}</td>
              <td>{m.min_stock}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Productos</h3>
      <table border="1" cellPadding="5">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Stock</th>
            <th>Mínimo</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr
              key={p.id}
              style={{
                backgroundColor: p.stock < p.min_stock ? "#ffcccc" : "white",
              }}
            >
              <td>{p.name}</td>
              <td>{p.stock}</td>
              <td>{p.min_stock}</td>
              <td>{p.sale_price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
