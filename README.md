# [LegisCheck](https://paralelo.up.railway.app/)

LegisCheck es una plataforma  con fines **comerciales** para la comparación inteligente de documentos legislativos.  
Permite a congresos, firmas jurídicas y organizaciones de análisis normativo detectar, rastrear y entender los cambios entre versiones de un texto de forma rápida, visual y asistida por IA. Ademas de tener su historial centralizado, la capacidad de tener un seguimiento con linea de tiempo mediante hitos, sin olvidar la capacidad de descargar informes (con opciones personalizadas ) para compartir y difudir estos análisis y comparaciones a los demás actores del sector. 

---

## Arquitectura de Alto Nivel

```
┌────────────┐          ┌──────────────────────────┐
│  Frontend  │  Next.js │  API Routes (Edge Func.) │
│  React 18  │ <───────►│  — /api/compare          │
│  Tailwind  │          │  — /api/documents/*      │
└────┬───────┘          └──────────┬───────────────┘
     │ Web (HTTPS)                 │ pg    │ s3
┌────▼──────────┐            ┌─────▼──────┐
│  Navegador    │            │  Aurora    │
│  PDF.js       │            │ PostgresQL │
└───────────────┘            └────────────┘
```

1. **Frontend**  
   • Next.js 14 con App Router (renderizado híbrido).  
   • Tailwind + shadcn/ui para la capa visual.  
   • Context API para estado de autenticación y sesión.

2. **Backend (en la misma code-base)**  
   • Rutas API `/app/api/**` ejecutadas como funciones edge/serverless.  
   • OpenAI GPT-4 se usa en `api/compare` para generar el diff semántico.  
   • PDF.js extrae texto localmente en el navegador; la generación de PDF final se hace en servidor.

3. **Persistencia & Almacenamiento**  
   • **Aurora PostgreSQL Serverless v2** (modelo relacional; ver [`database/aurora-schema.sql`]).  
   • **AWS S3** para archivos originales y reportes (`uploads/`, `reports/`).  
   • Acceso a Aurora mediante `pg` (pool gestionado en `src/lib/db/aurora.ts`).

4. **Seguridad**  
   • Autenticación con [Supabase Auth](https://supabase.com) (JWT).
   • Acceso a la base controlado en capa de servicio y mediante FKs `ON DELETE CASCADE`.
   • Variables sensibles definidas vía entorno (`DATABASE_URL`, `OPENAI_API_KEY`, etc.).

---

## Componentes Principales

| Carpeta | Rol | Destacado |
|---------|-----|-----------|
| `src/app/` | Paginas Next.js + rutas API | UI, Auth, Dashboard |
| `src/components/` | UI re-usable (Timeline, HistoryView, ReportGenerator) | Cohesión visual |
| `src/contexts/AuthContext.tsx` | Control de sesión | Propaga usuario a toda la app |
| `src/lib/services/` | Capa de dominio (auth, comparación, reportes) | ‌Aisla lógica de negocio |
| `src/lib/db/aurora.ts` | Pool PostgreSQL + helpers de transacción | Conexiones eficientes |
| `database/aurora-schema.sql` | Esquema SQL versionado | Migraciones vía CI |

---

## Flujo de Trabajo

1. **Ingreso a Dashboard personalizado** lo primero que ve el usuario, un dashboard con sus estadisticas de uso, y diferentes botones para acciones rápidas en la aplicación. 
2. **Subida de documentos** → archivo se guarda en S3 y metadatos en `documents`.  
3. **Comparación** (`compareDocuments`)  
   1. Se envía texto a GPT-4.1 con sus system prompt peersonalizado.  
   2. El JSON devuelto se normaliza y se guarda en `comparisons` + `differences`.  
4. **Visualización**  
   • UI resalta adiciones (verde), eliminaciones (rojo) y modificaciones (amarillo) en paralelo.  
5. **Línea de Tiempo**  
   • Cada milestone apunta a un `comparison_id`, permitiendo recrudecer versiones históricas.  
6. **Generación de Reporte**  
   • PDF con la opcion de elegir que entra y que no: 

        - Incluir todos los cambios 
            * Adiciones 
            * Eliminaciones 
            * Modificaciones 
        - Incluir Resumen 
        - Incluir Análisis de Impacto
        - Incluir Diferencias Detalladas 
    
   impacto y detalle opcional—almacenado en `reports/` (S3).

---

## Variables de Entorno (extracto)

```env
# Base de datos
DATABASE_URL=postgres://user:pass@host:port/db
# AWS
AWS_ACCESS_KEY_ID=***
AWS_SECRET_ACCESS_KEY=***
S3_REGION=us-east-1
S3_BUCKET=legischeck-prod-docs
# IA
OPENAI_API_KEY=sk-...
```

> Para un listado completo revisa `env.example`.

---

## Estructura de Carpetas

```
doc-diff/
├─ src/
│  ├─ app/               # Pages + API Routes
│  ├─ components/        # UI reutilizable
│  ├─ contexts/          # React Contexts
│  ├─ lib/
│  │  ├─ db/             # Conexión Aurora
│  │  ├─ services/       # Lógica de dominio
│  │  └─ utils/          # Helpers genéricos
│  └─ types/             # Definiciones TypeScript
└─ database/             # SQL schema & seeds
```

---

## 🏗️ Puesta en Marcha Local

```bash
git clone https://github.com/tu-empresa/legischeck.git

cd legischeck

npm install

cp env.example .env.local (en el root directory)     # añade tus claves

npm run dev             # http://localhost:3000
```

---

## Despliegue

1. **Railway** para el frontend + API routes.  
2. **GitHub Actions** ejecuta migraciones con `psql $DATABASE_URL -f database/aurora-schema.sql`. - (*Esta automatización es crucial para mantener la base de datos actualizada*)
3. **AWS**: Aurora + S3 (con versionado & lifecycle).  

_Consulta `SETUP.md` para un paso a paso detallado._

---

## 🤝 Contribuciones

Este repositorio pertenece a **[Govlab Universidad de la Sabana]**.  
#### No es de Dominio público

---

## Licencia

**Copyright ©
[Govlab Universidad de la Sabana]. Todos los derechos reservados.**  

LegisCheck es software propietario; queda prohibida su redistribución o uso con fines distintos a los autorizados por contrato comercial. Para licencias OEM o permisos especiales contacte a `dirgovlab@unisabana.edu.co`.
