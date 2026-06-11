# Malmö 040 Tour Hub — Guía de despliegue

## Qué necesitas
- Cuenta en supabase.com (gratis)
- Cuenta en vercel.com (gratis)
- Node.js instalado en tu ordenador (para pruebas locales)

---

## PASO 1 — Crear proyecto en Supabase

1. Ve a https://supabase.com y crea una cuenta
2. Clic en "New project"
3. Ponle nombre: `malmo-tour`
4. Elige una contraseña para la base de datos (guárdala)
5. Región: Europe West (o la más cercana)
6. Espera ~2 min a que se cree

---

## PASO 2 — Crear las tablas

1. En el panel de Supabase, ve a **SQL Editor**
2. Clic en "New query"
3. Copia todo el contenido de `supabase_schema.sql`
4. Pégalo y dale a **Run** (botón verde)
5. Deberías ver "Success" sin errores

---

## PASO 3 — Crear el bucket de Storage

1. En Supabase ve a **Storage**
2. Clic en "New bucket"
3. Nombre: `tour-docs`
4. Desmarca "Public bucket" (privado)
5. Clic en "Save"

---

## PASO 4 — Crear usuarios (uno por persona)

Para cada miembro de la banda y crew:

1. Ve a **Authentication → Users → Invite user**
2. Pon el email de esa persona
3. Le llegará un email para establecer contraseña

Luego vincular cada usuario con su perfil:
1. Ve a **Table Editor → tour_members**
2. Para cada fila, edita `auth_user_id` y pon el UUID del usuario
   (lo ves en Authentication → Users → columna "UID")

**Usuarios a crear:**
- framis@malmo040.com → banda
- nacho@malmo040.com → banda
- victor@malmo040.com → banda
- joanet@malmo040.com → banda
- gonzo@malmo040.com → banda
- carla@malmo040.com → crew (admin también)
- karateka@malmo040.com → crew

Para hacer a alguien admin, cambia `type` a `admin` en tour_members.

---

## PASO 5 — Conectar la app

1. En Supabase ve a **Settings → API**
2. Copia:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (la clave larga)

3. En la carpeta del proyecto, copia el archivo de ejemplo:
   ```
   cp .env.example .env
   ```
4. Edita `.env` y pega tus valores:
   ```
   REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...
   ```

---

## PASO 6 — Desplegar en Vercel

1. Sube la carpeta a GitHub (nuevo repositorio)
2. Ve a https://vercel.com e inicia sesión con GitHub
3. Clic en "New Project" → importa el repositorio
4. En "Environment Variables" añade:
   - `REACT_APP_SUPABASE_URL` → tu URL
   - `REACT_APP_SUPABASE_ANON_KEY` → tu key
5. Clic en **Deploy**
6. En ~2 minutos tienes la URL pública

---

## Uso diario — Panel admin

El admin (tú, Carla, Santiago) entra a la app y verá un botón ⚙ en la esquina inferior derecha.

Desde ahí puedes:
- **Editar cualquier show** — título, fecha, ficha, hotel, notas
- **Gestionar horarios** — añadir/editar/borrar items del timeline, asignar a quién son visibles, añadir líneas de info extra
- **Ver la crew** — ver todos los miembros registrados

Para subir documentos (riders, billetes, stage plots):
1. Ve a Supabase → Storage → tour-docs
2. Sube el archivo
3. Copia la ruta (ej: `pdl/rider-tecnico.pdf`)
4. En Table Editor → documents, crea la fila con esa ruta

---

## Prueba local (opcional)

```bash
cd malmo-tour
npm install
npm start
```

Abre http://localhost:3000

---

## Estructura de archivos

```
src/
  App.js              → Router principal
  hooks/useAuth.js    → Login / sesión
  lib/supabase.js     → Cliente Supabase
  components/
    Login.js          → Pantalla de login
    ShowsList.js      → Lista de fechas
    ShowDetail.js     → Vista de un show
    Admin.js          → Panel de gestión
public/
  index.html
supabase_schema.sql   → Schema completo (tablas + RLS + datos iniciales)
.env.example          → Variables de entorno
```
