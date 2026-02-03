FROM nginx:alpine

# Copiamos todos los archivos de nuestra carpeta actual al directorio de Nginx
# Si usas un framework (React/Vue), aquí deberías copiar la carpeta /dist o /build
COPY . /usr/share/nginx/html

# Opcional: Si tu app es una SPA (Single Page App) con rutas internas,
# descomenta la siguiente línea para evitar errores 404 al recargar:
# COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN chmod -R 755 /usr/share/nginx/html
EXPOSE 80
