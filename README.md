# Plataforma de Despliegue Automatizada (Zero Configuration)

Este proyecto implementa una infraestructura basada en Docker para el alojamiento de aplicaciones web con despliegue automatizado. La solución utiliza un proxy inverso dinámico, un túnel seguro para saltar restricciones de red (como CGNAT) y un stack completo de monitorización para asegurar la disponibilidad de los servicios.

## 📋 Tabla de Contenidos
1. [Requisitos de Red](#requisitos-de-red)
2. [Gestión de Usuarios](#gestión-de-usuarios)
3. [Despliegue de Aplicaciones](#despliegue-de-aplicaciones)
4. [Dominios y Certificados SSL](#dominios-y-certificados-ssl)
5. [Monitorización de Métricas](#monitorización-de-métricas)
6. [Mantenimiento Básico](#mantenimiento-básico)

---

## 🌐 Requisitos de Red

Para el correcto funcionamiento de la plataforma en entornos restringidos (como redes móviles o redes detrás de cortafuegos estrictos), se han definido los siguientes requisitos:

*   **Conectividad Saliente:** El servidor requiere acceso a internet para establecer la conexión con el túnel de Cloudflare.
*   **Puertos Internos (Docker):**
    *   `80/443`: Gestionados internamente por `nginx-proxy`.
    *   `22`: Para acceso administrativo vía SSH.
    *   `9000`: Interfaz de Portainer.
    *   `3000`: Panel de Grafana.
*   **Arquitectura de Túnel:** No es necesaria la apertura de puertos en el router (Port Forwarding) ni disponer de una IP pública dedicada, ya que la comunicación se realiza mediante un túnel cifrado de salida.

---

## 👥 Gestión de Usuarios

Para garantizar la seguridad y la trazabilidad, se recomienda el uso de usuarios con permisos limitados para el despliegue de aplicaciones.

### Crear un nuevo usuario de sistema
```bash
sudo adduser nombre_usuario
```

### Configuración de acceso SSH
Para permitir que el usuario pueda subir archivos mediante SCP y gestionar sus propios contenedores, debe pertenecer al grupo `docker`:
```bash
sudo usermod -aG docker nombre_usuario
```

---

## 🚀 Despliegue de Aplicaciones

La plataforma está diseñada para que el despliegue sea "Zero Configuration". El usuario solo debe cumplir con el "Contrato de Infraestructura" en su archivo `docker-compose.yml`.

### Pasos mínimos para desplegar:
1.  Subir los archivos del proyecto al servidor mediante `scp`.
2.  Definir el servicio en un archivo `docker-compose.yml` asegurando que:
    *   Esté conectado a la red externa `apps-net`.
    *   Defina la variable `VIRTUAL_HOST` con el subdominio deseado.
    *   Defina el `VIRTUAL_PORT` si la app no escucha en el puerto 80.

**Ejemplo de configuración para el alumno:**
```yaml
services:
  web:
    image: nginx:alpine
    environment:
      - VIRTUAL_HOST=mi-app.orwinzavaleta.dpdns.org
    networks:
      - apps-net

networks:
  apps-net:
    external: true
```

---

## 🔒 Dominios y Certificados SSL

La gestión de dominios y cifrado se ha centralizado en **Cloudflare Zero Trust** para evitar la complejidad y los fallos comunes de Let's Encrypt en redes privadas.

*   **Certificados:** Se gestionan automáticamente en el "Edge" de Cloudflare. El tráfico viaja cifrado hasta la red de Cloudflare y de ahí al servidor mediante el túnel (`cloudflared`).
*   **Añadir un dominio:**
    1.  Configurar un **Public Hostname** en el panel de Cloudflare Tunnels apuntando a `http://nginx-proxy:80`.
    2.  Utilizar un registro **Wildcard** (`*`) para permitir que cualquier subdominio nuevo sea reconocido por el proxy sin intervención manual.

---

## 📊 Monitorización de Métricas

La plataforma incluye un stack de visibilidad en tiempo real:

*   **Prometheus:** Recolecta métricas del sistema y de los contenedores cada 30 segundos (intervalo optimizado para ahorro de CPU).
*   **Grafana:** Visualización de datos.
    *   **URL:** `https://grafana.orwinzavaleta.dpdns.org`
    *   **Acceso:** Usuario `admin` / Password configurada en `.env`.
*   **Node Exporter:** Proporciona métricas de hardware (CPU, RAM, Disco) del host Linux.

---

## 🛠️ Mantenimiento Básico

Comandos esenciales para la administración de la plataforma:

### Arrancar y parar la plataforma
```bash
# Iniciar todos los servicios en segundo plano
docker compose up -d

# Detener todos los servicios
docker compose stop

# Detener y eliminar contenedores y redes
docker compose down
```

### Actualización de servicios
Para actualizar la infraestructura a la última versión de las imágenes:
```bash
docker compose pull
docker compose up -d --build
```

### Verificación de logs
En caso de fallo en algún servicio, consultar los logs es el primer paso:
```bash
docker logs -f cloudflared    # Para problemas de conexión externa
docker logs -f nginx-proxy    # Para problemas de enrutamiento de dominios
```
