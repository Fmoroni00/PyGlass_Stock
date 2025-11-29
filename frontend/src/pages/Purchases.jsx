import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";

const INITIAL_SUPPLIER_STATE = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  material_id: null, // Se llenará automáticamente
};

export default function Purchases() {
  const [materials, setMaterials] = useState([]);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState(INITIAL_SUPPLIER_STATE);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [selectedMaterialData, setSelectedMaterialData] = useState(null);
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedSupplierData, setSelectedSupplierData] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState(null);

  const isCreatingOrderRef = useRef(false);
  const processingOrderRef = useRef(null);

  const fetchMaterials = async () => {
    try {
      const data = await api.getMaterials();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Error al cargar materiales: " + err.message);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders();
      const formatted = Array.isArray(data)
        ? data.map(order => ({
            ...order,
            status: order.status?.toLowerCase() || 'pendiente'
          }))
        : [];
      setOrders(formatted);
    } catch (err) {
      setError("Error al cargar órdenes: " + err.message);
    }
  };

  const fetchMaterialSuppliers = async (materialId) => {
    try {
      const data = await api.getMaterialSuppliers(materialId);
      setAvailableSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      setAvailableSuppliers([]);
    }
  };

  const openNewSupplierModal = () => {
    // Pre-carga el material_id del material ya seleccionado
    setNewSupplierData({
      ...INITIAL_SUPPLIER_STATE,
      material_id: parseInt(selectedMaterial),
    });
    setShowAddSupplierModal(true); // Abre el modal
    setError(""); // Limpia errores antiguos
  };


  const handleCreateSupplier = async (e) => {
    e.preventDefault();

    if (!newSupplierData.name || newSupplierData.name.trim() === "") {
      alert("Por favor, ingresa un nombre para el proveedor.");
      return;
    }

    setIsCreatingOrder(true); // Reutilizamos este estado para bloquear el botón
    setError("");

    try {

      const newSupplier = await api.addSupplier(newSupplierData);

      // 2. Cierra el modal y resetea el formulario
      setShowAddSupplierModal(false);
      setNewSupplierData(INITIAL_SUPPLIER_STATE);

      // 3. Recarga la lista de proveedores para este material
      await fetchMaterialSuppliers(selectedMaterial);

      // 4. ¡MAGIA! Selecciona automáticamente el proveedor recién creado
      setSelectedSupplier(newSupplier.id);
      setSelectedSupplierData(newSupplier);

    } catch (err) {
      console.error("Error creando proveedor:", err);
      // Muestra el error dentro del modal (si el modal sigue abierto)
      setError("Error al crear: " + (err.message || "Error desconocido"));
    } finally {
      setIsCreatingOrder(false); // Libera el botón
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMaterials(), fetchOrders()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleMaterialChange = async (materialId) => {
    setSelectedMaterial(materialId);
    setSelectedSupplier("");
    setSelectedSupplierData(null);
    setAvailableSuppliers([]);
    setError("");

    if (materialId) {
      const material = materials.find(m => m.id === parseInt(materialId));
      setSelectedMaterialData(material);
      await fetchMaterialSuppliers(materialId);
    } else {
      setSelectedMaterialData(null);
    }
  };

  const handleSupplierChange = (supplierId) => {
    setSelectedSupplier(supplierId);
    setError("");
    if (supplierId) {
      const supplier = availableSuppliers.find(s => s.id === parseInt(supplierId));
      setSelectedSupplierData(supplier);
    } else {
      setSelectedSupplierData(null);
    }
  };

  const handleCreateOrder = async () => {
    // Verificar si ya hay una operación en curso
    if (isCreatingOrderRef.current) {
      console.log("Ya hay una orden siendo creada, ignorando clic duplicado");
      return;
    }

    setError("");
    setSuccess("");

    if (!selectedMaterial) {
      setError("Selecciona un material.");
      return;
    }
    if (!selectedSupplier) {
      setError("Selecciona un proveedor.");
      return;
    }
    const qty = parseInt(quantity);
    if (!quantity || qty <= 0 || isNaN(qty)) {
      setError("Ingresa una cantidad válida mayor a 0.");
      return;
    }

    // Marcar que estamos procesando
    isCreatingOrderRef.current = true;
    setIsCreatingOrder(true);

    try {
      const orderData = {
        supplier_id: parseInt(selectedSupplier),
        material_id: parseInt(selectedMaterial),
        quantity: qty,
      };
      const result = await api.createOrder(orderData);
      setSuccess(`Orden #${result.id} creada exitosamente.`);

      setSelectedMaterial("");
      setSelectedMaterialData(null);
      setSelectedSupplier("");
      setSelectedSupplierData(null);
      setAvailableSuppliers([]);
      setQuantity("");

      await fetchMaterials();
      await fetchOrders();
    } catch (err) {
      setError("Error al crear orden: " + err.message);
    } finally {
      // Liberar el bloqueo
      isCreatingOrderRef.current = false;
      setIsCreatingOrder(false);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    // Verificar si ya se está procesando esta orden
    if (processingOrderRef.current === orderId) {
      console.log("Esta orden ya se está procesando, ignorando clic duplicado");
      return;
    }

    setError("");
    setSuccess("");
    processingOrderRef.current = orderId;
    setProcessingOrderId(orderId);

    try {
      await api.completeOrder(orderId);
      setSuccess("Orden completada y stock actualizado.");
      await fetchMaterials();
      await fetchOrders();
    } catch (err) {
      setError("Error al completar orden: " + err.message);
    } finally {
      processingOrderRef.current = null;
      setProcessingOrderId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    // Verificar si ya se está procesando esta orden
    if (processingOrderRef.current === orderId) {
      console.log("Esta orden ya se está procesando, ignorando clic duplicado");
      return;
    }

    setError("");
    setSuccess("");

    if (!window.confirm("¿Estás seguro de cancelar esta orden? Esta acción no se puede deshacer.")) {
      return;
    }

    processingOrderRef.current = orderId;
    setProcessingOrderId(orderId);

    try {
      await api.cancelOrder(orderId);
      setSuccess("Orden cancelada exitosamente.");
      await fetchOrders();
    } catch (err) {
      setError("Error al cancelar orden: " + err.message);
    } finally {
      processingOrderRef.current = null;
      setProcessingOrderId(null);
    }
  };

  const handlePrintOrder = async (order) => {
    try {
      // 1. Obtenemos los datos frescos y completos del proveedor
      const supplierData = await api.getSupplier(order.supplier_id);

      // 2. Buscamos el material (ya lo tenemos en memoria)
      const material = materials.find(m => m.id === order.material_id);

      // 3. Generamos el PDF
      const printWindow = window.open('', '_blank');

      // Preparamos los valores para que no salga "undefined"
      const supName = supplierData.name || 'Sin nombre';
      const supContact = supplierData.contact_person || '-';
      const supPhone = supplierData.phone || '-';
      const supEmail = supplierData.email || '-';
      const supAddress = supplierData.address || '-';

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Orden de Compra #${order.id}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; font-size: 14px; }
              
              /* Cabecera */
              .header { border-bottom: 3px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
              .company-info h1 { font-size: 28px; font-weight: bold; color: #0d9488; margin-bottom: 5px; }
              .company-info p { color: #666; font-size: 14px; }
              .document-info { text-align: right; }
              .document-title { font-size: 16px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 5px; }
              .order-number { font-size: 32px; font-weight: bold; color: #333; }
              
              /* Grid de Información */
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; }
              .box { background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #eee; }
              .box-title { font-size: 14px; font-weight: bold; color: #0d9488; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
              
              .info-row { display: flex; margin-bottom: 8px; }
              .info-label { font-weight: 600; width: 100px; color: #555; }
              .info-value { flex: 1; color: #111; }

              /* Tabla */
              .table-container { margin-top: 10px; }
              .table { width: 100%; border-collapse: collapse; }
              .table th { background-color: #0d9488; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
              .table td { padding: 12px; border-bottom: 1px solid #eee; }
              .table tr:last-child td { border-bottom: 2px solid #0d9488; }
              
              /* Estado */
              .status-badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; text-transform: uppercase; border: 1px solid; }
              .status-pendiente { background-color: #fffbe6; color: #b45309; border-color: #fcd34d; }
              .status-realizada { background-color: #dcfce7; color: #15803d; border-color: #86efac; }
              .status-cancelada { background-color: #fee2e2; color: #b91c1c; border-color: #fca5a5; }

              /* Footer */
              .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #666; }
              .signature-box { text-align: center; border-top: 1px solid #333; width: 200px; padding-top: 10px; }
              
              @media print { 
                body { padding: 0; } 
                .no-print { display: none; } 
                .box { border: 1px solid #ccc; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="company-info">
                <h1>PyGlass Stock</h1>
                <p>Sistema de Gestión de Inventario</p>
                <p>Lima, Perú</p>
              </div>
              <div class="document-info">
                <div class="document-title">Orden de Compra</div>
                <div class="order-number">#${String(order.id).padStart(6, '0')}</div>
                <p style="margin-top: 5px;">Fecha: ${new Date(order.date).toLocaleDateString('es-ES')}</p>
              </div>
            </div>

            <div class="info-grid">
              <div class="box">
                <div class="box-title">Proveedor</div>
                <div class="info-row"><div class="info-label">Empresa:</div><div class="info-value"><strong>${supName}</strong></div></div>
                <div class="info-row"><div class="info-label">Contacto:</div><div class="info-value">${supContact}</div></div>
                <div class="info-row"><div class="info-label">Teléfono:</div><div class="info-value">${supPhone}</div></div>
                <div class="info-row"><div class="info-label">Email:</div><div class="info-value">${supEmail}</div></div>
                <div class="info-row"><div class="info-label">Dirección:</div><div class="info-value">${supAddress}</div></div>
              </div>

              <div class="box">
                <div class="box-title">Detalles Generales</div>
                <div class="info-row"><div class="info-label">Estado:</div><div class="info-value"><span class="status-badge status-${order.status}">${order.status}</span></div></div>
                <div class="info-row">
                  <div class="info-label">Solicitante:</div>
                  <div class="info-value" style="text-transform: capitalize;">
                    ${order.user_name || 'Usuario #' + order.user_id}
                  </div>
                </div>
                <div class="info-row"><div class="info-label">Emisión:</div><div class="info-value">${new Date().toLocaleString('es-ES')}</div></div>
              </div>
            </div>

            <div class="section table-container">
              <div class="box-title" style="border-bottom: none; margin-bottom: 5px;">Items Solicitados</div>
              <table class="table">
                <thead>
                  <tr>
                    <th style="width: 15%;">ID Ref.</th>
                    <th style="width: 45%;">Descripción del Material</th>
                    <th style="width: 20%;">Color / Tipo</th>
                    <th style="width: 20%; text-align: right;">Cantidad Solicitada</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${order.material_id}</td>
                    <td><strong>${material ? material.name : 'Material no encontrado'}</strong></td>
                    <td>${material ? (material.type + ' - ' + material.color) : '-'}</td>
                    <td style="text-align: right; font-size: 16px; font-weight: bold;">${order.quantity}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="footer">
              <div style="max-width: 60%;">
                <p><strong>Observaciones:</strong></p>
                <p>Por favor, confirmar recepción de esta orden y fecha estimada de entrega.</p>
              </div>
              <div class="signature-box">
                Firma Autorizada
              </div>
            </div>

            <div class="no-print" style="position: fixed; bottom: 20px; right: 20px; background: white; padding: 10px; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <button onclick="window.print()" style="background-color: #0d9488; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🖨️ Imprimir / PDF</button>
              <button onclick="window.close()" style="background-color: #6b7280; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">Cerrar</button>
            </div>
          </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

    } catch (err) {
      console.error("Error al imprimir:", err);
      alert("No se pudieron cargar los datos completos del proveedor para la impresión.");
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-teal mb-3" role="status" style={{ width: '3rem', height: '3rem', color: '#0d9488' }}>
          <span className="visually-hidden">Cargando...</span>
        </div>
        <p className="text-muted">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="p-3 rounded-3" style={{ backgroundColor: 'rgba(13, 148, 136, 0.1)' }}>
            <span style={{ fontSize: '32px' }}>🛒</span>
          </div>
          <div>
            <h1 className="h3 fw-bold mb-1" style={{ color: '#0d9488' }}>Órdenes de Compra</h1>
            <p className="text-muted mb-0 small">Gestión de pedidos a proveedores</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
        </div>
      )}

      {/* Crear Orden Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header" style={{ backgroundColor: '#0d9488', color: 'white' }}>
          <h5 className="mb-0">Crear Nueva Orden</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            {/* Paso 1: Material */}
            <div className="col-12">
              <label className="form-label fw-semibold">1. Seleccionar Material</label>
              <select
                value={selectedMaterial}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="form-select"
              >
                <option value="">-- Selecciona un material --</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (ID: {m.id}) - Stock: {m.stock}
                  </option>
                ))}
              </select>
            </div>

            {/* Material Info */}
            {selectedMaterialData && (
              <div className="col-12">
                <div className="alert alert-info mb-0">
                  <h6 className="alert-heading">Material Seleccionado</h6>
                  <div className="small">
                    <strong>Nombre:</strong> {selectedMaterialData.name}<br/>
                    <strong>Stock actual:</strong> {selectedMaterialData.stock} unidades<br/>
                    {selectedMaterialData.description && <><strong>Descripción:</strong> {selectedMaterialData.description}<br/></>}
                    {selectedMaterialData.unit && <><strong>Unidad:</strong> {selectedMaterialData.unit}</>}
                  </div>
                </div>
              </div>
            )}

            {/* Paso 2: Proveedor */}
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-semibold mb-0">2. Seleccionar Proveedor</label>

                {/* Botón para abrir el modal de nuevo proveedor */}
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={openNewSupplierModal} // Llama a la función que abre el modal
                  disabled={!selectedMaterial}   // Se desactiva si no has elegido material
                  title="Añadir nuevo proveedor para este material"
                  style={{ padding: '2px 8px', fontSize: '12px' }} // Opcional: ajuste fino de tamaño
                >
                  ➕ Nuevo
                </button>
              </div>
              <select
                value={selectedSupplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="form-select"
                disabled={!selectedMaterial || availableSuppliers.length === 0}
              >
                <option value="">-- Selecciona un proveedor --</option>
                {availableSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {!selectedMaterial && <small className="text-muted d-block mt-1">Selecciona un material primero.</small>}
              {selectedMaterial && availableSuppliers.length === 0 && <small className="text-danger d-block mt-1">No hay proveedores para este material.</small>}
            </div>

            {/* Paso 3: Cantidad */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">3. Cantidad</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="form-control"
                placeholder="Cantidad a solicitar"
                disabled={!selectedSupplier}
              />
            </div>

            {/* Supplier Info */}
            {selectedSupplierData && (
              <div className="col-12">
                <div className="alert alert-success mb-0">
                  <h6 className="alert-heading">Proveedor Seleccionado</h6>
                  <div className="small">
                    <strong>Nombre:</strong> {selectedSupplierData.name}<br/>
                    {selectedSupplierData.contact_person && <><strong>Contacto:</strong> {selectedSupplierData.contact_person}<br/></>}
                    {selectedSupplierData.phone && <><strong>Teléfono:</strong> {selectedSupplierData.phone}<br/></>}
                    {selectedSupplierData.email && <><strong>Email:</strong> {selectedSupplierData.email}<br/></>}
                    {selectedSupplierData.address && <><strong>Dirección:</strong> {selectedSupplierData.address}</>}
                  </div>
                </div>
              </div>
            )}

            {/* Botón Crear */}
            <div className="col-12">
              <button
                onClick={handleCreateOrder}
                className="btn w-100"
                style={{ backgroundColor: '#0d9488', color: 'white' }}
                disabled={!selectedMaterial || !selectedSupplier || !quantity || isCreatingOrder}
              >
                {isCreatingOrder ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Procesando...
                  </>
                ) : (
                  'Crear Orden de Compra'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Órdenes */}
      <div className="card shadow-sm border-0">
        <div className="card-header" style={{ backgroundColor: '#0d9488', color: 'white' }}>
          <h5 className="mb-0">Historial de Órdenes</h5>
        </div>
        <div className="card-body p-0">
          {/* Desktop Table */}
          <div className="table-responsive d-none d-lg-block">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Proveedor</th>
                  <th>Material</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0 ? (
                  orders.map((order) => {
                    const material = materials.find(m => m.id === order.material_id);
                    return (
                      <tr key={order.id}>
                        <td className="align-middle"><span className="badge bg-secondary">{order.id}</span></td>
                        <td className="align-middle"><small>{new Date(order.date).toLocaleDateString('es-ES')}</small></td>
                        <td className="align-middle">{order.supplier_name || 'Desconocido'}</td>
                        <td className="align-middle fw-semibold">{material ? material.name : `ID: ${order.material_id}`}</td>
                        <td className="align-middle">{order.quantity}</td>
                        <td className="align-middle">
                          <span className={`badge ${order.status === 'realizada' ? 'bg-success' : order.status === 'cancelada' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="align-middle text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            {order.status === 'pendiente' && (
                              <>
                                <button
                                  onClick={() => handleCompleteOrder(order.id)}
                                  className="btn btn-sm btn-success"
                                  title="Completar"
                                  disabled={processingOrderId === order.id}
                                >
                                  {processingOrderId === order.id ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  ) : '✓'}
                                </button>
                                <button
                                  onClick={() => handleCancelOrder(order.id)}
                                  className="btn btn-sm btn-danger"
                                  title="Cancelar"
                                  disabled={processingOrderId === order.id}
                                >
                                  {processingOrderId === order.id ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  ) : '✕'}
                                </button>
                              </>
                            )}
                            <button onClick={() => handlePrintOrder(order)} className="btn btn-sm btn-primary" title="Imprimir">🖨️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr><td colSpan="7" className="text-center text-muted py-4">No hay órdenes registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="d-lg-none p-3">
            {orders.length > 0 ? (
              orders.map((order) => {
                const material = materials.find(m => m.id === order.material_id);
                return (
                  <div key={order.id} className="card mb-3 border">
                    <div className="card-body">
                      <div className="d-flex justify-content-between mb-2">
                        <h6 className="mb-0">Orden #{order.id}</h6>
                        <span className={`badge ${order.status === 'realizada' ? 'bg-success' : order.status === 'cancelada' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="small mb-3">
                        <div className="mb-1"><strong>Fecha:</strong> {new Date(order.date).toLocaleDateString('es-ES')}</div>
                        <div className="mb-1"><strong>Proveedor:</strong> {order.supplier_name || 'Desconocido'}</div>
                        <div className="mb-1"><strong>Material:</strong> {material ? material.name : `ID: ${order.material_id}`}</div>
                        <div><strong>Cantidad:</strong> {order.quantity}</div>
                      </div>
                      <div className="d-flex gap-2">
                        {order.status === 'pendiente' && (
                          <>
                            <button
                              onClick={() => handleCompleteOrder(order.id)}
                              className="btn btn-sm btn-success flex-grow-1"
                              disabled={processingOrderId === order.id}
                            >
                              {processingOrderId === order.id ? (
                                <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Procesando...</>
                              ) : (
                                <>✓ Completar</>
                              )}
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="btn btn-sm btn-danger flex-grow-1"
                              disabled={processingOrderId === order.id}
                            >
                              {processingOrderId === order.id ? (
                                <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Procesando...</>
                              ) : (
                                <>✕ Cancelar</>
                              )}
                            </button>
                          </>
                        )}
                        <button onClick={() => handlePrintOrder(order)} className="btn btn-sm btn-primary">🖨️ Imprimir</button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center text-muted py-4">No hay órdenes registradas.</div>
            )}
          </div>
        </div>
      </div>
      {showAddSupplierModal && (
        <div className="modal" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">

              <form onSubmit={handleCreateSupplier}>

                <div className="modal-header">
                  <h5 className="modal-title">Añadir Nuevo Proveedor</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddSupplierModal(false)}
                    disabled={isCreatingOrder}
                  ></button>
                </div>

                <div className="modal-body">
                  {/* Muestra el error aquí si falla la creación */}
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  {/* Basado en el schema SupplierCreate */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Nombre del Proveedor</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej: Proveedor S.A."
                      value={newSupplierData.name}
                      onChange={(e) => setNewSupplierData({ ...newSupplierData, name: e.target.value })}
                      required
                      autoFocus
                      disabled={isCreatingOrder}
                    />
                  </div>

                  {/* Campo de Material (deshabilitado) */}
                  <div className="mb-3">
                    <label className="form-label">Material Asociado</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedMaterialData?.name || `ID: ${selectedMaterial}`}
                      disabled // El usuario no debe cambiar esto
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Contacto (Opcional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nombre del contacto"
                        value={newSupplierData.contact_person}
                        onChange={(e) => setNewSupplierData({ ...newSupplierData, contact_person: e.target.value })}
                        disabled={isCreatingOrder}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teléfono (Opcional)</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="987654321"
                        value={newSupplierData.phone}
                        onChange={(e) => setNewSupplierData({ ...newSupplierData, phone: e.target.value })}
                        disabled={isCreatingOrder}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Email (Opcional)</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="contacto@proveedor.com"
                      value={newSupplierData.email}
                      onChange={(e) => setNewSupplierData({ ...newSupplierData, email: e.target.value })}
                      disabled={isCreatingOrder}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Dirección (Opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Av. Principal 123"
                      value={newSupplierData.address}
                      onChange={(e) => setNewSupplierData({ ...newSupplierData, address: e.target.value })}
                      disabled={isCreatingOrder}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddSupplierModal(false)}
                    disabled={isCreatingOrder}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isCreatingOrder}
                  >
                    {isCreatingOrder ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Guardando...
                      </>
                    ) : (
                      'Guardar Proveedor'
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}
      {/* --- FIN DEL BLOQUE DEL MODAL --- */}
    </div>
  );
}