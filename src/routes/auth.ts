import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { AppError } from "../middleware/error.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "automatch-dev-secret-change-in-production";

const registerSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

router.post("/register", async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new AppError(409, "Email já cadastrado");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(401, "Email ou senha inválidos");
    }

    const valid = await bcrypt.compare(data.password, user.password);

    if (!valid) {
      throw new AppError(401, "Email ou senha inválidos");
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
});

export default router;
