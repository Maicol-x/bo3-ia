import express from "express";
import type { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import gameRoutes from "./routes/game.routes.js";
import authRoutes from "./routes/auth.routes.js";
import briefingRoutes from "./routes/briefing.routes.js";
import trendRoutes from "./routes/trend.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import userRoutes from "./routes/user.routes.js";
import { registerSessionSocket } from "./sockets/session.socket.js";

dotenv.config();

// ── Validar variables de entorno requeridas antes de arrancar ─────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'GROQ_API_KEY'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`[STARTUP ERROR] Variables de entorno faltantes: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  },
});

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

// Rate limiting: máximo 20 intentos cada 15 minutos en rutas de auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
});
app.use('/api/auth', authLimiter);

// Rate limiting general: 200 req/min por IP en el resto de la API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intentá de nuevo en un momento.' },
});
app.use('/api', apiLimiter);

app.use("/api", authRoutes);
app.use("/api", gameRoutes);
app.use("/api", briefingRoutes);
app.use("/api", trendRoutes);
app.use("/api", sessionRoutes);
app.use("/api", chatRoutes);
app.use("/api", userRoutes);

registerSessionSocket(io);

// ── 404 para rutas API desconocidas ───────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Error handler global (debe ir ÚLTIMO) ─────────────────────────────────────
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err);
  const status =
    err instanceof Error && 'status' in err
      ? (err as Error & { status: number }).status
      : 500;
  res.status(status).json({ error: 'Error interno del servidor' });
});

httpServer.listen(3000, () => {
  console.log("Servidor corriendo en puerto 3000");
});