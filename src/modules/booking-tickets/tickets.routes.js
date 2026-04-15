import { Router } from "express";
import * as controller from "./tickets.controller.js"
import { authenticate } from "../auth/auth.middleware.js";


const router = Router();

router.get("/tickets/me", authenticate, controller.getTickets);
router.delete("/tickets/:id", authenticate, controller.deleteTicket);

export default router