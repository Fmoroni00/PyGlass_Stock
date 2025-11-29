import React, { useEffect, useState } from "react";
import * as XLSX from 'xlsx';
import { api } from "../services/api";

export default function Cardex() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filtros
  const [filterType, setFilterType] = useState('all');
  const [filterMovement, setFilterMovement] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCardex();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, filterType, filterMovement, searchTerm]);

  const fetchCardex = async () => {
    try {
      setIsLoading(true);
      const res = await api.getKardex();
      setRecords(Array.isArray(res) ? res : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching kardex:", err);
      setError("Error al cargar movimientos de inventario: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    if (filterType !== 'all') {
      filtered = filtered.filter(record => {
        if (filterType === 'material') {
          return record.material_id || record.material_name;
        }
        if (filterType === 'product') {
          return record.product_id || record.product_name;
        }
        return true;
      });
    }

    if (filterMovement !== 'all') {
      filtered = filtered.filter(record => {
        const movementType = record.movement_type?.toLowerCase() || '';
        if (filterMovement === 'entrada') {
          return movementType.includes('entrada') || movementType.includes('compra') || movementType.includes('ingreso');
        }
        if (filterMovement === 'salida') {
          return movementType.includes('salida') || movementType.includes('venta') || movementType.includes('consumo');
        }
        if (filterMovement === 'ajuste') {
          return movementType.includes('ajuste') || movementType.includes('inventario');
        }
        return true;
      });
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        const itemDetails = getItemDetails(record);
        return (
          itemDetails.name.toLowerCase().includes(search) ||
          (record.observaciones && record.observaciones.toLowerCase().includes(search)) ||
          (record.username && record.username.toLowerCase().includes(search))
        );
      });
    }

    setFilteredRecords(filtered);
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterMovement('all');
    setSearchTerm('');
  };

