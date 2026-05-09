# BO3-IA — Documentación del proyecto

> Aplicación fullstack que registra partidas de **Call of Duty: Black Ops 3 Zombies — Shadows of Evil**, analiza tus datos históricos y genera recomendaciones inteligentes basadas en tus patrones de juego reales.

---

## Índice

1. [¿Qué problema resuelve?](#1-qué-problema-resuelve)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Estructura del proyecto](#3-estructura-del-proyecto)
4. [Base de datos](#4-base-de-datos)
5. [Backend — cómo funciona](#5-backend--cómo-funciona)
6. [Flujo de datos completo](#6-flujo-de-datos-completo)
7. [Endpoints de la API](#7-endpoints-de-la-api)
8. [Eventos Socket.io (tiempo real)](#8-eventos-socketio-tiempo-real)
9. [Lógica de IA (sistema de riesgo + chat + resumen grupal)](#9-lógica-de-ia-sistema-de-riesgo--chat--resumen-grupal)
10. [Frontend — cómo funciona](#10-frontend--cómo-funciona)
11. [Seguridad](#11-seguridad)
12. [Cómo correr el proyecto](#12-cómo-correr-el-proyecto)
13. [Variables de entorno](#13-variables-de-entorno)
14. [Glosario para principiantes](#14-glosario-para-principiantes)

---

## 1. ¿Qué problema resuelve?

Cuando juegas Zombies en BO3 (Shadows of Evil), es difícil recordar en qué rondas moriste, por qué, qué perks tenías, qué armas llevabas y en qué zona estabas. Con el tiempo pierdes información valiosa sobre tus propios patrones. Este proyecto:

- **Registra** cada partida con todos sus datos: zona, ronda, causa de muerte, perks, armas con nivel PaP y AAT, gobblegums, rituales, buildables, plataforma (PC/PS4/PS3), puntos al morir y notas libres
- **Analiza** tus patrones históricos: zonas donde duras más, impacto de Juggernog, impacto del PaP, AAT más efectivo, causa de muerte más común
- **Calcula en tiempo real** un porcentaje de riesgo por partida usando 9 reglas específicas de SoE con recomendaciones concretas
- **Visualiza** con gráficas la evolución de tus rondas, distribución de causas de muerte y comparativa entre plataformas
- **Muestra tooltips interactivos** al pasar el mouse sobre enemigos y perks: descripción, nivel de peligro, tips de combate y mejores armas

---

## 2. Stack tecnológico

| Parte | Tecnología | ¿Para qué sirve? |
|---|---|---|
| Frontend | React + Vite + TypeScript | Interfaz visual con tema HUD táctico |
| UI Components | Material UI v9 (MUI) | Componentes con tema dark Apothicon personalizado |
| Estado global | Redux Toolkit | Guarda partidas y sesión de usuario en memoria |
| Peticiones HTTP | TanStack Query + Axios | Comunicación con el backend, caché automático |
| Formularios | React Hook Form + Yup | Validación de formularios con esquemas declarativos |
| Rutas | React Router DOM | Navegación entre páginas (login, register, home, session) |
| Gráficas | Recharts | Visualización de datos históricos |
| Tiempo real | Socket.io | Salas multijugador, chat y sincronización de estado |
| Backend | Node.js + Express + TypeScript | Servidor que procesa la lógica y habla con la BD |
| Autenticación | bcryptjs + jsonwebtoken | Hash de contraseñas y tokens JWT |
| Seguridad HTTP | helmet + express-rate-limit | Headers de seguridad y protección contra brute force |
| IA táctica | Groq API (llama-3.3-70b-versatile) | Chat en tiempo real y resumen grupal de sesión |
| Base de datos | PostgreSQL 18 | Guarda las partidas, usuarios, sesiones y mensajes |

---

## 3. Estructura del proyecto

```
BO3-IA/
├── Frontend/
│   └── src/
│       ├── components/
│       │   ├── GameForm.tsx           ← Formulario de partida (7 secciones). En sesión muestra spinner de espera
│       │   ├── StatsPanel.tsx         ← Panel con 8 estadísticas + tips dinámicos
│       │   ├── GameHistory.tsx        ← Tabla con historial completo y tooltips ricos
│       │   ├── ChartsPanel.tsx        ← 3 gráficas: rondas, causas y plataformas
│       │   ├── InfoTooltip.tsx        ← Tarjetas flotantes de enemigos y perks
│       │   ├── BriefingPanel.tsx      ← Panel pre-partida: warnings, fortalezas y tips SoE
│       │   ├── TrendPanel.tsx         ← Panel de progresión: tendencia general + 5 métricas
│       │   ├── ChatPanel.tsx          ← Chat IA táctica en tiempo real con Groq (historial preservado entre tabs)
│       │   ├── SessionStatsPanel.tsx  ← Panel de estadísticas grupales por partida + análisis IA Groq
│       │   ├── ErrorBoundary.tsx      ← Captura crashes de React y muestra pantalla de error amigable
│       │   └── ProtectedRoute.tsx     ← Redirige a /login si no hay token válido
│       ├── constants/
│       │   └── labels.ts              ← Labels legibles para zonas, personajes, causas, perks (ej: footlight_district → 'Footlight District')
│       ├── data/
│       │   └── gameData.ts            ← Datos de cada enemigo y perk (descripción, tips, armas)
│       ├── pages/
│       │   ├── HomePage.tsx           ← Página principal: briefing + form + stats + gráficas + historial
│       │   ├── SessionPage.tsx        ← Página de sesión multijugador: lobby → game (form+chat) → stats grupales
│       │   ├── LoginPage.tsx          ← Formulario de login con react-hook-form + Yup
│       │   └── RegisterPage.tsx       ← Formulario de registro con react-hook-form + Yup
│       ├── hooks/
│       │   ├── useGames.ts            ← TanStack Query: guardar/leer partidas
│       │   ├── useBriefing.ts         ← TanStack Query: briefing pre-partida (5 min caché)
│       │   ├── useTrends.ts           ← TanStack Query: análisis de progresión (5 min caché)
│       │   ├── useSessionSocket.ts    ← Hook que gestiona la conexión Socket.io de la sesión y todos sus eventos
│       │   └── useAppStore.ts         ← Hook tipado de Redux
│       ├── services/
│       │   ├── api.ts                 ← Instancia axios con interceptor de auth (Bearer token automático)
│       │   ├── gameService.ts         ← saveGame, getAllGames, getStats
│       │   ├── briefingService.ts     ← getBriefing
│       │   ├── trendService.ts        ← getTrends + tipos TrendMetric, TrendResponse
│       │   ├── sessionService.ts      ← createSession, joinSession, getSession, getSessionStats, getSessionSummary
│       │   └── authService.ts         ← register, login
│       ├── store/
│       │   ├── gamesSlice.ts          ← Estado global Redux: lista de partidas
│       │   └── authSlice.ts           ← Estado global Redux: usuario + token (con fallback JWT decode)
│       ├── types/
│       │   └── index.ts               ← Constantes y tipos TypeScript del dominio
│       └── theme.ts                   ← Tema MUI (colores púrpura/violeta, fuentes, overrides)
│
├── Backend/
│   └── src/
│       ├── config/
│       │   └── db.ts               ← Pool de conexiones a PostgreSQL
│       ├── routes/
│       │   ├── game.routes.ts      ← POST /games, GET /games, GET /stats
│       │   ├── auth.routes.ts      ← POST /auth/register, POST /auth/login
│       │   ├── briefing.routes.ts  ← GET /briefing
│       │   ├── trend.routes.ts     ← GET /trends
│       │   ├── session.routes.ts   ← CRUD de sesiones + stats + summary (ver sección 7)
│       │   └── chat.routes.ts      ← POST /chat (consultas a la IA táctica)
│       ├── controllers/
│       │   ├── game.controller.ts     ← Validación de datos, límites numéricos
│       │   ├── auth.controller.ts     ← Validación de registro/login, respuestas JWT
│       │   ├── briefing.controller.ts ← Llama al briefing service
│       │   ├── trend.controller.ts    ← Llama al trend service
│       │   ├── session.controller.ts  ← Crea/une/inicia/termina sesiones + stats + resumen Groq
│       │   └── chat.controller.ts     ← Llama al chat service con historial
│       ├── middleware/
│       │   └── auth.middleware.ts  ← requireAuth: verifica Bearer token en todas las rutas protegidas
│       ├── services/
│       │   ├── game.service.ts     ← Queries SQL: insert, getAll, fetchStats
│       │   ├── risk.service.ts     ← Motor de 9 reglas → riesgo + recomendaciones
│       │   ├── auth.service.ts     ← createUser, verifyCredentials, signToken, verifyToken
│       │   ├── briefing.service.ts ← 2 queries paralelas → detecta patrones → genera briefing
│       │   ├── trend.service.ts    ← Divide partidas en 2 mitades → compara 5 métricas
│       │   ├── session.service.ts  ← Lógica completa de salas: crear, unir, iniciar, terminar, stats, resumen Groq
│       │   └── chat.service.ts     ← System prompt SoE + historial de chat → Groq API (max_tokens: 600)
│       ├── sockets/
│       │   └── session.socket.ts   ← Todos los eventos Socket.io: join_room, chat, form_submitted, all_forms_ready...
│       ├── data/
│       │   └── soe_knowledge.ts    ← 25 entradas curadas en 8 categorías (apertura, perks, enemigos...)
│       └── models/
│           ├── game.model.ts       ← Constantes y tipos del backend
│           └── auth.model.ts       ← Interfaces User, UserPublic, RegisterBody, LoginBody, AuthPayload
│
├── database/
│   ├── schema.sql          ← Crea la tabla games desde cero (21 columnas)
│   ├── migration_v2.sql    ← Añade: map, game_mode, character, weapons, buildables, puntos, gobblegums
│   ├── migration_v3.sql    ← Añade: weapons_pap JSONB
│   ├── migration_v4.sql    ← Elimina columna juggernog obsoleta
│   ├── migration_v5.sql    ← Añade: platform (pc, ps3, ps4)
│   ├── migration_v6.sql    ← Añade: notes TEXT (anotación libre)
│   ├── migration_v7.sql    ← Crea tabla users (id, username, email, password, created_at)
│   ├── migration_v8.sql    ← Añade: user_id INT REFERENCES users(id) a games + índice
│   ├── migration_v9.sql    ← Crea tablas sessions y session_members (sistema de salas)
│   └── migration_v10.sql   ← Añade session_id a games + crea tabla session_messages (chat)
│
└── shared/
    └── types.ts            ← Tipos compartidos (referencia)
```

---

## 4. Base de datos

### Estado actual de la BD

La base de datos `bo3_ia` tiene **5 tablas**:

| Tabla | Descripción | Creada en |
|---|---|---|
| `users` | Cuentas de usuario (auth) | migration_v7.sql |
| `games` | Partidas registradas | schema.sql + migraciones |
| `sessions` | Salas de juego multijugador | migration_v9.sql |
| `session_members` | Qué usuarios están en cada sala | migration_v9.sql |
| `session_messages` | Mensajes del chat en tiempo real | migration_v10.sql |

---

### Tabla `users` — 5 columnas

Cada fila es una **cuenta de usuario registrada**:

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | ID único autoincremental |
| `username` | TEXT UNIQUE NOT NULL | Nombre de usuario (3–20 chars, solo letras/números/_) |
| `email` | TEXT UNIQUE NOT NULL | Email del usuario |
| `password` | TEXT NOT NULL | Hash bcrypt de la contraseña (12 rondas de sal) — nunca la contraseña original |
| `created_at` | TIMESTAMP | Fecha de registro automática |

> La contraseña **nunca se guarda en texto plano**. `bcrypt.hash(password, 12)` genera un hash irreversible. Al hacer login, `bcrypt.compare()` verifica sin desencriptar.

---

### Tabla `games` — 22 columnas

Cada fila representa **una partida jugada**:

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | Número único automático |
| `user_id` | INT FK | Usuario dueño de la partida (`→ users.id`, nullable para registros históricos) |
| `map` | TEXT | Mapa jugado (siempre `shadows_of_evil`) |
| `game_mode` | TEXT | `solo` o `split_screen` |
| `platform` | TEXT | `pc`, `ps3` o `ps4` |
| `character` | TEXT | `nero`, `jack`, `jessica` o `floyd` (opcional) |
| `round` | INT | Ronda en la que moriste (1–255) |
| `zone` | TEXT | Zona donde estabas al morir |
| `cause_of_death` | TEXT | Qué te mató |
| `perks` | TEXT[] | Lista de perks al morir: `["juggernog", "speed_cola"]` |
| `weapons` | TEXT[] | Lista plana de armas (derivada automáticamente de `weapons_pap`) |
| `weapons_pap` | JSONB | Armas con detalle de PaP y AAT (ver abajo) |
| `pack_a_punch` | BOOLEAN | ¿Tenías acceso al PaP? |
| `rituals_completed` | INT | Rituales completados en esa partida (0–4) |
| `has_apothicon_servant` | BOOLEAN | ¿Tenías el Apothicon Servant? |
| `has_apothicon_sword` | BOOLEAN | ¿Tenías la Apothicon Sword? |
| `has_rocket_shield` | BOOLEAN | ¿Tenías el Rocket Shield? |
| `civil_protector_active` | BOOLEAN | ¿Estaba activo el Civil Protector? |
| `points_at_death` | INT | Puntos al morir (opcional, máx. 1.000.000) |
| `notes` | TEXT | Anotación libre de hasta 500 caracteres (opcional) |
| `gobblegums` | TEXT[] | Gobblegums usados en esa partida |
| `created_at` | TIMESTAMP | Fecha/hora automática |

### La columna `weapons_pap` (JSONB)

JSONB permite guardar estructuras complejas directamente en PostgreSQL y hacer queries sobre su contenido.

**Ejemplo de valor:**
```json
[
  { "weapon": "KRM-26", "pap_count": 1, "aat": "blast_furnace" },
  { "weapon": "VMP",    "pap_count": 2, "aat": "dead_wire" },
  { "weapon": "Ray Gun","pap_count": 0 }
]
```

- `pap_count: 0` → sin Pack-a-Punch
- `pap_count: 1` → PaP x1 (5000 pts). 20% de probabilidad por cada uno de los 5 AATs
- `pap_count: 2` → PaP x2 (2500 pts adicionales). 25% por cada uno de los 4 AATs restantes

La lista plana `weapons` se deriva automáticamente en `game.service.ts`:
```ts
const weapons = weapons_pap.map((w) => w.weapon);
```

### Valores válidos por campo

```
ZONAS:        junction | canal_district | footlight_district | waterfront_district | the_rift
CAUSAS:       zombie | margwa | parasite | meatball | keeper | unknown
PERKS:        quick_revive | juggernog | speed_cola | double_tap | widows_wine | mule_kick | stamin_up
PERSONAJES:   nero | jack | jessica | floyd
MODOS:        solo | split_screen
PLATAFORMAS:  pc | ps3 | ps4
GOBBLEGUMS:   in_plain_sight | anywhere_but_here | stock_option | alchemical_antithesis | sword_flay | armental_accomplice
AATs:         dead_wire | blast_furnace | turned | thunder_wall | fireworks
```

> **¿Por qué distinguir plataforma?** En PC (mouse + teclado) el movimiento es más fluido y los giros de 180° son inmediatos, pero no hay aim assist. En PS4/PS3 hay aim assist pero las palancas pueden ser menos precisas. La plataforma es una variable con potencial analítico para detectar si el patrón de muerte varía según el control.

---

## 5. Backend — cómo funciona

### Capas del backend

```
Petición HTTP
     ↓
  ROUTE         → ¿Qué URL es? ¿GET o POST?
     ↓
  CONTROLLER    → Valida los datos recibidos y sus límites
     ↓
  SERVICE       → Ejecuta queries SQL y lógica de negocio
     ↓
  DATABASE      → PostgreSQL guarda o devuelve datos
     ↑
  Respuesta JSON
```

### `config/db.ts` — Conexión a PostgreSQL

```ts
// Pool = conjunto de conexiones reutilizables.
// En lugar de abrir y cerrar la conexión en cada petición,
// mantenemos un "pool" de conexiones listas para usar.
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
```

### `controllers/game.controller.ts` — Validación

El controlador verifica los datos antes de tocar la BD:
- `round` debe ser un entero entre **1 y 255** (la ronda 255 es el límite técnico de BO3 — alcanzarla requeriría ~70 horas de juego continuo)
- `zone`, `cause_of_death`, `game_mode` y `platform` deben ser uno de los valores válidos
- `rituals_completed` se fuerza al rango 0–4 (clamp silencioso)
- `points_at_death` se fuerza al rango 0–1.000.000 (clamp silencioso)
- `notes` se trunca a 500 caracteres

### `services/game.service.ts` — Lógica principal

- `insertGame()` — Inserta 22 parámetros incluyendo `user_id`. Deriva `weapons[]` de `weapons_pap`. Usa `$11::jsonb` para el cast
- `getAllGames(userId?)` — `SELECT * FROM games WHERE user_id = $1 ORDER BY id DESC` (con filtro) o sin filtro si no hay userId
- `fetchStats(userId?)` — 6 queries SQL filtradas por `user_id`: stats generales, mejor zona, impacto de Juggernog, impacto del PaP, causa más común y AAT más efectivo via `jsonb_array_elements(weapons_pap)`

### `data/soe_knowledge.ts` — Base de conocimiento curada

Archivo estático con 25 entradas organizadas en 8 categorías:

| Categoría | Entradas | Contenido |
|---|---|---|
| `apertura` | 3 | Ruta óptima, primeras 5 rondas, farm en instakill |
| `perks` | 5 | Juggernog, Speed Cola, Quick Revive, Double Tap II, Widow's Wine |
| `enemigos` | 4 | Margwa, Parásito, Meatball, Keeper |
| `buildables` | 4 | Apothicon Servant, Apothicon Sword, Rocket Shield, Civil Protector |
| `rituales` | 3 | Orden óptimo, mecánica paso a paso, recompensa (Sword) |
| `puntos` | 3 | Técnica cuerpo-cuchillo, modo bestia farm, no morir con puntos |
| `zonas` | 4 | The Rift, Junction, Waterfront, Canal District |
| `armas` | 5 | PaP obligatorio, Dead Wire, Blast Furnace, Kuda combo, Ray Gun |

Cada entrada tiene: `id`, `category`, `title`, `tip` (consejo accionable), `detail` (explicación extendida).

### `services/briefing.service.ts` — Motor del briefing

Ejecuta **2 queries SQL en paralelo** (`Promise.all`) sobre el historial del usuario:

| Query | Métricas que extrae |
|---|---|
| Query 1 (general) | total_games, avg_round, % sin Juggernog, % muertes antes ronda 15, causa más común, zona más mortal, avg rituales, avg puntos al morir |
| Query 2 (rondas tardías) | % sin buildable en ronda 15+, % sin PaP en ronda 20+, % sin Speed Cola en ronda 20+ |

Con esas métricas genera:
- **Warnings** — Patrones problemáticos detectados (máx 7 posibles, personalizados)
- **Strengths** — Cosas que el jugador hace bien
- **Base tips** — 6 entradas del knowledge base siempre presentes

---

## 6. Flujo de datos completo

### Guardar una partida

```
1. Usuario llena el formulario en el navegador
2. React llama a saveGame() via TanStack Query (useMutation)
3. Axios hace POST http://localhost:3000/api/games con los datos JSON
4. Express recibe la petición en game.routes.ts
5. game.controller.ts valida zone, cause_of_death, game_mode, platform y rango de round
6. game.service.ts ejecuta INSERT INTO games con los 21 parámetros
7. risk.service.ts aplica 9 reglas sobre los datos de esa partida
8. Backend responde con { game, risk: { risk, recommendations } }
9. El frontend muestra el resultado: ronda, % de riesgo y recomendaciones
10. Redux añade la partida al estado en memoria
11. TanStack Query invalida ['stats'] y ['games'] → todo se actualiza automáticamente
```

---

## 7. Endpoints de la API

Base URL: `http://localhost:3000/api`

### `POST /games` — Guardar partida

**Body (JSON):**
```json
{
  "round": 17,
  "zone": "the_rift",
  "cause_of_death": "margwa",
  "game_mode": "solo",
  "platform": "pc",
  "character": "nero",
  "perks": ["juggernog", "speed_cola"],
  "weapons_pap": [
    { "weapon": "KRM-26", "pap_count": 1, "aat": "blast_furnace" },
    { "weapon": "VMP", "pap_count": 0 }
  ],
  "gobblegums": ["in_plain_sight"],
  "pack_a_punch": true,
  "rituals_completed": 2,
  "has_apothicon_servant": false,
  "has_apothicon_sword": false,
  "has_rocket_shield": true,
  "civil_protector_active": false,
  "points_at_death": 8500,
  "notes": "Fallé el ritual 3 por falta de puntos"
}
```

**Respuesta exitosa (201):**
```json
{
  "game": { "id": 1, "round": 17, "zone": "the_rift", "platform": "pc", "notes": "...", ... },
  "risk": {
    "risk": 0.25,
    "recommendations": [
      "Tus armas PaP tienen: Blast Furnace. En rondas altas Dead Wire o Blast Furnace son esenciales."
    ]
  }
}
```

**Errores posibles (400):**
```json
{ "error": "La ronda debe ser un número entero entre 1 y 255." }
{ "error": "Zona inválida. Valores válidos: junction, canal_district, ..." }
{ "error": "Plataforma inválida. Valores válidos: pc, ps3, ps4" }
```

### `GET /games` — Todas las partidas
Devuelve array de partidas ordenadas de más reciente a más antigua.

### `POST /auth/register` — Crear cuenta

**Body (JSON):**
```json
{ "username": "nero_fan", "email": "usuario@mail.com", "password": "mipass123" }
```

**Reglas de validación:**
- `username`: 3–20 caracteres, solo letras/números/guiones bajos
- `email`: formato válido
- `password`: mínimo 8 caracteres

**Respuesta exitosa (201):**
```json
{
  "user": { "id": 1, "username": "nero_fan", "email": "usuario@mail.com" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores posibles (400 / 409):**
```json
{ "error": "El nombre de usuario debe tener entre 3 y 20 caracteres." }
{ "error": "El email o nombre de usuario ya está en uso" }
```

### `POST /auth/login` — Iniciar sesión

**Body (JSON):**
```json
{ "email": "usuario@mail.com", "password": "mipass123" }
```

**Respuesta exitosa (200):** igual que register — devuelve `{ user, token }`

**Error (401):**
```json
{ "error": "Credenciales inválidas." }
```
> El mensaje es idéntico para email inexistente y contraseña incorrecta — nunca se revela cuál falló.

---

### `GET /briefing` — Briefing pre-partida 🔒

**Header requerido:** `Authorization: Bearer <token>`

**Respuesta exitosa (200):**
```json
{
  "games_analyzed": 12,
  "warnings": [
    {
      "title": "Morís sin Juggernog el 67% de las veces",
      "message": "Juggernog antes de ronda 10, siempre.",
      "detail": "Juggernog duplica tu HP efectivo (100 → 250 HP)..."
    }
  ],
  "strengths": [
    {
      "title": "Buen ritmo de Pack-a-Punch",
      "message": "Llegás al PaP en la mayoría de tus partidas largas.",
      "detail": ""
    }
  ],
  "base_tips": [
    {
      "title": "Ruta óptima de apertura",
      "message": "Abre Junction primero: da acceso a 3 zonas simultáneamente.",
      "detail": "Junction es el hub central del mapa..."
    }
  ]
}
```

> Con `games_analyzed: 0` (usuario nuevo), solo se devuelven `base_tips` con las 6 entradas fundamentales de SoE.

---

### `GET /trends` — Análisis de progresión 🔒

**Header requerido:** `Authorization: Bearer <token>`

**Respuesta con datos suficientes (≥6 partidas):**
```json
{
  "games_analyzed": 10,
  "min_games_required": 6,
  "has_enough_data": true,
  "period_label": "primeras 5 vs últimas 5",
  "metrics": [
    {
      "key": "avg_round",
      "label": "Ronda promedio",
      "old_value": 14.2,
      "new_value": 18.7,
      "change_pct": 31.7,
      "trend": "up",
      "unit": "rondas",
      "interpretation": "Tu ronda promedio subió de 14.2 a 18.7 — mejora sólida."
    }
  ],
  "overall_trend": "mejorando",
  "summary": "Estás mejorando. Tu ronda promedio subió +4.5 entre tus partidas antiguas y recientes."
}
```

**Respuesta sin suficientes datos:**
```json
{
  "games_analyzed": 3,
  "min_games_required": 6,
  "has_enough_data": false,
  "period_label": "",
  "metrics": [],
  "overall_trend": "sin_datos",
  "summary": "Necesitás 3 partidas más para ver tu progresión."
}
```

- `overall_trend`: `"mejorando"` | `"empeorando"` | `"estable"` | `"sin_datos"`
- `trend` por métrica: `"up"` | `"down"` | `"stable"` (umbral: ±8% de cambio)
- Métricas analizadas: ronda promedio, tasa Juggernog, tasa PaP, tasa buildable, rituales promedio

---

### `GET /stats` — Estadísticas + recomendaciones 🔒

```json
{
  "stats": {
    "total_games": 10,
    "avg_round": 18.5,
    "best_zone": "the_rift",
    "juggernog_avg_round": 24,
    "no_juggernog_avg_round": 11,
    "pap_avg_round": 26,
    "most_common_cause": "margwa",
    "most_effective_aat": "dead_wire"
  },
  "tips": [
    "Con Juggernog llegas en promedio a ronda 24 vs 11 sin él — priorizalo siempre.",
    "Con Pack-a-Punch tu promedio sube a ronda 26 — es crítico para sobrevivir.",
    "Tu mejor zona es \"the_rift\" — úsala para entrenar en rondas altas.",
    "El AAT \"dead_wire\" es el que más se correlaciona con rondas altas en tus partidas."
  ]
}
```

---

## 8. Eventos Socket.io (tiempo real)

El backend usa Socket.io sobre el mismo servidor HTTP en el puerto 3000. La autenticación se verifica con el JWT en cada evento sensible.

### Eventos Cliente → Servidor

| Evento | Payload | Descripción |
|---|---|---|
| `join_room` | `{ code, token }` | Entrar a una sala. Verifica JWT, une al socket al room de socket.io, emite `room_state` al recién llegado y `player_joined` a los demás |
| `leave_room` | `{ code }` | Salir de una sala. Emite `player_left` a los demás |
| `start_game` | `{ code, token }` | Solo el líder puede emitirlo. Cambia status a `in_progress`. Emite `game_started` a todos |
| `chat_message` | `{ code, token, content }` | Enviar mensaje de chat. Verifica JWT. Guarda en DB. Límite de 300 chars. Emite `new_message` a todos |
| `end_game` | `{ code, token }` | Solo el líder. Cambia status a `finished`. Emite `game_ended` a todos con la duración en segundos |
| `form_submitted` | `{ code, token }` | Un jugador terminó de llenar su formulario post-partida. El servidor trackea cuántos lo enviaron y emite `all_forms_ready` cuando todos terminaron |

### Eventos Servidor → Cliente

| Evento | Payload | Descripción |
|---|---|---|
| `room_state` | `Session` | Estado completo de la sala (se emite solo al socket que acaba de entrar) |
| `player_joined` | `{ username, members }` | Un jugador se unió a la sala |
| `player_left` | `{ username, members }` | Un jugador salió de la sala |
| `game_started` | `Session` | La partida comenzó — todos los clientes transicionan a la vista de juego |
| `new_message` | `ChatMessage` | Nuevo mensaje en el chat de la sala |
| `game_ended` | `{ session, duration_seconds }` | La partida terminó — todos transicionan al formulario |
| `forms_progress` | `{ submitted, total }` | Cuántos jugadores ya enviaron su formulario (ej: 2/4) |
| `all_forms_ready` | `{ code }` | Todos completaron el formulario — todos transicionan a la vista de estadísticas simultáneamente |
| `error` | `{ message }` | Error en una operación de socket |

### Flujo de una sesión completa

```
[Lobby]
Jugador 1 crea sala → recibe código → comparte
Jugadores 2-4 ingresan el código → join_room
Servidor emite player_joined con toast de notificación

[Partida]
Líder emite start_game → todos reciben game_started → vista de juego
Chat en tiempo real: chat_message → new_message broadcast
IA táctica: POST /api/chat (HTTP, no socket) → respuesta Groq

[Post-partida]
Líder emite end_game → todos reciben game_ended → vista de formulario
Cada jugador llena GameForm → al enviar, emite form_submitted
Servidor emite forms_progress (ej: 2/4) → todos ven el progreso
Cuando submitted === total → all_forms_ready → todos van a stats

[Estadísticas]
SessionStatsPanel carga stats grupales + resumen Groq
Muestra partidas por jugador con medallas (oro/plata/bronce)
Análisis IA de 3-4 oraciones del grupo
```

---

## 9. Lógica de IA (sistema de riesgo + chat + resumen grupal)

El sistema calcula un **valor de riesgo entre 0 y 1** (0% = partida ideal, 100% = situación crítica) aplicando 9 reglas sobre los datos de la partida. Las reglas se acumulan.

### Las 9 reglas (`risk.service.ts`)

| # | Condición | Penalización | Razonamiento |
|---|---|---|---|
| 1 | Sin Juggernog | +0.35 | Sin él tienes la mitad de HP efectivo — es el perk más importante |
| 2 | Zona peligrosa (Canal District o Junction) | +0.20 | Spawns más complejos y menos espacio para entrenar |
| 3 | Ronda < 15 | +0.25 | Morir tan temprano indica problemas graves en el setup inicial |
| 4 | Ronda 15–24 | +0.10 | Rango medio-bajo, hay margen de mejora |
| 5 | Ronda ≥ 20 sin PaP | +0.20 | En ronda 20+ los zombis tienen demasiada vida sin PaP |
| 6 | Ronda ≥ 20 con PaP pero sin Dead Wire ni Blast Furnace | +0.15 | Son los AATs con mayor impacto real en rondas altas |
| 7 | Tiene Turned en ronda ≥ 20 | +0.10 | Turned tiene poca utilidad en rondas altas — ocupa un slot valioso |
| 8 | Ronda ≥ 15 sin ningún buildable | +0.15 | El Apothicon Servant, Sword y Rocket Shield son críticos para sobrevivir |
| 9 | Ronda ≥ 20 sin Speed Cola | +0.10 | Speed Cola reduce el tiempo de recarga a la mitad — esencial en oleadas grandes |

**Bonus informativo:** si tienes Dead Wire con PaP x2, el sistema informa que es el mejor setup posible para limpiar hordas.

### Ejemplo de cálculo

Partida: ronda 12, sin Juggernog, zona Canal District, sin buildables

```
Sin Juggernog           → +0.35
Zona peligrosa          → +0.20
Ronda < 15              → +0.25
Sin buildables (r≥15)   → NO aplica (ronda 12 < 15)
Sin PaP (r≥20)          → NO aplica (ronda 12 < 20)
──────────────────────────────────
Total                   → 0.80 = Riesgo del 80%
```

### Fases del proyecto

| Fase | Estado | Descripción |
|---|---|---|
| 1 | ✅ Completada | 9 reglas de riesgo + estadísticas agregadas por SQL |
| 2 | ✅ Completada | Login / Register / JWT — autenticación de usuarios |
| 3 | ✅ Completada | **The Shadow Society** — salas multijugador en tiempo real con Socket.io |
| 4 | ✅ Completada | Análisis de tendencias entre sesiones (¿estás mejorando?) |
| 6a | ✅ Completada | Briefing pre-partida — base de conocimiento SoE + detección de patrones por SQL |
| IA Chat | ✅ Completada | Chat táctico en tiempo real con Groq/Llama 3.3 (system prompt SoE curado) |
| IA Grupal | ✅ Completada | Resumen grupal automático al terminar la sesión — Groq analiza todas las partidas + chat |
| 5 | Planificada | Modelo de regresión (scikit-learn / Python) entrenado con datos del usuario |
| 6b | Planificada | Predicción probabilística — ML sobre volumen de datos reales (~50+ partidas) |

> **Decisión de diseño clave (Fases 6a/6b):** la IA no empieza de cero cuando un usuario se registra. Una base de conocimiento sobre SoE (glitches, estrategias meta, patrones de enemigos) es investigada y cargada una vez por el desarrollador. Las partidas del usuario solo sirven para personalizar qué parte de ese conocimiento es más relevante para ese jugador específico.

> **The Shadow Society (fase 3) está implementada** — ver sección 8 para la documentación completa de eventos Socket.io y el flujo de sesi\u00f3n.

---

## 10. Frontend — cómo funciona

### SessionPage — flujo de vistas

`SessionPage` tiene 5 vistas internas manejadas con un state `view`:

```
'home'   → Crear sala o ingresar código para unirse
'lobby'  → Sala de espera: lista de jugadores + botón de inicio (solo líder)
'game'   → Partida activa: tabs con [GameForm] y [ChatPanel con IA Groq]
'form'   → GameForm post-partida + indicador de progreso (X/total enviaron)

---

## 11. Seguridad

### Medidas implementadas

| Capa | Medida | Detalle |
|---|---|---|
| **Contraseñas** | bcrypt SALT_ROUNDS=12 | Hash irreversible. Nunca se almacena la contraseña en texto plano |
| **Auth** | JWT Bearer token | Firmado con `JWT_SECRET`. Expira en 7 días. Verificado en cada ruta protegida y en cada evento Socket.io sensible |
| **Headers HTTP** | `helmet()` | Activa ~15 headers: CSP, X-Frame-Options, HSTS, X-Content-Type-Options, X-XSS-Protection, etc. |
| **Brute force** | `express-rate-limit` | Auth: máx 20 intentos cada 15 min por IP. API general: máx 200 req/min por IP |
| **Payload** | `express.json({ limit: '10kb' })` | Rechaza peticiones mayores a 10 KB (previene ataques DoS por payload) |
| **SQL Injection** | Queries parametrizadas | Todos los `pool.query` usan `$1, $2...` — nunca interpolación de strings |
| **CORS** | Origen restringido | Solo acepta peticiones de `FRONTEND_URL` definida en `.env` |
| **Inputs** | Validación en controller + Yup en frontend | Username: regex `^[a-zA-Z0-9_]+$`. Email: formato. Password: ≥8 chars. Notas: máx 500 chars |
| **Chat socket** | Límite de 300 chars | Mensajes más largos son rechazados con error antes de llegar a la BD |
| **Enumeración** | Mensaje genérico en login | Mismo `"Credenciales inválidas"` si el email no existe o si la contraseña es incorrecta |
| **Env vars** | Validación al arrancar | Si falta `JWT_SECRET`, `DB_*` o `GROQ_API_KEY`, el servidor no arranca y loguea qué falta |
| **Errores** | Error handler global | Nunca expone stack traces al cliente — solo `"Error interno del servidor"` con status 500 |
| **Frontend** | ErrorBoundary | Captura crashes de React y muestra pantalla amigable en lugar de pantalla en blanco |

### Lo que se decidió no implementar (por diseño)

| Item | Razón |
|---|---|
| Token en `httpOnly cookie` | La app usa Bearer token en header — no hay CSRF posible. localStorage es aceptable para una beta |
| Refresh token | El JWT dura 7 días. Para una beta es suficiente. Implementar revocación requiere una tabla de tokens en BD | — Apothicon HUD

El diseño imita la estética del HUD del mapa Shadows of Evil:
- **Fondo:** negro profundo (`#0a0010`)
- **Color primario:** púrpura Apothicon (`#aa3bff`) con efectos glow
- **Fuentes:** Orbitron (títulos HUD) + Share Tech Mono (datos, monospace)
- **Override global:** los inputs `type="number"` no muestran flechas nativas del navegador para mejor UX

### Layout de la página

```
┌─────────────────────────────────────────────────────┐
│               BO3-IA  //  SHADOWS OF EVIL           │
│                [usuario]        [logout]             │
├─────────────────────────────────────────────────────┤
│                  BriefingPanel                      │
│  Warnings (patrones) | Fortalezas | Tips SoE        │
├─────────────────────────────────────────────────────┤
│                   TrendPanel                        │
│  Overall trend | Métricas antigua vs reciente       │
├──────────────────────┬──────────────────────────────┤
│     GameForm         │       StatsPanel             │
│  (7 secciones)       │  (8 métricas + tips)         │
├──────────────────────┴──────────────────────────────┤
│                   ChartsPanel                       │
│  Rondas (línea) | Causas (barras) | Plataformas     │
├─────────────────────────────────────────────────────┤
│                   GameHistory                       │
│  Tabla con scroll: todas las partidas               │
└─────────────────────────────────────────────────────┘
```

### GameForm — 7 secciones

1. **Configuración** — Modo de juego, plataforma (PC/PS4/PS3) y personaje
2. **Situación al morir** — Ronda (1–255), zona y causa de muerte
3. **Perks al morir** — Checkboxes de los 7 perks disponibles en SoE
4. **Armas** — Selector dinámico con la lista oficial de armas de SoE: elige el arma, su nivel de PaP (0/1/2) y el AAT. Los AATs disponibles se filtran para no repetir los ya usados en otras armas
5. **Progresión** — Rituales completados (0–4) y buildables/items especiales
6. **Gobblegums** — Cuáles se usaron en esa partida
7. **Extras** — Puntos al morir (opcional) y notas libres (hasta 500 caracteres)

### GameHistory — Tabla interactiva con tooltips ricos

Al pasar el mouse sobre la **causa de muerte** aparece una tarjeta con:
- Emoji del enemigo + nombre + chip coloreado por peligrosidad (🟢Verde → 🔴Rojo)
- Descripción del comportamiento del enemigo
- Tips específicos para enfrentarlo
- Mejores armas para matarlo

Al pasar el mouse sobre el **número de perks** aparece una tarjeta con:
- Una fila por cada perk que tenías al morir
- Emoji + nombre coloreado + etiqueta de prioridad (ESENCIAL / ALTA / MEDIA / BAJA)
- Efecto exacto (ej: `HP: 100 → 250 (+150%)`)

### ChartsPanel — 3 gráficas (Recharts)

1. **Línea:** evolución de rondas en las últimas 20 partidas
2. **Barras:** distribución de causas de muerte
3. **Barras dobles:** ronda promedio y cantidad de partidas por plataforma *(solo aparece si hay datos en más de una plataforma)*

### Redux Toolkit — Estado en memoria

```ts
const gamesSlice = createSlice({
  name: 'games',
  initialState: { games: [] as Game[] },
  reducers: {
    addGame(state, action) {
      state.games.unshift(action.payload); // Inserta al inicio (más reciente primero)
    }
  }
});
```

### TanStack Query — Caché inteligente

```ts
return useMutation({
  mutationFn: (game) => saveGame(game),
  onSuccess: ({ game }) => {
    dispatch(addGame(game));                                     // Actualiza Redux
    queryClient.invalidateQueries({ queryKey: ['stats'] });     // Refresca StatsPanel
    queryClient.invalidateQueries({ queryKey: ['games'] });     // Refresca GameHistory y ChartsPanel
  },
});
```

---

### SessionPage — flujo de vistas

`SessionPage` tiene 5 vistas internas manejadas con un state `view`:

```
'home'   → Crear sala o ingresar código para unirse
'lobby'  → Sala de espera: lista de jugadores + botón de inicio (solo líder)
'game'   → Partida activa: tabs con [GameForm] y [ChatPanel con IA Groq]
'form'   → GameForm post-partida + indicador de progreso (X/total enviaron)
'stats'  → SessionStatsPanel: partidas por jugador + análisis Groq grupal
```

### ChatPanel — IA táctica en tiempo real

- Conecta con `POST /api/chat` enviando el mensaje + historial de la conversación
- El historial **nunca se pierde al cambiar de tab** — ambos panels (form + chat) están siempre montados con `display: none` cuando inactivos
- System prompt incluye toda la base de conocimiento SoE, zonas, enemigos y prioridades de supervivencia
- Respuestas adaptativas: 2-3 oraciones para preguntas simples, hasta 6-8 con pasos para análisis de build o crisis

### Validación de formularios (react-hook-form + Yup)

**LoginPage:** email válido + contraseña ≥8 chars con errores inline campo por campo.

**RegisterPage:** username (3-20 chars, regex alfanumérico), email, contraseña ≥8, confirmación con `oneOf`. Los errores aparecen en tiempo real sin necesidad de enviar el formulario.

---

## 12. Cómo correr el proyecto

### Pre-requisitos
- Node.js 18+
- PostgreSQL 14+ (en Windows: `C:\Program Files\PostgreSQL\18\bin`)

### 1. Crear la base de datos

```powershell
$env:PGPASSWORD = "tu_password"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE bo3_ia;"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d bo3_ia -f "ruta\al\proyecto\database\schema.sql"
```

### 2. Configurar variables de entorno

Crea `Backend/.env`:
```
PORT=3000
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=bo3_ia
JWT_SECRET=cambia_esto_por_una_cadena_larga_y_aleatoria
GROQ_API_KEY=tu_api_key_de_groq
GROQ_MODEL=llama-3.3-70b-versatile
```

Crea `Frontend/.env`:
```
VITE_API_URL=http://localhost:3000
```

### 3. Correr el backend

```bash
cd Backend
npm install
npm run dev
# → Servidor en http://localhost:3000
```

### 4. Correr el frontend

```bash
cd Frontend
npm install
npm run dev
# → App en http://localhost:5173
```

### Migrar una BD existente (versiones anteriores)

```powershell
$env:PGPASSWORD = "tu_password"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
& $psql -U postgres -d bo3_ia -f "database\migration_v2.sql"
& $psql -U postgres -d bo3_ia -f "database\migration_v3.sql"
& $psql -U postgres -d bo3_ia -f "database\migration_v4.sql"
& $psql -U postgres -d bo3_ia -f "database\migration_v5.sql"
& $psql -U postgres -d bo3_ia -f "database\migration_v6.sql"
& $psql -U postgres -d bo3_ia -f "database\migration_v7.sql"
& $psql -U postgres -d bo3_ia -f "database\migration_v8.sql"
```

---

### Tabla `sessions` — 8 columnas

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | ID numérico |
| `code` | VARCHAR(10) UNIQUE | Código de sala (ej: `XKGT4`) |
| `leader_id` | INT FK | Usuario que creó la sala |
| `status` | VARCHAR(20) | `waiting` → `in_progress` → `finished` |
| `max_players` | INT | Máximo de jugadores (default 4) |
| `created_at` | TIMESTAMP | Fecha de creación |
| `started_at` | TIMESTAMP | Cuándo comenzó la partida |
| `finished_at` | TIMESTAMP | Cuándo terminó la partida |

### Tabla `session_members` — 3 columnas

| Columna | Tipo | Descripción |
|---|---|---|
| `session_id` | INT FK | Referencia a `sessions.id` |
| `user_id` | INT FK | Referencia a `users.id` |
| `joined_at` | TIMESTAMP | Cuándo se unió el jugador |

> PK compuesta `(session_id, user_id)` — un usuario no puede estar dos veces en la misma sala.

### Tabla `session_messages` — 6 columnas

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | SERIAL PK | ID del mensaje |
| `session_id` | INT FK | Sala a la que pertenece |
| `user_id` | INT FK | Usuario que envió el mensaje |
| `username` | VARCHAR(50) | Nombre desnormalizado para evitar JOINs en tiempo real |
| `content` | TEXT | Contenido del mensaje (máx 300 chars, validado en socket) |
| `created_at` | TIMESTAMPTZ | Timestamp con zona horaria |

> Si instalas desde cero, solo necesitas `schema.sql` + las 10 migraciones en orden.

---

## 13. Variables de entorno

| Variable | Archivo | Descripción |
|---|---|---|
| `PORT` | Backend/.env | Puerto del servidor Express |
| `FRONTEND_URL` | Backend/.env | URL del frontend para CORS |
| `DB_HOST` | Backend/.env | Dirección del servidor PostgreSQL |
| `DB_PORT` | Backend/.env | Puerto de PostgreSQL (5432 por defecto) |
| `DB_USER` | Backend/.env | Usuario de PostgreSQL |
| `DB_PASSWORD` | Backend/.env | Contraseña de PostgreSQL |
| `DB_NAME` | Backend/.env | Nombre de la base de datos |
| `JWT_SECRET` | Backend/.env | Clave secreta para firmar y verificar tokens JWT (**requerida** — el servidor no arranca sin ella) |
| `GROQ_API_KEY` | Backend/.env | API key de Groq para el chat IA y los resúmenes grupales (**requerida**) |
| `GROQ_MODEL` | Backend/.env | Modelo de Groq a usar (default: `llama-3.3-70b-versatile`) |
| `VITE_API_URL` | Frontend/.env | URL del backend (usada por Axios y Socket.io) |

> El archivo `.env` **nunca se sube a GitHub**. Nunca metas contraseñas en el código.

> En producción, `JWT_SECRET` debe ser una cadena aleatoria larga (mínimo 32 caracteres). Podés generar una con `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 14. Glosario para principiantes

| Término | Explicación simple |
|---|---|
| **API** | Conjunto de URLs que el backend expone para que el frontend las consuma |
| **REST** | Estilo de diseño de APIs usando HTTP (GET, POST, PUT, DELETE) |
| **JSON** | Formato de texto para intercambiar datos: `{ "clave": "valor" }` |
| **JSONB** | JSON binario en PostgreSQL — guarda objetos complejos y permite hacer queries sobre su contenido |
| **TypeScript** | JavaScript con tipos. Avisa errores antes de ejecutar el código |
| **Interface** | En TypeScript, define la "forma" que debe tener un objeto |
| **Pool** | Grupo de conexiones reutilizables a la base de datos |
| **Middleware** | Función que se ejecuta antes de llegar al controlador (ej: `express.json()`) |
| **Redux** | Librería para manejar estado global en React (como la RAM de la app) |
| **Query** | Consulta SQL para pedir datos a la base de datos |
| **Mutation** | En TanStack Query, una operación que modifica datos (POST, PUT, DELETE) |
| **Endpoint** | Una URL específica de la API (ej: `/api/games`) |
| **CORS** | Política de seguridad del navegador — hay que configurarlo para que el frontend pueda hablar con el backend |
| **dotenv** | Librería que carga las variables del archivo `.env` |
| **Migration** | Script SQL que modifica una tabla existente sin borrar los datos |
| **SERIAL** | Tipo de columna en PostgreSQL que se auto-incrementa (1, 2, 3...) |
| **Clamp** | Forzar un valor dentro de un rango: `Math.min(Math.max(valor, min), max)` |
| **PaP** | Pack-a-Punch — máquina que mejora las armas. Primer upgrade: 5000 pts. Segundo: 2500 pts |
| **AAT** | Ammo Mod Type — efecto elemental que se obtiene al hacer PaP (Dead Wire, Blast Furnace, etc.) |
| **Buildable** | Objeto que se construye recolectando piezas en el mapa (Apothicon Servant, Rocket Shield, etc.) |
| **Tooltip** | Tarjeta flotante que aparece al pasar el mouse sobre un elemento |
| **TanStack Query** | Librería que maneja peticiones HTTP con caché automático en React |
| **Recharts** | Librería de gráficas para React basada en SVG |
| **JWT** | JSON Web Token — credencial cifrada que el backend emite al hacer login. El frontend la guarda y la manda en cada petición en el header `Authorization: Bearer <token>` |
| **Bearer token** | Formato de autenticación HTTP: `Authorization: Bearer eyJ...` |
| **Hash** | Transformación irreversible de una contraseña. bcryptjs hashea con 12 rondas de sal — aunque alguien robe la BD no puede recuperar la contraseña original |
| **Salt** | Dato aleatorio que se mezcla con la contraseña antes de hashear — hace que dos contraseñas iguales tengan hashes distintos |
| **localStorage** | Almacenamiento del navegador que persiste al cerrar la pestaña. El token JWT se guarda aquí para recordar la sesión |
| **ProtectedRoute** | Componente que verifica si hay token antes de mostrar una página — si no hay, redirige al login |
| **Middleware** | En Express, función que intercepta la petición antes del controlador (ej: `requireAuth` verifica el token) |
| **Briefing** | Análisis pre-partida combinando conocimiento curado de SoE + tus patrones detectados por SQL |
| **Knowledge base** | Base de conocimiento estática — 25 entradas curadas sobre SoE: estrategias, enemigos, armas, zonas |
| **Interceptor** | En axios, función que se ejecuta automáticamente en cada petición. Aquí: agrega el header `Authorization: Bearer <token>` sin tener que escribirlo en cada llamada |
| **Socket.io** | Librería de comunicación bidireccional en tiempo real. El servidor puede enviar datos al cliente sin que el cliente haga un GET — fundamental para el chat y la sincronización de la sala |
| **Groq** | API de inferencia de LLMs con velocidad muy alta (tokens/segundo). Aquí se usa para el chat táctico en tiempo real y el resumen grupal al terminar la sesión |
| **LLM** | Large Language Model — modelo de lenguaje como llama-3.3-70b. Recibe texto (system prompt + historial) y genera una respuesta |
| **max_tokens** | Límite de tokens que puede generar el modelo en una respuesta. 600 tokens ≈ ~450 palabras |
| **System prompt** | Instrucciones fijas al inicio de cada conversación que definen el rol y las reglas del asistente |
| **Helmet** | Middleware de Express que configura ~15 headers HTTP de seguridad: CSP, X-Frame-Options, HSTS, etc. |
| **Rate limiting** | Limitar cuántas peticiones puede hacer una IP en un intervalo de tiempo. Protege contra brute force |
| **Yup** | Librería de validación de esquemas. Define reglas (`string().min(8).required()`) y valida objetos contra ellas |
| **React Hook Form** | Librería de formularios para React. Usa refs en lugar de state para máximo rendimiento. Integra con Yup via `yupResolver` |
| **Error Boundary** | Componente React especial (clase) que captura errores de renderizado en sus hijos y muestra una pantalla de error en lugar de dejar la app en blanco |
| **Graceful shutdown** | Cerrar el servidor correctamente al recibir SIGTERM: terminar peticiones en curso, cerrar el pool de DB y luego salir |
