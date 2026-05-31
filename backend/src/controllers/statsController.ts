import { Request, Response } from "express";
import prisma from "../prismaClient";

export const getStats = async (req: Request, res: Response) => {
  try {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const weekStart = new Date(now);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);
    weekStart.setUTCHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [
      todayAppointments,
      weekAppointments,
      monthAppointments,
      barberLoad,
      topService,
      totalClients,
    ] = await Promise.all([
      // Today's appointments (non-cancelled)
      prisma.appointment.count({
        where: {
          dateTime: { gte: todayStart, lte: todayEnd },
          status: { not: "cancelled" },
        },
      }),

      // This week's confirmed appointments with service price
      prisma.appointment.findMany({
        where: {
          dateTime: { gte: weekStart },
          status: "confirmed",
        },
        include: { service: { select: { price: true } } },
      }),

      // This month's confirmed appointments with service price
      prisma.appointment.findMany({
        where: {
          dateTime: { gte: monthStart },
          status: "confirmed",
        },
        include: { service: { select: { price: true } } },
      }),

      // Per-barber load this week
      prisma.appointment.groupBy({
        by: ["barberId"],
        where: {
          dateTime: { gte: weekStart },
          status: { not: "cancelled" },
        },
        _count: { id: true },
      }),

      // Most popular service all time
      prisma.appointment.groupBy({
        by: ["serviceId"],
        where: { status: { not: "cancelled" } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      }),

      // Total unique clients
      prisma.user.count({ where: { role: "client" } }),
    ]);

    // Resolve barber names
    const barberIds = barberLoad.map((b) => b.barberId);
    const barbers = await prisma.user.findMany({
      where: { id: { in: barberIds } },
      select: { id: true, name: true },
    });
    const barberMap = Object.fromEntries(barbers.map((b) => [b.id, b.name]));

    // Resolve top service name
    let topServiceName = null;
    if (topService[0]) {
      const svc = await prisma.service.findUnique({
        where: { id: topService[0].serviceId },
        select: { name: true },
      });
      topServiceName = svc?.name ?? null;
    }

    const weekRevenue = weekAppointments.reduce((sum, a) => sum + a.service.price, 0);
    const monthRevenue = monthAppointments.reduce((sum, a) => sum + a.service.price, 0);

    res.json({
      today: { appointments: todayAppointments },
      week: { revenue: weekRevenue, appointments: weekAppointments.length },
      month: { revenue: monthRevenue, appointments: monthAppointments.length },
      topService: topServiceName,
      totalClients,
      barberLoad: barberLoad.map((b) => ({
        barberId: b.barberId,
        name: barberMap[b.barberId] ?? "Unknown",
        appointments: b._count.id,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching stats" });
  }
};
