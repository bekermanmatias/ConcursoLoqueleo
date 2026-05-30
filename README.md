# Concurso Soy Loqueleo 2026

Monorepo alineado con la arquitectura AWS de Santillana: **ECS + ECR** (backend), **RDS PostgreSQL** (datos), **S3 + CloudFront** (frontend y entregables).

## Estructura

```
├── frontend/          # Astro → S3 + CloudFront en producción
├── backend/           # Express → imagen Docker en ECR / ECS
├── deploy/            # Task Definition ECS, CORS S3, guía Bamboo
├── scripts/           # Push ECR y deploy frontend S3
├── docker-compose.yml           # Dev local (Postgres + API + nginx)
└── docker-compose.s3-local.yml  # Override con MinIO (simula S3)
```

## Arquitectura objetivo (TI Santillana)

| Capa | AWS | Este repo |
|------|-----|-----------|
| Frontend web | S3 + CloudFront | `frontend/dist/` → `scripts/deploy-frontend-s3.ps1` |
| Entregables (PDF/video) | S3 dedicado + CORS | API presigned URL → `deploy/s3-upload-bucket-cors.json` |
| Backend Node.js | ECS Fargate + ECR | `backend/Dockerfile` → `scripts/push-backend-ecr.ps1` |
| Base de datos | RDS PostgreSQL 14+ | Solo URL en ECS; migraciones al arrancar |
| CI/CD | Bamboo + Nexus | Ver `deploy/BAMBOO.md` |
| Dominio | concursope.loqueleo.com | `APP_DOMAIN`, `CORS_ORIGIN` |

Capacidad: ~10.000 inscripciones. Límites de archivo según TI: **PDF 10 MB**, **video 250 MB**.

## Pruebas en local con Docker (inicio rápido)

**Requisitos:** Docker Desktop instalado y en ejecución.

### 1. Levantar todo

Desde la raíz del repo:

```bash
cp .env.example .env
docker compose up --build
```

La primera vez tarda unos minutos (descarga imágenes y construye frontend + backend).

Para dejarlo en segundo plano:

```bash
docker compose up --build -d
```

### 2. Acceder

| Qué | URL |
|-----|-----|
| **Sitio web** | http://localhost **o** http://localhost:8080 |
| **Inicio del concurso** | http://localhost/ |
| **Ejemplo libro** | http://localhost/libro/tusuj-6/ |
| **Consultar participación (Ayuda)** | http://localhost/ayuda/consultar/ |
| **API (health)** | http://localhost:3000/api/health |
| **API vía nginx** | http://localhost/api/health |

### 3. Probar el flujo

1. Entra a un libro, por ejemplo: http://localhost:8080/libro/tusuj-6/
2. Pulsa participar y completa el formulario (5 pasos).
3. En Ayuda, busca un DNI de demo (tabla más abajo).

### 4. Comandos útiles

```bash
# Ver logs en vivo
docker compose logs -f

# Detener
docker compose down

# Resetear base de datos (tras cambio de esquema)
docker compose down -v
docker compose up --build
```

### 5. Desarrollo del frontend en el IDE (error tsconfig)

Si VS Code marca error en `frontend/tsconfig.json` (`astro/tsconfigs/strict`), instala dependencias **dentro de `frontend/`**:

```bash
cd frontend
npm install
```

El editor necesita `frontend/node_modules` para resolver la config de Astro. Docker no instala eso en tu máquina; solo dentro del contenedor.

### 6. Desarrollo sin reconstruir Docker (hot reload)

Terminal 1 — solo Postgres:

```bash
docker compose up db -d
```

Terminal 2 — backend:

```bash
cd backend
npm install
npm run dev
```

Terminal 3 — frontend:

```bash
cd frontend
npm install
npm run dev
```

Sitio con recarga: http://localhost:4321 (proxy `/api` → backend en `:3000`).

## Base de datos (esquema oficial)

El modelo relacional incluye: `usuarios_internos`, `ubicaciones`, `colegios`, `grados`, `retos`, `participantes`, `trabajos`, `evaluaciones`.

Al arrancar el backend se ejecutan `backend/db/init.sql` y `backend/db/seed.sql`.

**Si cambias el esquema y ya tenías datos viejos**, recrea el volumen de Postgres:

```bash
docker compose down -v
docker compose up --build
```

## Desarrollo local (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Sitio: http://localhost:8080  
- API: http://localhost:3000/api/health  
- `STORAGE_MODE=local`: no sube archivos a S3; guarda metadatos en Postgres.

### Probar flujo S3 antes de AWS (MinIO)

```bash
docker compose -f docker-compose.yml -f docker-compose.s3-local.yml up --build
```

Consola MinIO: http://localhost:9001 (minio / minio123456)

## Desarrollo sin Docker

```bash
docker compose up db -d
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

## Despliegue AWS

### 1. Backend → ECR / ECS

```powershell
.\scripts\push-backend-ecr.ps1 -AccountId 123456789 -Region us-east-1
```

Plantilla Task Definition: `deploy/ecs-task-definition.example.json`  
Health check ECS: `GET /api/health`

### 2. Frontend → S3 / CloudFront

```powershell
.\scripts\deploy-frontend-s3.ps1 -Bucket loqueleo-web-prod -DistributionId EXXXXX
```

Si CloudFront enruta `/api/*` al ALB del backend, deja `PUBLIC_API_URL` vacío.

### 3. Bucket de entregables

Aplicar CORS desde `deploy/s3-upload-bucket-cors.json`.  
La BD guarda `file_url` / `s3_key`, no binarios.

## Variables de entorno clave

| Variable | Dev local | Producción AWS |
|----------|-----------|----------------|
| `DATABASE_URL` | Postgres local / compose | Endpoint RDS (privado) |
| `CORS_ORIGIN` | `http://localhost:8080` | `https://concursope.loqueleo.com` |
| `STORAGE_MODE` | `local` | `s3` |
| `S3_UPLOAD_BUCKET` | — | Bucket entregables |
| `S3_PUBLIC_URL_BASE` | — | CloudFront del bucket entregables |

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check (ECS / ALB) |
| POST | `/api/uploads/presign` | URL firmada para subida directa a S3 |
| GET | `/api/participations/:dni/blocked` | ¿DNI ya registrado? |
| GET | `/api/participations/:dni` | Consultar participación |
| POST | `/api/participations` | Registrar participación |
| PATCH | `/api/participations/:dni/file` | Resubir archivo corregido |

## DNIs de prueba

| DNI | Estado |
|-----|--------|
| 12345678 | Finalista |
| 87654321 | En revisión |
| 11223344 | Recibido |

Prueba en `/ayuda/consultar`.
