import { Router } from "express";
import {
  createBarber, createService, deleteBarber, deleteService,
  getAllAppointments, getBarbers, updateAppointmentStatus,
  updateBarber, updateService,
} from "../controllers/adminController";
import { getStats } from "../controllers/statsController";
import { authMiddleware, requireAdmin } from "../middleware/authMiddleware";

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get("/stats", getStats);

router.get("/appointments", getAllAppointments);
router.put("/appointments/:id", updateAppointmentStatus);

router.get("/barbers", getBarbers);
router.post("/barbers", createBarber);
router.patch("/barbers/:id", updateBarber);
router.delete("/barbers/:id", deleteBarber);

router.post("/services", createService);
router.patch("/services/:id", updateService);
router.delete("/services/:id", deleteService);

export default router;
