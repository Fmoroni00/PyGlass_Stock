Perfecto 🙌 Te lo dejo mejorado, con más estructura y estilo tipo **README profesional de GitHub**, manteniendo lo que ya tienes pero más claro, con secciones útiles para cualquier persona que abra tu repo:

---

# 📦 PyGlass Stock

Sistema de **gestión de inventario y compras** para una vidriería, desarrollado como parte del curso **Procesos de Software – GRUPO 03 (UNMSM – FISI)**.

---

## ✨ Características principales

* 📊 **Control de inventario** de materiales y productos.
* 🛒 **Gestión de órdenes de compra** y proveedores.
* 👤 **Módulo de usuarios** con autenticación.
* 📑 **Kardex automatizado** para trazabilidad de movimientos.
* 🌐 **Arquitectura web fullstack** con frontend y backend desacoplados.

---

## 🏗️ Arquitectura del sistema

El proyecto sigue una **arquitectura en 3 capas**:

* **Frontend (Presentación)**: React → interfaz de usuario moderna y responsiva.
* **Backend (Negocio)**: FastAPI (Python) → gestiona lógica de inventario, reglas y validaciones.
* **Base de datos (Datos)**: MySQL (Clever Cloud / Docker) → persistencia con SQLAlchemy ORM.

🔹 **Ventajas**: separación de responsabilidades, escalabilidad, modularidad, fácil despliegue y pruebas.

---

## 📂 Entidades y relaciones principales

* **Proveedores** → abastecen múltiples materiales.
* **Materiales** → insumos base con control de stock.
* **Productos** → artículos terminados independientes de materiales.
* **Usuarios** → responsables de registrar operaciones.
* **Órdenes de compra** → vinculadas a usuario, proveedor y materiales.
* **Kardex** → registra entradas y salidas de inventario.

---

## ⚙️ Tecnologías utilizadas

* **Lenguaje**: Python 3.11+
* **Backend**: FastAPI
* **Frontend**: React + TailwindCSS
* **Base de datos**: MySQL
* **ORM**: SQLAlchemy
* **Herramientas**: Docker + Docker Compose
* **Despliegue**: Render (Backend), Clever Cloud (DB), Render (Frontend)

---

## 📚 Justificación tecnológica

### Curva de aprendizaje 📘

* **Python + FastAPI** → sintaxis clara, validación automática, API REST rápida.
* **React** → librería popular, gran documentación y ecosistema de UI.

### Comunidad 🌍

* Python y React tienen comunidades globales y activas.
* FastAPI crece rápidamente y es adoptado en proyectos empresariales.

### Compatibilidad 🔗

* SQLAlchemy se integra de forma nativa con MySQL.
* React permite interfaces dinámicas y modulares.
* Comunicación a través de **APIs REST JSON**.

### Facilidad de pruebas 🧪

* FastAPI soporta **Pytest** + validación de esquemas.
* React con **React Testing Library** y Jest para UI.

### Despliegue 🚀

* Infraestructura **cloud-friendly**: Render, Clever Cloud y Docker.
* Compatible con CI/CD en GitHub Actions.

---

## 🐳 Despliegue con Docker

El proyecto incluye **docker-compose.yml** para levantar el sistema completo:

```bash
git clone https://github.com/usuario/pyglass_stock.git
cd pyglass_stock
docker compose up -d
```

Esto levanta:

* `pyglass-frontend` → React (puerto 5173)
* `pyglass-backend` → FastAPI (puerto 8000)
* `pyglass-db` → MySQL (puerto 3307)

✅ Portátil y reproducible en cualquier entorno con Docker.

---

## 📖 Uso

* Accede al **frontend** en: `http://localhost:5173`
* Accede al **backend** (API docs Swagger): `http://localhost:8000/docs`

---

## 👨‍💻 Autores

📌 Proyecto desarrollado por **Grupo 03 – Procesos de Software (UNMSM – FISI)**.

---

