# 📦 PyGlass Stock  

Sistema de gestión de inventario y compras para una vidriería, desarrollado como parte del curso **Procesos de Software - GRUPO 03** en la **UNMSM – FISI**.  

---

## 📌 Descripción  
El sistema PyGlass Stock permite controlar de manera eficiente las operaciones de una vidriería, asegurando consistencia en inventario y trazabilidad en las compras.  

### Entidades principales  
- **Proveedores**: encargados de abastecer materiales.  
- **Productos**: artículos terminados en inventario.  
- **Materiales**: materias primas utilizadas en producción o venta.  
- **Usuarios**: responsables de registrar operaciones.  
- **Órdenes de compra**: registros de adquisiciones.  
- **Kardex**: historial de movimientos de inventario.  

### Relaciones clave  
- Un proveedor abastece muchos materiales.  
- Un usuario puede registrar varias órdenes de compra.  
- Una orden de compra está asociada a un material, proveedor y usuario.  
- Kardex vincula movimientos de materiales con órdenes de compra.  
- Productos y materiales mantienen control de stock independiente.  

---

## 🏛️ Decisiones de diseño – Arquitectura  
Se implementa una **arquitectura en 3 capas** (Presentación – Lógica de Negocio – Datos):  
- **Frontend (Presentación)**: React, interfaz gráfica de usuario.  
- **Backend (Negocio)**: Python + FastAPI, lógica de inventario y reglas de negocio.  
- **Base de Datos (Datos)**: MySQL (Clever Cloud) con SQLAlchemy como ORM.  

**Justificación**:  
- Mantiene separación de responsabilidades.  
- Escalable y flexible ante cambios tecnológicos.  
- Facilita pruebas y despliegue modular.  
- Sigue el patrón MVC, coherente con la teoría del curso.  

---

## ⚙️ Lenguaje y Frameworks  
- **Lenguaje principal**: Python  
- **Backend**: FastAPI  
- **Frontend**: React + TailwindCSS  
- **Base de datos**: MySQL (Clever Cloud)  
- **ORM**: SQLAlchemy  

---

## 🧾 Justificación  

### 📚 Curva de aprendizaje  
- Python: sintaxis clara y sencilla.  
- FastAPI: rápido, intuitivo y con validación automática.  
- React: librería popular, fácil de aprender con gran cantidad de recursos.  

### 🌍 Comunidad  
- Python y React tienen comunidades globales muy activas.  
- FastAPI crece rápidamente y ya es usado en proyectos empresariales.  

### 🔗 Compatibilidad con requisitos  
- FastAPI + SQLAlchemy se integra fácilmente con MySQL para inventario y kardex.  
- React permite interfaces dinámicas, necesarias para registros y consultas.  
- Comunicación modular vía **APIs REST**.  

### 🧪 Facilidad de pruebas  
- FastAPI soporta **Pytest** y validación de datos.  
- React cuenta con **React Testing Library** para pruebas de UI.  

### 🚀 Facilidad de despliegue  
- Stack compatible con Render, Clever Cloud y Docker.  
- CI/CD posible con GitHub Actions.  
