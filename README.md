# Plataforma de Despliegue con Docker

Infraestructura basada en Docker para el alojamiento de aplicaciones web. Incluye un proxy inverso dinámico, gestión automática de certificados SSL (ACME/Let's Encrypt) y un stack de monitorización.

## Tabla de Contenidos
1. [Arquitectura](#arquitectura)
2. [Requisitos de Red](#requisitos-de-red)
3. [Gestión de Usuarios](#gestión-de-usuarios)
4. [Despliegue de Aplicaciones](#despliegue-de-aplicaciones)
5. [Dominios y Certificados SSL](#dominios-y-certificados-ssl)
6. [Monitorización](#monitorización)
7. [Mantenimiento](#mantenimiento)

---

## Arquitectura

La plataforma se organiza en cuatro capas funcionales que se comunican a través de tres redes Docker aisladas.

### Capas funcionales

- **Entrada (Ingress):** `nginx-proxy` actúa como proxy inverso. Escucha en los puertos `80` y `443`, detecta automáticamente los contenedores activos a través del socket de Docker y enruta el tráfico según el nombre de host virtual (`VIRTUAL_HOST`). `letsencrypt-companion` opera junto a él para emitir y renovar certificados SSL de forma automática. Como alternativa, el bloque `cloudflared` permite sustituir este mecanismo cuando los puertos no pueden exponerse directamente a internet.

- **Aplicaciones:** Las aplicaciones de los usuarios se despliegan como servicios Docker conectados a la red `apps-net`. Al declarar `VIRTUAL_HOST` en sus variables de entorno, el proxy las detecta y las publica automáticamente bajo un subdominio propio, sin necesidad de tocar la configuración central.

- **Gestión:** Portainer proporciona una interfaz web para administrar los contenedores del servidor. Se publica a través del mismo proxy inverso.

- **Monitorización:** Prometheus recoge métricas del sistema operativo (`node-exporter`) y del proxy (`nginx-exporter`) cada 30 segundos. Grafana consume esas métricas y las presenta en dashboards accesibles desde el navegador.

### Redes Docker

| Red | Tipo | Propósito |
|---|---|---|
| `proxy-net` | Bridge | Comunicación entre el proxy, los servicios internos y el exterior |
| `apps-net` | Bridge attachable | Red compartida entre el proxy y las aplicaciones de los usuarios |
| `monitoring-net` | Bridge (interno) | Red aislada para el stack de monitorización |

---

## Requisitos de Red

- **Puertos HTTP/HTTPS:** `80` y `443` deben estar abiertos y accesibles desde internet (necesarios para la validación ACME/Let's Encrypt).
- **Puerto SSH:** `22` para administración y transferencia de archivos (SCP).
- El servidor necesita conectividad saliente a internet.

> **Modo alternativo (Cloudflare Tunnel):** Si la red no permite exponer puertos directamente (CGNAT, redes corporativas), es posible usar `cloudflared`. En ese caso `80/443` no necesitan apertura en el router. Ver la sección [Dominios y Certificados SSL](#dominios-y-certificados-ssl).

---

## Gestión de Usuarios

La creación de usuarios se realiza mediante un script que configura el entorno necesario para que el usuario pueda desplegar contenedores.

### Crear un nuevo usuario

```bash
sudo ./create-user.sh <nombre_usuario>
```

El script realiza automáticamente:
1. Creación del usuario con shell `/bin/bash`.
2. Contraseña por defecto: `1234`.
3. Asignación al grupo `docker`.
4. Creación del directorio de trabajo: `/home/<usuario>/apps`.

---

## Despliegue de Aplicaciones

### Flujo de trabajo

1. **Obtener el dominio base.** Pregunta a quien desplegó la infraestructura cuál es el dominio base asignado. Lo necesitarás para configurar tu `.env` y tu `docker-compose.yml`.

2. **Crear el archivo `.env`** en la raíz de tu proyecto con el dominio base:
    ```env
    ALUMNO=tu-nombre
    HOSTNAME=tudominio.com
    ```

3. **Subir el proyecto al servidor** mediante SCP:
    ```bash
    scp -r ./mi-proyecto usuario@ip-servidor:~/apps/
    ```

4. **Preparar el `docker-compose.yml`** de tu aplicación. Debe conectarse a la red `apps-net` (externa) y declarar el subdominio usando la variable `${HOSTNAME}`:
    ```yaml
    services:
      web:
        build: .
        container_name: ${ALUMNO}-app
        restart: unless-stopped
        environment:
          - VIRTUAL_HOST=${ALUMNO}.${HOSTNAME}
          - VIRTUAL_PORT=80
          - LETSENCRYPT_HOST=${ALUMNO}.${HOSTNAME}
          - LETSENCRYPT_EMAIL=tu-email@ejemplo.com
        networks:
          - apps-net

    networks:
      apps-net:
        external: true
    ```

5. **Lanzar la aplicación** desde el servidor:
    ```bash
    docker compose up -d
    ```

Tu aplicación quedará disponible en `https://<tu-nombre>.<dominio-base>`.

---

## Dominios y Certificados SSL

Por defecto, la plataforma usa **ACME / Let's Encrypt** a través de `letsencrypt-companion` para gestionar los certificados SSL automáticamente.

Para que funcione correctamente:
- Los puertos `80` y `443` deben ser accesibles desde internet.
- Cada servicio publicado debe definir `LETSENCRYPT_HOST` y `LETSENCRYPT_EMAIL`.
- El directorio `./certs` debe existir con los permisos adecuados antes del primer arranque:
  ```bash
  mkdir -p certs && chown root:root certs && chmod 750 certs
  ```

### Alternativa: Cloudflare Tunnel

Si los puertos no pueden exponerse directamente, es posible sustituir ACME por un túnel de Cloudflare. Para ello:

1. Comentar el bloque `letsencrypt-companion` en `docker-compose.yml`.
2. Descomentar el bloque `cloudflared` y configurar `CLOUDFLARE_TOKEN` en `.env`.
3. En ese caso, Cloudflare gestiona el SSL en el edge y no es necesario `LETSENCRYPT_HOST` en los servicios.

---

## Monitorización

La plataforma incluye:

- **`node-exporter`**: métricas del sistema operativo (CPU, memoria, disco).
- **`nginx-exporter`**: métricas del proxy inverso (peticiones por segundo, conexiones activas).
- **Grafana**: dashboards accesibles en `https://grafana.<dominio-base>`.

### Gestión de Permisos de Grafana

Grafana requiere que el volumen `./grafana_data` pertenezca al usuario con ID 472. El servicio `fix-grafana-perms` se encarga de ajustar estos permisos automáticamente antes del arranque, sin necesidad de intervención manual.

---

## Mantenimiento

```bash
# Iniciar la infraestructura
docker compose up -d

# Detener los servicios
docker compose stop

# Aplicar cambios en .env o docker-compose.yml
docker compose up -d --force-recreate
```

### Diagnóstico de errores

Si un servicio no es accesible, revisa los logs en este orden:

1. `docker logs nginx-proxy` — mapeo de dominios y configuración del proxy.
2. `docker logs letsencrypt-companion` — emisión y renovación de certificados.
3. `docker stats` — uso de recursos en tiempo real.
