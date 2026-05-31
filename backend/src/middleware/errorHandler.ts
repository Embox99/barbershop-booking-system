import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Prisma known errors
  if ((err as any).code === "P2002") {
    res.status(400).json({ error: "A record with this value already exists" });
    return;
  }
  if ((err as any).code === "P2025") {
    res.status(404).json({ error: "Record not found" });
    return;
  }

  console.error("[Unhandled Error]", err);
  res.status(500).json({
    error: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message,
  });
};