const formatDate = (dateString) => {
  if (!dateString) return "Sin fecha";
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return "Fecha inválida";

    // Convertir de UTC a hora local de Lima (-5)
    const limaDate = new Date(date.getTime() - 5 * 60 * 60 * 1000);

    const formatter = new Intl.DateTimeFormat("es-PE", {
      timeZone: "America/Lima",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return formatter.format(limaDate);
  } catch (err) {
    console.error("Error al formatear fecha:", err);
    return "Error de fecha";
  }
};


const getItemDetails = (record) => {
  if (record.material_id || record.material_name) {
    const name =
      record.material_name && record.material_name.trim() !== ""
        ? record.material_name // ✅ ya viene con (ID: X) desde el backend
        : `Material ID: ${record.material_id}`;
    return {
      name,
      type: "material",
      id: record.material_id,
    };
  }

  if (record.product_id || record.product_name) {
    const name =
      record.product_name && record.product_name.trim() !== ""
        ? record.product_name // ✅ mismo caso para productos
        : `Producto ID: ${record.product_id}`;
    return {
      name,
      type: "product",
      id: record.product_id,
    };
  }

  return {
    name: "Ítem desconocido",
    type: "unknown",
    id: record.id || "-",
  };
};


  const getMovementIcon = (movementType) => {
    switch (movementType?.toLowerCase()) {
      case "entrada":
      case "compra":
      case "ingreso":
        return "⬆️";
      case "salida":
      case "venta":
      case "consumo":
        return "⬇️";
      case "ajuste":
      case "inventario":
        return "⚙️";
      default:
        return "📦";
    }
  };

  const getMovementLabel = (movementType) => {
    switch (movementType?.toLowerCase()) {
      case "entrada":
      case "compra":
      case "ingreso":
        return "Entrada";
      case "salida":
      case "venta":
      case "consumo":
        return "Salida";
      case "ajuste":
      case "inventario":
        return "Ajuste";
      default:
        return movementType || "Movimiento";
    }
  };

  const getMovementBadgeClass = (movementType) => {
    switch (movementType?.toLowerCase()) {
      case "entrada":
      case "compra":
      case "ingreso":
        return "bg-success";
      case "salida":
      case "venta":
      case "consumo":
        return "bg-danger";
      case "ajuste":
      case "inventario":
        return "bg-warning";
      default:
        return "bg-secondary";
    }
  };

  const formatQuantity = (record) => {
    const movementType = record.movement_type?.toLowerCase() || '';
    const quantity = Math.abs(record.quantity);

    if (movementType.includes('salida') || movementType.includes('venta') || movementType.includes('consumo')) {
      return `-${quantity}`;
    }
    if (movementType.includes('entrada') || movementType.includes('compra') || movementType.includes('ingreso')) {
      return `+${quantity}`;
    }
    return record.quantity >= 0 ? `+${quantity}` : `-${quantity}`;
  };

  const exportToExcel = () => {
    try {
      setIsExporting(true);

      const dataToExport = filteredRecords.length > 0 ? filteredRecords : records;

      const excelData = dataToExport.map((record) => {
        const itemDetails = getItemDetails(record);
        return {
          'Fecha': formatDate(record.date),
          'Tipo': itemDetails.type === 'material' ? 'Material' : 'Producto',
          'Item': itemDetails.name,
          'ID Item': itemDetails.id,
          'Movimiento': getMovementLabel(record.movement_type),
          'Cantidad': formatQuantity(record),
          'Stock Anterior': record.stock_anterior || 0,
          'Stock Nuevo': record.stock_nuevo || 0,
          'Usuario': record.username || record.user_id || '-',
          'Observaciones': record.observaciones || '-'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Kardex");

      const columnWidths = [
        { wch: 18 },
        { wch: 10 },
        { wch: 30 },
        { wch: 10 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 40 },
      ];
      worksheet['!cols'] = columnWidths;

      const now = new Date();
      const fileName = `Kardex_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.xlsx`;

      XLSX.writeFile(workbook, fileName);

    } catch (err) {
      console.error("Error al exportar:", err);
      alert("Error al exportar los datos a Excel");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid bg-light min-vh-100 py-4">
        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
          <div className="spinner-border text-info mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Cargando movimientos...</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = filterType !== 'all' || filterMovement !== 'all' || searchTerm.trim() !== '';

  return (
    <div className="container-fluid bg-light min-vh-100 py-4">
      <div className="container-xxl">
        {/* Header */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-lg-6 col-md-5 mb-3 mb-md-0">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-info bg-opacity-10 p-3 rounded-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path d="M9 17H7V10H9V17ZM13 17H11V7H13V17ZM17 17H15V13H17V17ZM19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="#0dcaf0"/>
                    </svg>
                  </div>
                  <div>
                    <h1 className="h3 fw-bold text-info mb-1">Kardex</h1>
                    <p className="text-muted mb-0 small">Historial de movimientos de inventario</p>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 col-md-7 text-md-end">
                <div className="d-flex flex-column flex-sm-row gap-2 justify-content-md-end">
                  <button
                    onClick={exportToExcel}
                    className="btn btn-success d-inline-flex align-items-center justify-content-center gap-2"
                    disabled={isExporting || records.length === 0}
                  >
                    {isExporting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        Exportando...
                      </>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M19 12V19H5V12H3V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V12H19ZM13 12.67L15.59 10.09L17 11.5L12 16.5L7 11.5L8.41 10.09L11 12.67V3H13V12.67Z" fill="currentColor"/>
                        </svg>
                        Exportar Excel
                      </>
                    )}
                  </button>
                  <button
                    onClick={fetchCardex}
                    className="btn btn-info d-inline-flex align-items-center justify-content-center gap-2"
                    disabled={isLoading}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4 7.58 4 12S7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12S8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="currentColor"/>
                    </svg>
                    Actualizar
                  </button>
                </div>
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

        {/* Filtros */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-lg-3 col-md-6">
                <label className="form-label small text-muted mb-1">Buscar</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar por nombre, observaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-lg-3 col-md-6">
                <label className="form-label small text-muted mb-1">Tipo de Item</label>
                <select
                  className="form-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="material">Materiales</option>
                  <option value="product">Productos</option>
                </select>
              </div>
              <div className="col-lg-3 col-md-6">
                <label className="form-label small text-muted mb-1">Tipo de Movimiento</label>
                <select
                  className="form-select"
                  value={filterMovement}
                  onChange={(e) => setFilterMovement(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="entrada">Entradas</option>
                  <option value="salida">Salidas</option>
                  <option value="ajuste">Ajustes</option>
                </select>
              </div>
              <div className="col-lg-3 col-md-6 d-flex align-items-end">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="btn btn-outline-secondary w-100"
                  >
                    Limpiar Filtros
                  </button>
                )}
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-3">
                <small className="text-muted">
                  Mostrando {filteredRecords.length} de {records.length} registros
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="card shadow-sm border-0 d-none d-xl-block">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="fw-semibold">Fecha</th>
                  <th className="fw-semibold">Item</th>
                  <th className="fw-semibold">Movimiento</th>
                  <th className="fw-semibold">Cantidad</th>
                  <th className="fw-semibold">Stock Anterior</th>
                  <th className="fw-semibold">Stock Nuevo</th>
                  <th className="fw-semibold">Usuario</th>
                  <th className="fw-semibold">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => {
                  const itemDetails = getItemDetails(record);
                  const movementBadgeClass = getMovementBadgeClass(record.movement_type);

                  return (
                    <tr key={record.id || index}>
                      <td className="align-middle">
                        <small>{formatDate(record.date)}</small>
                      </td>
                        <td className="align-middle">
                          <div className="d-flex align-items-center gap-2">
                            <span className={`badge ${itemDetails.type === 'material' ? 'bg-primary' : 'bg-success'} bg-opacity-25 text-${itemDetails.type === 'material' ? 'primary' : 'success'}`}>
                              {itemDetails.type === 'material' ? 'M' : 'P'}
                            </span>
                            <span className="fw-semibold">
                              {itemDetails.name} (ID: {itemDetails.id})
                            </span>
                          </div>
                        </td>
                      <td className="align-middle">
                        <span className={`badge ${movementBadgeClass}`}>
                          {getMovementIcon(record.movement_type)} {getMovementLabel(record.movement_type)}
                        </span>
                      </td>
                      <td className="align-middle fw-bold">
                        {formatQuantity(record)}
                      </td>
                      <td className="align-middle">{record.stock_anterior || 0}</td>
                      <td className="align-middle">{record.stock_nuevo || 0}</td>
                      <td className="align-middle">{record.username || record.user_id || '-'}</td>
                      <td className="align-middle">
                        <small className="text-muted">{record.observaciones || '-'}</small>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="d-xl-none">
          {filteredRecords.map((record, index) => {
            const itemDetails = getItemDetails(record);
            const movementBadgeClass = getMovementBadgeClass(record.movement_type);

            return (
              <div key={record.id || index} className="card shadow-sm border-0 mb-3">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <span className={`badge ${itemDetails.type === 'material' ? 'bg-primary' : 'bg-success'} mb-2`}>
                        {itemDetails.type === 'material' ? '🧱 Material' : '📋 Producto'}
                      </span>
                      <h6 className="fw-bold mb-0">{itemDetails.name}</h6>
                    </div>
                    <small className="text-muted">{formatDate(record.date)}</small>
                  </div>

                  <div className="mb-3">
                    <span className={`badge ${movementBadgeClass} fs-6`}>
                      {getMovementIcon(record.movement_type)} {getMovementLabel(record.movement_type)}
                    </span>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Cantidad</small>
                      <span className="fw-bold fs-5">{formatQuantity(record)}</span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Stock Anterior</small>
                      <span className="fw-semibold">{record.stock_anterior || 0}</span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Stock Nuevo</small>
                      <span className="fw-semibold text-success">{record.stock_nuevo || 0}</span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block mb-1">Usuario</small>
                      <span className="small">{record.username || record.user_id || '-'}</span>
                    </div>
                  </div>

                  {record.observaciones && (
                    <div className="border-top pt-2">
                      <small className="text-muted d-block mb-1">Observaciones</small>
                      <small>{record.observaciones}</small>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredRecords.length === 0 && !error && !isLoading && (
          <div className="card shadow-sm border-0">
            <div className="card-body text-center py-5">
              <div className="mb-3" style={{ fontSize: '3rem' }}>📊</div>
              <h3 className="h5 fw-semibold mb-2">
                {hasActiveFilters ? 'No se encontraron registros' : 'No hay movimientos registrados'}
              </h3>
              <p className="text-muted mb-0">
                {hasActiveFilters
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Aún no se han realizado movimientos de inventario'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}