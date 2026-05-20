&#x20;Guía de Despliegue - MeleeMods

&#x20;Requisitos previos



\### Software necesario

\- \*\*Docker Desktop\*\* (última versión)

&#x20; - Windows: https://www.docker.com/products/docker-desktop/

&#x20;

\- \*\*Git\*\* (opcional, para clonar)

&#x20; - https://git-scm.com/downloads



\### Verificar instalación

```bash

docker --version

docker compose versión



1. Clonar el repositorio

git clone https://github.com/bluecat234/meleeMods.git

cd meleeMods/melee-mods-final



2\. Verificar estructura de archivos

dir

\# Debe mostrar: app.js, package.json, schema.sql, Dockerfile, docker-compose.yml



3\. Configurar el archivo schema.sql

rmdir schema.sql  # Si es una carpeta

notepad schema.sql



4\. Configurar variables de entorno (opcional)

MAIL\_USER: modsmelee@gmail.com

MAIL\_PASS: zwge actw xwya qkxt

MAIL\_FROM: "Melee Mods <modsmelee@gmail.com>"

ports:

&#x20; - "3307:3306"  # Cambiar si el 3306 está en uso

&#x20; - "3000:3000"  # Cambiar si el 3000 está en uso



5\. Ejecutar el despliegue

docker compose down -v   # Limpiar contenedores anteriores

docker compose up --build

