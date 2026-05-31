import { Request, Response } from "express";
import prisma from "../prismaClient";
import { AuthRequest } from "../middleware/authMiddleware";
import { minutesToTime, timeToMinutes } from "../utils/utils";

export const createAppointment = async (req: AuthRequest, res: Response) => {
  const { serviceId, dateTime, barberId } = req.body;
  const userId = req.userId;

  if (!barberId || isNaN(Number(barberId))) {
    res.status(400).json({ error: "You need to choose a barber" });
    return;
  }
  if (!serviceId || isNaN(Number(serviceId))) {
    res.status(400).json({ error: "You need to choose a service" });
    return;
  }
  if (!dateTime) {
    res.status(400).json({ error: "dateTime is required" });
    return;
  }
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const dateObj = new Date(dateTime);
  if (isNaN(dateObj.getTime())) {
    res.status(400).json({ error: "Invalid dateTime format" });
    return;
  }
  if (dateObj < new Date()) {
    res.status(400).json({ error: "Cannot book an appointment in the past" });
    return;
  }

  try {
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        dateTime: dateObj,
        barberId: Number(barberId),
        status: { not: "cancelled" },
      },
    });
    if (existingAppointment) {
      res.status(400).json({ error: "This time slot is already booked" });
      return;
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: Number(userId),
        serviceId: Number(serviceId),
        barberId: Number(barberId),
        dateTime: dateObj,
        status: "pending",
      },
      include: { service: true, user: true, barber: true },
    });

    res.json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating appointment" });
  }
};

export const getMyHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: Number(userId) },
      include: { service: true, barber: true },
      orderBy: { dateTime: "desc" },
    });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Error loading history" });
  }
};

export const cancelMyAppointment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!id || isNaN(Number(id))) {
    res.status(400).json({ error: "Invalid appointment id" });
    return;
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(id) },
    });

    if (!appointment) {
      res.status(404).json({ error: "Appointment not found" });
      return;
    }
    // Ownership check — client can only cancel their own appointments
    if (appointment.userId !== userId) {
      res.status(403).json({ error: "You can only cancel your own appointments" });
      return;
    }
    if (appointment.status === "cancelled") {
      res.status(400).json({ error: "Appointment is already cancelled" });
      return;
    }
    // Prevent cancelling past appointments
    if (appointment.dateTime < new Date()) {
      res.status(400).json({ error: "Cannot cancel a past appointment" });
      return;
    }

    const updated = await prisma.appointment.update({
      where: { id: Number(id) },
      data: { status: "cancelled" },
      include: { service: true, barber: true },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error cancelling appointment" });
  }
};

export const getAvailableSlots = async (req: Request, res: Response) => {
  const { date, serviceId, barberId } = req.query;

  if (!date || !serviceId || !barberId) {
    res.status(400).json({ error: "Missing parameters" });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
    res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    return;
  }

  try {
    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
    });
    if (!service) {
      res.status(404).json({ error: "Service not found" });
      return;
    }

    const serviceDuration = service.duration;
    const WORK_START = timeToMinutes(process.env.WORK_START || "10:00");
    const WORK_END = timeToMinutes(process.env.WORK_END || "20:00");
    const STEP = Number(process.env.SLOT_STEP_MINUTES) || 15;

    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const appointments = await prisma.appointment.findMany({
      where: {
        barberId: Number(barberId),
        dateTime: { gte: startOfDay, lte: endOfDay },
        status: { in: ["confirmed", "pending"] },
      },
      include: { service: true },
    });

    const busyIntervals = appointments.map((app) => {
      const appDate = new Date(app.dateTime);
      const startMinutes = appDate.getUTCHours() * 60 + appDate.getUTCMinutes();
      return { start: startMinutes, end: startMinutes + app.service.duration };
    });

    const availableSlots: string[] = [];
    for (
      let currentTime = WORK_START;
      currentTime + serviceDuration <= WORK_END;
      currentTime += STEP
    ) {
      const potentialEnd = currentTime + serviceDuration;
      const isCollision = busyIntervals.some(
        (busy) => currentTime < busy.end && potentialEnd > busy.start
      );
      if (!isCollision) {
        availableSlots.push(minutesToTime(currentTime));
      }
    }

    res.json(availableSlots);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error calculating slots" });
  }
};

export const getAllBarbers = async (req: Request, res: Response) => {
  try {
    const barbers = await prisma.user.findMany({
      where: { role: "barber" },
      select: { id: true, name: true },
    });
    res.json(barbers);
  } catch (error) {
    res.status(500).json({ error: "Error fetching barbers" });
  }
};
