# Pipeline Bamboo — referencia para TI Santillana

Este documento describe cómo encaja el repositorio con el esquema acordado (Bamboo → ECR/ECS + S3/CloudFront).

## Artefactos que genera el repo

| Componente | Destino AWS | Comando / script |
|------------|-------------|------------------|
| **Backend** | Amazon ECR → ECS Fargate | `scripts/push-backend-ecr.ps1` |
| **Frontend** | S3 + CloudFront | `scripts/deploy-frontend-s3.ps1` |
| **Base de datos** | Amazon RDS PostgreSQL 14+ | Migraciones al arrancar el backend (`db/init.sql` + `db/migrations/`) |

## Plan Bamboo sugerido (backend)

1. **Checkout** del repositorio.
2. **Build** imagen Docker desde `backend/Dockerfile`.
3. **Test** (opcional): `npm ci && npm run build` dentro de `backend/`.
4. **Push** a ECR con tag `$bamboo.buildNumber` y `latest`.
5. **Deploy**: actualizar Task Definition ECS (`deploy/ecs-task-definition.example.json`) y forzar nuevo despliegue del servicio (rolling, sin downtime).

Variables Bamboo requeridas:

- `AWS_ACCOUNT_ID`, `AWS_REGION`
- `ECR_REPOSITORY=loqueleo-api`
- `ECS_CLUSTER`, `ECS_SERVICE`, `ECS_TASK_DEFINITION`

## Plan Bamboo sugerido (frontend)

1. **Checkout**.
2. **Build** estático: `cd frontend && npm ci && npm run build`.
3. **Sync** `frontend/dist/` al bucket S3 del sitio web.
4. **Invalidación** CloudFront (`/*` o rutas críticas).

Variables:

- `S3_FRONTEND_BUCKET=loqueleo-web-prod`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `PUBLIC_API_URL=` (vacío si CloudFront enruta `/api/*` al ALB del backend)

## Nexus

Subir como artefactos versionados:

- Imagen Docker (referencia ECR) o tarball si el flujo global lo exige.
- Carpeta `frontend/dist/` comprimida para auditoría de releases.

## Checklist previo al primer deploy en AWS

- [ ] RDS PostgreSQL en subred privada (solo acceso desde ECS).
- [ ] Bucket S3 web + distribución CloudFront para el frontend.
- [ ] Bucket S3 entregables con CORS (`deploy/s3-upload-bucket-cors.json`).
- [ ] IAM Task Role del backend con permisos `s3:PutObject`, `s3:GetObject` en bucket de entregables.
- [ ] DNS `concursope.loqueleo.com` apuntando a CloudFront.
- [ ] Secret `DATABASE_URL` en Secrets Manager o variables seguras de Bamboo.
- [ ] `CORS_ORIGIN=https://concursope.loqueleo.com` en la task ECS.
