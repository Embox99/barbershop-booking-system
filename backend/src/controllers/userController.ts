import { Request, Response } from "express";
import prisma from "../prismaClient";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 10;

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  phone: true,
  role: true,
} as const;

export const requestOtp = async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
    res.status(400).json({ error: "Valid phone number is required" });
    return;
  }

  try {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashedCode = await bcrypt.hash(code, BCRYPT_ROUNDS);

    await prisma.user.upsert({
      where: { phone: phone.trim() },
      update: { otpCode: hashedCode, otpExpires: expiresAt },
      create: { phone: phone.trim(), otpCode: hashedCode, otpExpires: expiresAt },
    });

    // REPLACE WITH REAL SMS API (e.g. Twilio)
    console.log(`🔑 SMS for ${phone}: ${code}`);
    res.json({ message: "Code sent" });
  } catch (error) {
    res.status(500).json({ error: "Error sending code" });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    res.status(400).json({ error: "Phone and code are required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { phone: String(phone).trim() },
    });

    if (!user || !user.otpCode) {
      res.status(400).json({ error: "Invalid code or phone" });
      return;
    }
    if (user.otpExpires && new Date() > user.otpExpires) {
      res.status(400).json({ error: "Code expired" });
      return;
    }

    const isMatch = await bcrypt.compare(String(code), user.otpCode);
    if (!isMatch) {
      res.status(400).json({ error: "Invalid code or phone" });
      return;
    }

    // Clear OTP and return only safe fields
    const cleanUser = await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpires: null },
      select: PUBLIC_USER_SELECT,
    });

    const token = generateToken(cleanUser.id);
    res.json({ token, user: cleanUser });
  } catch (error) {
    res.status(500).json({ error: "Error verifying code" });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  const userId = req.userId;
  const { name } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "Name must be at least 2 characters" });
    return;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
      select: PUBLIC_USER_SELECT,
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Couldn't update profile" });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.sendStatus(401);
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });
    if (!user) {
      res.sendStatus(404);
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
