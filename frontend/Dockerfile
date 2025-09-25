# Imagen base de Node.js
FROM node:20

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

# Instalar un servidor estático (serve)
RUN npm install -g serve

# Exponer puerto
EXPOSE 5173

# Comando para arrancar frontend
CMD ["serve", "-s", "dist", "-l", "5173"]
