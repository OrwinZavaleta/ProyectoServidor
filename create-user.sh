#!/bin/bash

# ==============================================================================
# SCRIPT: setup_deploy_user_easy.sh
# DESCRIPCIÓN: Configura un usuario para despliegues con Docker usando contraseña.
# USO: sudo ./setup_deploy_user_easy.sh <nombre_usuario>
# ==============================================================================

set -e

# Colores
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. Verificación de privilegios
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}Error: Este script debe ejecutarse con privilegios de root (sudo).${NC}"
   exit 1
fi

# 2. Validación de argumentos
USERNAME=$1
PASSWORD="1234"

if [ -z "$USERNAME" ]; then
    echo -e "${RED}Error: Falta el nombre de usuario.${NC}"
    echo -e "${YELLOW}Uso:${NC} sudo $0 <nombre_usuario>"
    exit 1
fi

echo -e "${CYAN}>>> Iniciando configuración para el usuario: ${USERNAME}${NC}"

# 3. Crear el usuario si no existe
if id "$USERNAME" &>/dev/null; then
    echo -e "${YELLOW}[!] El usuario $USERNAME ya existe.${NC}"
else
    # Creamos el usuario con su home y shell bash
    useradd -m -s /bin/bash "$USERNAME"
    echo -e "${GREEN}[+] Usuario $USERNAME creado correctamente.${NC}"
fi

# 4. Configurar contraseña por defecto (1234)
echo -e "${CYAN}>>> Configurando contraseña...${NC}"
echo "$USERNAME:$PASSWORD" | chpasswd
echo -e "${GREEN}[+] Contraseña establecida como: $PASSWORD${NC}"

# 5. Permisos de Docker
echo -e "${CYAN}>>> Configurando permisos de Docker...${NC}"
if getent group docker > /dev/null; then
    usermod -aG docker "$USERNAME"
    echo -e "${GREEN}[+] Usuario añadido al grupo 'docker'.${NC}"
else
    echo -e "${RED}[!] Error: El grupo 'docker' no existe. ¿Está Docker instalado?${NC}"
fi

# 6. Estructura de directorios para aplicaciones
USER_HOME="/home/$USERNAME"
APPS_DIR="$USER_HOME/apps"
echo -e "${CYAN}>>> Creando estructura de directorios...${NC}"
mkdir -p "$APPS_DIR"
chown "$USERNAME":"$USERNAME" "$APPS_DIR"
chmod 755 "$APPS_DIR"
echo -e "${GREEN}[+] Directorio de despliegue creado en: $APPS_DIR${NC}"

# 7. Mensaje final
echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}        CONFIGURACIÓN COMPLETADA (MODO FÁCIL)${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "  - ${YELLOW}Usuario:${NC}    $USERNAME"
echo -e "  - ${YELLOW}Contraseña:${NC} $PASSWORD"
echo -e "  - ${YELLOW}Apps Dir:${NC}   $APPS_DIR"
echo -e "----------------------------------------------------------------"
echo -e "${CYAN} Pasos siguientes:${NC}"
echo -e "  1. Cambia al usuario: ${YELLOW}su - $USERNAME${NC}"
echo -e "  2. O vía SSH: ${YELLOW}ssh $USERNAME@localhost${NC}"
echo -e "  3. La contraseña es ${YELLOW}1234${NC}"
echo -e "${GREEN}================================================================${NC}\n"
