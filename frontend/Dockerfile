# Imagen base de Node.js
FROM node:20-slim

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el código del frontend
COPY . .

# Construir la app de producción
RUN npm run build

# Instalar servidor estático global
RUN npm install -g serve

# Exponer puerto
EXPOSE 5173

# Arrancar servidor estático
CMD ["serve", "-s", "dist", "-l", "5173"]
