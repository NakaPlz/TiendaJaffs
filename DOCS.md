# Documentación Técnica — Jaff's Lomos

## Arquitectura

El proyecto tiene 3 servicios independientes, cada uno con su Dockerfile:

| Servicio | Tecnología | Puerto | Directorio |
|----------|-----------|--------|------------|
| **Backend** | FastAPI + PostgreSQL | 8000 | `/backend` |
| **Admin** | Next.js | 3000 | `/admin` |
| **Frontend** | Next.js | 3000 | `/frontend` |

---

## Deploy (EasyPanel)

**Repositorio:** https://github.com/NakaPlz/TiendaJaffs.git

### URLs de Producción
| Servicio | URL |
|----------|-----|
| Backend API | `https://jaffslomos-backend.l55xrw.easypanel.host` |
| Admin | `https://jaffslomos-admin.l55xrw.easypanel.host` |
| Frontend | `https://jaffslomos-frontend.l55xrw.easypanel.host` |

### Variables de Entorno en Producción
| Servicio | Variable | Tipo |
|----------|----------|------|
| Backend | `DATABASE_URL` | Runtime (env) |
| Admin | `NEXT_PUBLIC_API_URL` | Build time (en Dockerfile) |
| Admin | `ADMIN_SECRET_TOKEN` | Runtime (env) |
| Admin | `EMPLOYEE_SECRET_TOKEN` | Runtime (env) |
| Frontend | `NEXT_PUBLIC_API_URL` | Build time (en Dockerfile) |

> **Nota:** `NEXT_PUBLIC_API_URL` está hardcodeada en los Dockerfiles de admin y frontend porque EasyPanel no tiene soporte claro para Docker build args. Si cambia la URL del backend, hay que actualizar los Dockerfiles y redeploy.

### Volúmenes Persistentes
- **PostgreSQL:** datos de la base (automático de EasyPanel)
- **Backend:** `/app/uploads` (imágenes de productos y categorías)

### Notas de Deploy
- `database.py` convierte automáticamente `postgres://` a `postgresql://` (compatibilidad EasyPanel)
- Ambos Next.js usan `output: "standalone"` en `next.config.ts`
- CORS del backend permite todos los orígenes (`allow_origins=["*"]`)

---

## Checkpoints / Tags

| Tag | Fecha | Descripción |
|-----|-------|-------------|
| `v1.0-deploy` | 2026-03-01 | Primer deploy exitoso. Backend, Admin y Frontend funcionando en EasyPanel. |

Para volver a cualquier checkpoint:
```bash
git checkout v1.0-deploy
```

---

## Desarrollo Local

### Requisitos
- Node.js 20+
- Python 3.11+
- Docker (para PostgreSQL)

### Levantar servicios locales
```bash
# 1. Base de datos
docker-compose up -d

# 2. Backend
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 3. Admin
cd admin
npm install
npm run dev  # Puerto 3001

# 4. Frontend
cd frontend
npm install
npm run dev  # Puerto 3000
```

### Variables de entorno locales
- `admin/.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:8000`, `ADMIN_SECRET_TOKEN`, `EMPLOYEE_SECRET_TOKEN`
- `frontend/.env.local` → `NEXT_PUBLIC_API_URL=http://localhost:8000`
- Backend usa fallback a `localhost:5432` automáticamente si no hay `DATABASE_URL`

---

## MCP Servers Utilizados
- **GitHub MCP Server:** commits, push, gestión de repo
- **Browser:** verificación visual de la UI en desarrollo y producción
