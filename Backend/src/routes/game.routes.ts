import { Router } from "express";
import { saveGame, getGames, getStats } from "../controllers/game.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/games", requireAuth, saveGame);
router.get("/games", requireAuth, getGames);
router.get("/stats", requireAuth, getStats);

export default router;