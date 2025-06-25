# 🚀 Configuración de Autenticación y Base de Datos

Este sistema utiliza **Supabase para autenticación** y **Aurora PostgreSQL de AWS para la base de datos**. Aquí tienes la guía completa para configurarlo.

## 📋 Requisitos Previos

- Cuenta de AWS con acceso a RDS Aurora y S3
- Cuenta de Supabase (gratis)
- Node.js 18+ instalado

## 🔧 Configuración Paso a Paso

### 1. Configurar Supabase (Solo Autenticación)

1. **Crear proyecto en Supabase**:
   - Ve a [supabase.com](https://supabase.com)
   - Crea un nuevo proyecto
   - Nombre: `doc-comparison-auth`

2. **Configurar autenticación**:
   - Ve a Authentication → Settings
   - Configura los proveedores que desees (Email, Google, etc.)
   - Site URL: `http://localhost:3000` (desarrollo)

3. **Obtener credenciales**:
   - Ve a Settings → API
   - Copia el `Project URL` y `anon public key`

### 2. Configurar Aurora PostgreSQL en AWS

1. **Crear Aurora Cluster**:
   ```bash
   # Via AWS Console o CLI
   aws rds create-db-cluster \
     --db-cluster-identifier doc-comparison-cluster \
     --engine aurora-postgresql \
     --master-username postgres \
     --master-user-password YourSecurePassword123 \
     --database-name doc_comparison
   ```

2. **Configurar Networking**:
   - VPC: Default o tu VPC personalizada
   - Security Group: Permitir puerto 5432 desde tu IP
   - Public Access: Sí (para desarrollo)

3. **Obtener endpoint**:
   - Copia el Writer Endpoint del cluster

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local`:

```bash
# Supabase (solo auth)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Aurora PostgreSQL
AURORA_HOST=doc-comparison-cluster.cluster-xxxxxxxxx.us-east-1.rds.amazonaws.com
AURORA_PORT=5432
AURORA_DATABASE=doc_comparison
AURORA_USER=postgres
AURORA_PASSWORD=YourSecurePassword123

# AWS S3 (opcional para archivos)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=doc-comparison-storage

# App
NEXTAUTH_SECRET=tu-clave-secreta-random
NEXTAUTH_URL=http://localhost:3000
```

### 4. Configurar la Base de Datos

1. **Conectar a Aurora**:
   ```bash
   psql -h tu-aurora-endpoint -U postgres -d doc_comparison
   ```

2. **Ejecutar el esquema**:
   ```bash
   psql -h tu-aurora-endpoint -U postgres -d doc_comparison -f database/aurora-schema.sql
   ```

### 5. Probar la Conexión

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar el servidor**:
   ```bash
   npm run dev
   ```

3. **Probar**:
   - Ve a `http://localhost:3000/auth`
   - Registra un usuario
   - Debería crear automáticamente el perfil en Aurora

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Supabase      │    │   Aurora         │    │      S3         │
│  (Auth Only)    │    │  PostgreSQL      │    │   (Storage)     │
│                 │    │                  │    │                 │
│ • User signup   │────│ • User profiles  │    │ • Documents     │
│ • User login    │    │ • Documents      │    │ • Reports       │
│ • Session mgmt  │    │ • Comparisons    │    │ • Images        │
│ • Password      │    │ • Reports        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔄 Flujo de Autenticación

1. **Registro**:
   - Usuario se registra en Supabase
   - Se crea automáticamente perfil en Aurora
   - Usuario recibe email de verificación

2. **Login**:
   - Usuario inicia sesión via Supabase
   - Sistema carga perfil desde Aurora
   - Dashboard muestra estadísticas reales

3. **Uso**:
   - Todas las operaciones CRUD en Aurora
   - Autenticación siempre via Supabase
   - Archivos en S3

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Probar conexión Aurora
npm run test:db

# Migrar esquema
npm run migrate

# Backup base de datos
pg_dump -h tu-aurora-endpoint -U postgres doc_comparison > backup.sql
```

## 🔒 Seguridad

- ✅ Supabase maneja autenticación segura
- ✅ Aurora con SSL habilitado
- ✅ Variables de entorno separadas
- ✅ Validación de entrada en frontend
- ✅ Sanitización de consultas SQL

## 📊 Monitoreo

- **Aurora**: CloudWatch metrics
- **Supabase**: Dashboard de autenticación 
- **App**: Console logs en producción

## 🚀 Despliegue

Para producción:
1. **Railway** para el frontend y backend (Next.js + API routes).
2. **Aurora Serverless v2** ya configurado para escalamiento automático.
3. **S3** para almacenamiento de archivos y reportes.
4. **Variables de entorno** configuradas directamente en Railway.

## ❓ Troubleshooting

### Error: "Cannot connect to Aurora"
- Verifica security group (puerto 5432 abierto)
- Confirma endpoint y credenciales
- Prueba desde psql directamente

### Error: "Supabase auth failed"
- Verifica URLs en configuración
- Confirma que las claves son correctas
- Revisa la configuración de dominio permitido

### Error: "Profile not created"
- Verifica que el esquema esté aplicado
- Confirma que el trigger funciona
- Revisa logs de la base de datos

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del navegador
2. Verifica la configuración de variables
3. Prueba cada servicio por separado
4. Consulta la documentación de Supabase y AWS 