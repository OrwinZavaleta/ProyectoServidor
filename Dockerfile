# --- Imagen base: nginx:alpine es la opción más ligera para servir archivos estáticos ---
FROM nginx:alpine

# Copiar los archivos estáticos de la aplicación web al directorio público de Nginx
COPY aplicacion-prueba/index.html /usr/share/nginx/html/
COPY aplicacion-prueba/detalles.html /usr/share/nginx/html/
COPY aplicacion-prueba/planSemanal.html /usr/share/nginx/html/
COPY aplicacion-prueba/css /usr/share/nginx/html/css
COPY aplicacion-prueba/dist /usr/share/nginx/html/dist

# Permisos: 755 para directorios, 644 para archivos (principio de mínimo privilegio)
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} \; \
    && find /usr/share/nginx/html -type f -exec chmod 644 {} \;

EXPOSE 80
