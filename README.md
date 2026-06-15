# TradInn

Plataforma de compraventa directa entre personas, sin intermediarios ni comisiones.

## Reporte

El reporte es de 5 páginas. El resto es un apéndice que se puede omitir.

## Requisitos

- [Docker](https://www.docker.com/) y Docker Compose

## Levantar el proyecto

1. Clona el repositorio y entra a la carpeta:
   ```bash
   git clone git@github.com:karlahlima/Proyecto-3-MyP.git
   cd Proyecto-3-MyP
   ```

2. Levanta todos los servicios:
   ```bash
   docker compose up --build
   ```

4. Abre [http://localhost:3001](http://localhost:3001) en tu navegador.

> La base de datos se inicializa automáticamente con el esquema SQL al primer arranque.

## Estructura

- backend/ — API REST (Node.js + Express)
- frontend/ — SPA (React + Vite)
- nginx/ — Configuración del reverse proxy
- docs/ — Documentación
- docker-compose.yml — Orquestación de contenedores
- .env — Variables de entorno

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19, React Router 7, Vite |
| Backend | Node.js, Express 4 |
| Base de datos | PostgreSQL |
| Auth | JWT + bcryptjs |
| Validación | Zod |
| Infraestructura | Docker, Nginx |

## Funcionalidades principales

- Registro e inicio de sesión con JWT
- Exploración y filtrado de publicaciones por categoría
- Crear, editar y eliminar publicaciones propias
- Carrito de compras con checkout transaccional
- Historial de compras y de publicaciones
- Comentarios y calificaciones en productos

## Licencia

Consulta el archivo [LICENSE](LICENSE).
