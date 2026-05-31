import { Router } from "express";
import { getAllServices } from "../controllers/serviceController";
import {
  cancelMyAppointment,
  createAppointment,
  getAllBarbers,
  getAvailableSlots,
  getMyHistory,
} from "../controllers/appointmentController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/services", getAllServices);
router.get("/slots", getAvailableSlots);
router.get("/barbers", getAllBarbers);

router.post("/appointments", authMiddleware, createAppointment as any);
router.get("/appointments", authMiddleware, getMyHistory as any);
router.patch("/appointments/:id/cancel", authMiddleware, cancelMyAppointment as any);

export default router;
