import { Router } from "express";
import validate from "../../common/middleware/validate.middleware.js";
import * as controller from "./auth.controller.js"
import RegisterDto from "./dto/register.dto.js"
import { authenticate } from "./auth.middleware.js";
import resetPasswordDto from "./dto/resetPassword.dto.js";
import forgotPasswordDto from "./dto/forgotPassword.dto.js";
import LoginDto from "./dto/login.dto.js";

const router = Router();

router.post("/register", validate(RegisterDto), controller.register);
router.post("/login", validate(LoginDto), controller.login);
router.post("/logout", authenticate, controller.logout);
router.post("/refresh", controller.refresh);
router.get("/verify-email/:token", controller.verifyEmail);
router.put("/reset-password/:token", validate(resetPasswordDto), controller.resetPassword);
router.post("/forgot-password", validate(forgotPasswordDto), controller.forgotPassword);
router.get("/me", authenticate, controller.getMe);

export default router