import { Request, Response } from "express";
import prisma from "../prismaClient";

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
      },
      orderBy: { createdAt: "asc" },
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: "Couldn't get services" });
  }
};
