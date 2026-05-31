import { Request, Response } from "express";
import prisma from "../prismaClient";
import { AppointmentStatus } from "@prisma/client";

const PAGE_SIZE = 20;

export const getAllAppointments = async (req: Request, res: Response) => {
  const { date, page = "1" } = req.query;
  const pageNum = Math.max(1, Number(page));

  try {
    let whereClause: any = {};

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
        res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
        return;
      }
      const searchDate = new Date(date as string);
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause = { dateTime: { gte: startOfDay, lte: endOfDay } };
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: whereClause,
        orderBy: { dateTime: "asc" },
        include: { user: true, barber: true, service: true },
        skip: (pageNum - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.appointment.count({ where: whereClause }),
    ]);

    res.json({
      data: appointments,
      pagination: {
        total,
        page: pageNum,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching appointments" });
  }
};

export const updateAppointmentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = Object.values(AppointmentStatus);
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Allowed: ${validStatuses.join(", ")}` });
    return;
  }
  if (isNaN(Number(id))) {
    res.status(400).json({ error: "Invalid appointment id" });
    return;
  }

  try {
    const updatedAppointment = await prisma.appointment.update({
      where: { id: Number(id) },
      data: { status },
      include: { user: true, service: true },
    });
    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ error: "Failed to update status" });
  }
};

export const getBarbers = async (req: Request, res: Response) => {
  try {
    const barbers = await prisma.user.findMany({
      where: { role: "barber" },
      select: { id: true, name: true, phone: true },
      orderBy: { id: "desc" },
    });
    res.json(barbers);
  } catch (error) {
    res.status(500).json({ error: "Error fetching barbers list" });
  }
};

export const createBarber = async (req: Request, res: Response) => {
  const { name, phone } = req.body;
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "Name must be at least 2 characters" });
    return;
  }
  if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
    res.status(400).json({ error: "Valid phone number is required" });
    return;
  }
  try {
    const newBarber = await prisma.user.create({
      data: { name: name.trim(), phone: phone.trim(), role: "barber" },
    });
    res.json(newBarber);
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(400).json({ error: "User with this phone already exists" });
    } else {
      res.status(500).json({ error: "Error creating barber" });
    }
  }
};

export const updateBarber = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  if (!id || isNaN(Number(id))) {
    res.status(400).json({ error: "Invalid barber id" });
    return;
  }
  if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
    res.status(400).json({ error: "Name must be at least 2 characters" });
    return;
  }
  if (phone !== undefined && (typeof phone !== "string" || phone.trim().length < 7)) {
    res.status(400).json({ error: "Valid phone number is required" });
    return;
  }
  const data: any = {};
  if (name) data.name = name.trim();
  if (phone) data.phone = phone.trim();
  try {
    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data,
      select: { id: true, name: true, phone: true },
    });
    res.json(updated);
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(400).json({ error: "Phone already in use" });
    } else {
      res.status(500).json({ error: "Error updating barber" });
    }
  }
};

export const deleteBarber = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    res.status(400).json({ error: "Invalid barber id" });
    return;
  }
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Failed to delete. The barber might have active appointments." });
  }
};

export const createService = async (req: Request, res: Response) => {
  const { name, description, price, duration } = req.body;
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "Service name must be at least 2 characters" });
    return;
  }
  if (!price || isNaN(Number(price)) || Number(price) <= 0) {
    res.status(400).json({ error: "Price must be a positive number" });
    return;
  }
  if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
    res.status(400).json({ error: "Duration must be a positive number" });
    return;
  }
  try {
    const service = await prisma.service.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: Number(price),
        duration: Number(duration),
      },
    });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: "Error creating service" });
  }
};

export const updateService = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, duration } = req.body;
  if (!id || isNaN(Number(id))) {
    res.status(400).json({ error: "Invalid service id" });
    return;
  }
  const data: any = {};
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      res.status(400).json({ error: "Name must be at least 2 characters" });
      return;
    }
    data.name = name.trim();
  }
  if (description !== undefined) data.description = description?.trim() || null;
  if (price !== undefined) {
    if (isNaN(Number(price)) || Number(price) <= 0) {
      res.status(400).json({ error: "Price must be a positive number" });
      return;
    }
    data.price = Number(price);
  }
  if (duration !== undefined) {
    if (isNaN(Number(duration)) || Number(duration) <= 0) {
      res.status(400).json({ error: "Duration must be a positive number" });
      return;
    }
    data.duration = Number(duration);
  }
  try {
    const updated = await prisma.service.update({
      where: { id: Number(id) },
      data,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error updating service" });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || isNaN(Number(id))) {
    res.status(400).json({ error: "Invalid service id" });
    return;
  }
  try {
    await prisma.service.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Cannot delete service with existing appointments" });
  }
};
