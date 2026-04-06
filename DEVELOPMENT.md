# FriendlyTeaching.cl — Guía de Desarrollo

## Cómo ejecutar el proyecto localmente

```bash
# 1. Abrir PowerShell en Windows
cd "C:\Users\UsuarioPC\Desktop\Claude Dev\friendlyteaching-app"

# 2. Instalar dependencias (solo la primera vez o si cambia package.json)
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en el navegador → http://localhost:3000
```

> ⚠️ Si aparece "Unable to acquire lock": ya hay otra instancia corriendo.
> Ejecuta `taskkill /F /IM node.exe` y vuelve a correr `npm run dev`.

---

## Deploy en Vercel

```bash
# Opción A: CLI de Vercel
npm i -g vercel
vercel --prod

# Opción B: Conectar repositorio en vercel.com
# 1. Subir el proyecto a GitHub
# 2. Importar en https://vercel.com/new
# 3. Agregar las variables de entorno (ver abajo)
```

### Variables de entorno para Vercel

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Clave pública de Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `NEXT_PUBLIC_TEACHER_CODE` | Código del profesor (ej: `FT-PROFESOR-2026`) |
| `NEXT_PUBLIC_APP_URL` | URL de producción (ej: `https://friendlyteaching.cl`) |

---

## Firestore Security Rules

El archivo `firestore.rules` ya está configurado. Para desplegarlo:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # seleccionar proyecto existente
firebase deploy --only firestore:rules
```

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                        # Landing page completa
│   ├── auth/login                      # Login Firebase
│   ├── auth/register                   # Registro teacher/student
│   ├── dashboard/
│   │   ├── layout.tsx                  # Layout protegido + Sidebar
│   │   ├── teacher/page.tsx            # Scheduling grid semanal
│   │   ├── teacher/students            # Gestión de estudiantes
│   │   ├── teacher/lessons             # Biblioteca de lecciones
│   │   ├── teacher/lessons/[id]/edit   # Editor de slides (3 paneles)
│   │   ├── teacher/bulk-upload         # Importar lecciones JSON
│   │   └── student/page.tsx            # Portal del estudiante
│   └── classroom/[lessonId]            # Visor de lección en clase
│
├── components/
│   ├── auth/AuthProvider               # Firebase auth → Zustand
│   ├── layout/Sidebar + TopBar         # Navegación y header
│   ├── schedule/                       # SchedulingGrid + modales
│   ├── classroom/                      # SlideViewer + 13 tipos de slide
│   └── editor/                         # SlideList + SlideEditorPanel
│
├── hooks/
│   ├── useBookings                     # onSnapshot tiempo real
│   ├── useSchedule                     # Plantilla semanal
│   ├── useStudents                     # Pendientes + aprobados
│   └── useLessons                      # Lecciones + cursos
│
├── store/
│   ├── authStore                       # user, role, profile
│   ├── scheduleStore                   # semana, modal estado
│   └── lessonStore                     # slides en edición
│
└── types/firebase.ts                   # TypeScript types Firestore
```

---

## Flujo de roles

| Rol | Registro | Acceso |
|-----|----------|--------|
| **Teacher** | Código `FT-PROFESOR-2026` | Dashboard inmediato |
| **Student** | Email/password | Espera aprobación |

---

## Colores del scheduling grid

| Color | Estado |
|-------|--------|
| 🟢 Verde | Disponible |
| 🟣 Morado | Ocupado (recurrente) |
| 🩷 Rosa | Ocupado (única vez) |
| 🟡 Amarillo | Pendiente de confirmación |
| ⚪ Gris | Bloqueado |

---

## Tipos de slide (13)

`cover` · `free_text` · `vocabulary` · `multiple_choice` · `grammar_table` · `selection` · `listening` · `true_false` · `matching` · `drag_drop` · `writing_prompt` · `speaking` · `image_label`

---

## Importar lecciones (Bulk Upload)

Ir a **📥 Importar lecciones** en el Sidebar. Arrastra un `.json` o pégalo directamente.

Campos requeridos: `code`, `title`, `slides`

Campos opcionales: `courseId`, `unit`, `lessonNumber`, `level`, `duration`, `objectives`, `isPublished`

---

## Estado de fases

| Fase | Estado | Descripción |
|------|--------|-------------|
| Fase 1 | ✅ | Firebase Auth + Zustand + TypeScript |
| Fase 2 | ✅ | Dashboard Teacher + Scheduling Grid |
| Fase 3 | ✅ | Classroom Viewer (13 tipos de slide) |
| Fase 4 | ✅ | Slide Editor 3 paneles + lessonStore |
| Fase 5 | ✅ | PWA + Portal Estudiante + Bulk Upload |
| Seguridad | ✅ | firestore.rules con roles y permisos |

---

## Próximos pasos sugeridos

- **Homework system**: asignar tareas desde bookings completados
- **Progress tracking**: respuestas del estudiante en Firestore
- **Audio/Image upload**: Firebase Storage para slides listening/image_label
- **Notifications**: email cuando se aprueba un estudiante
- **Admin panel**: `/dashboard/admin` para gestión global
