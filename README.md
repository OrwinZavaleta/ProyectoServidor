# Plataforma de Despliegue Automatizada (Zero Configuration)

Este proyecto implementa una infraestructura basada en Docker para el alojamiento de aplicaciones web con despliegue automatizado. La solución utiliza un proxy inverso dinámico, un túnel seguro de Cloudflare para saltar restricciones de red (como CGNAT) y un stack completo de monitorización para asegurar la visibilidad de los servicios.

## 📋 Tabla de Contenidos
1. [Requisitos de Red](#requisitos-de-red)
2. [Gestión de Usuarios (Automatizada)](#gestión-de-usuarios-automatizada)
3. [Despliegue de Aplicaciones](#despliegue-de-aplicaciones)
4. [Dominios y Certificados SSL](#dominios-y-certificados-ssl)
5. [Monitorización de Métricas](#verificación-de-monitorización)
6. [Mantenimiento Básico](#mantenimiento-básico)

---

## 🌐 Requisitos de Red

Para el correcto funcionamiento de la plataforma en entornos restringidos (redes móviles o redes corporativas), se han definido los siguientes requisitos:

*   **Conectividad Saliente:** El servidor requiere acceso a internet para establecer la conexión con el túnel de Cloudflare.
*   **Puertos de Entrada HTTP/HTTPS:**
    *   **Modo Cloudflare Tunnel:** `80/443` no requieren apertura en el router.
    *   **Modo ACME/Let's Encrypt:** `80/443` deben estar publicados en el host y abiertos en el router/firewall.
    *   `22`: Puerto SSH para administración y subida de archivos (SCP).
*   **Arquitectura de Túnel:** La comunicación se realiza mediante un túnel cifrado de salida, eliminando la necesidad de IP pública dedicada o Port Forwarding.

---

## 👥 Gestión de Usuarios (Automatizada)

La creación de cuentas para alumnos o despliegues secundarios se realiza mediante un script de automatización que garantiza que el entorno tenga los permisos y la estructura de carpetas necesaria.

### Crear un nuevo usuario
Para dar de alta a un alumno, ejecuta el script proporcionado con privilegios de root:

```bash
sudo ./setup_deploy_user_easy.sh <nombre_usuario>
```

**Este script realiza automáticamente:**
1.  Creación del usuario con shell `/bin/bash`.
2.  Configuración de la contraseña por defecto: `1234`.
3.  Asignación al grupo `docker` para permitir la gestión de contenedores sin sudo.
4.  Creación del directorio de trabajo: `/home/<usuario>/apps`.

---

## 🚀 Despliegue de Aplicaciones

El despliegue está optimizado para ser un proceso de "Subir y Arrancar" (Copy & Up).

### Flujo de trabajo para el alumno:
1.  **Subir archivos:** Utilizar SCP para mover el proyecto a la carpeta de aplicaciones.
    ```bash
    scp -r ./mi-proyecto usuario@ip-servidor:~/apps/
    ```
2.  **Preparar el Docker Compose:** El archivo debe conectarse a la red `apps-net` (externa) y definir su dominio y su puerto si no se usa el por defecto.
    ```yaml
    services:
      web:
        build: .
        container_name: ${ALUMNO}-app
        restart: unless-stopped
        environment:
          - VIRTUAL_HOST=${ALUMNO}.orwinzavaleta.dpdns.org
          - VIRTUAL_PORT=80
        networks:
          - apps-net

    networks:
      apps-net:
        external: true
    ```
3.  **Lanzar:** Acceder por SSH y ejecutar `docker compose up -d`.

### Ejemplo corregido: Laravel 12 + FrankenPHP + PostgreSQL

Si usas `serversideup/php:8.4-frankenphp` con PostgreSQL, revisa estos puntos para evitar fallos al desplegar:

1. `command: &gt;` es inválido en YAML (eso viene de codificación HTML). Debe ser `command: >`.
2. `depends_on` por sí solo **no** espera a que PostgreSQL esté listo; añade `healthcheck` en `db` y `condition: service_healthy` en `app`.
3. Si `HOSTNAME` no está definido, `VIRTUAL_HOST=app.${HOSTNAME}` queda mal formado.
4. No declares volúmenes no usados (`caddy_data`, `caddy_config`) si ese stack no usa Caddy.
5. Si una red es `external: true`, debe existir antes (`docker network create apps-net` / `proxy-net`).

Referencia mínima (fragmento):

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=laravel_db
      - POSTGRES_USER=laravel_user
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    command: >
      postgres
      -c shared_buffers=24MB
      -c max_connections=10
      -c work_mem=2MB
      -c maintenance_work_mem=8MB
      -c autovacuum=off
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: serversideup/php:8.4-frankenphp
    depends_on:
      db:
        condition: service_healthy
    environment:
      - APP_URL=http://app.${HOSTNAME}
      - DB_CONNECTION=pgsql
      - DB_HOST=db
      - DB_PORT=5432
```

Define `POSTGRES_PASSWORD` en tu `.env`, mantenlo fuera de control de versiones (incluye `.env` en `.gitignore`) y usa `$$` en `healthcheck` para escapar variables de entorno dentro de `docker compose`.

---

## 🔒 Dominios y Certificados SSL

La gestión de seguridad se ha centralizado en **Cloudflare Zero Trust** para evitar colisiones de certificados locales.

*   **SSL:** Cloudflare gestiona el cifrado de extremo a extremo. El túnel establece una conexión gRPC segura hacia el Edge de Cloudflare.
*   **Wildcard DNS:** Se ha configurado un registro comodín (`*`) que apunta al túnel. Esto permite que cualquier subdominio nuevo definido en un `VIRTUAL_HOST` sea accesible instantáneamente sin intervención del administrador.

### Cambio a ACME / Let's Encrypt (sin Cloudflare Tunnel)

Si quieres usar certificados con `letsencrypt-companion`, no basta solo con comentar `cloudflared` y descomentar `letsencrypt-companion`: también necesitas:

1. Publicar y abrir puertos `80/443` (ya definidos en `nginx-proxy`).
2. Definir `ACME_EMAIL` en `.env`.
3. Configurar `LETSENCRYPT_HOST` y `LETSENCRYPT_EMAIL` en cada servicio publicado.
4. Activar la sección `letsencrypt-companion` (está en el mismo `docker-compose.yml` como bloque comentado "LEGACY").
5. Crear `./certs` con permisos restringidos y propiedad compatible con Docker antes del primer arranque (ejemplo: `mkdir -p certs && chown root:root certs && chmod 750 certs`). Si cambias usuario/grupo de ejecución de contenedores, ajusta el `chown` para que `letsencrypt-companion` pueda escribir y `nginx-proxy` pueda leer.

---

## 📉 Verificación de Monitorización

Para demostrar el cumplimiento de los requisitos, se han implementado dos canales de métricas:

1.  **Métricas de Host:** El servicio `node-exporter` mapea el sistema de archivos del host en modo solo lectura, permitiendo visualizar la carga real del hardware en el dashboard "Node Exporter Full".
2.  **Métricas de Proxy (Tráfico HTTP):** El servicio `nginx-exporter` se conecta al socket de estatus de Nginx. Proporciona datos verificables sobre:
    *   Número de peticiones HTTP por segundo.
    *   Conexiones activas y en espera.
    *   Estado de salud del proxy inverso.

Todos estos datos son consultables de forma agregada en Grafana (`https://grafana.orwinzavaleta.dpdns.org`).

### 🔧 Gestión Automática de Permisos (Self-Healing)
El servicio de Grafana requiere permisos específicos de usuario (ID 472) para escribir en su base de datos SQLite. Para mantener la filosofía "Zero Configuration" y evitar comandos manuales (`chown`) en el host:

1.  Se ha implementado un contenedor efímero `fix-grafana-perms` (basado en Alpine Linux).
2.  Este servicio se ejecuta previo al arranque de Grafana, ajustando los permisos del volumen `./grafana_data` automáticamente.
3.  Esto garantiza que el despliegue funcione en cualquier máquina host independientemente de su configuración de usuarios nativa.

---

## 🛠️ Mantenimiento Básico

### Comandos de Administración
```bash
# Iniciar toda la infraestructura
docker compose up -d

# Detener servicios sin borrar contenedores
docker compose stop

# Reinicio tras cambios en el archivo .env o YAML
docker compose up -d --force-recreate
```

### Gestión de Errores
Si un servicio no es accesible tras el despliegue, verificar los logs en orden:
1.  `docker logs cloudflared` (Estado del túnel).
2.  `docker logs nginx-proxy` (Mapeo de dominios).
3.  `docker stats` (Uso de recursos en tiempo real).
