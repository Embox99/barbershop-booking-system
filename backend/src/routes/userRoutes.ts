import { Router } from "express";
import {
  getMe,
  requestOtp,
  updateProfile,
  verifyOtp,
} from "../controllers/userController";
import { authMiddleware } from "../middleware/authMiddleware";
import { loginLimiter, otpLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/otp", otpLimiter, requestOtp);
router.post("/login", loginLimiter, verifyOtp);
router.put("/profile", authMiddleware, updateProfile);
router.get("/me", authMiddleware, getMe);

export default router;
