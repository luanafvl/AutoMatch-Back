import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { AppError } from "../middleware/error.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "automatch-dev-secret-change-in-production";

const registerSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  surname: z.string().optional().default(""),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  surname: z.string().optional().default(""),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
});

const updateAvatarSchema = z.object({
  avatarUrl: z.string().min(1, "Imagem inválida"),
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
        firstName: data.firstName,
        surname: data.surname,
        email: data.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        firstName: true,
        surname: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        surname: user.surname,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
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
      select: {
        id: true,
        firstName: true,
        surname: true,
        email: true,
        password: true,
        role: true,
        avatarUrl: true,
      },
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
        firstName: user.firstName,
        surname: user.surname,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
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

router.put("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    if (!req.userId) {
      throw new AppError(401, "Token inválido ou expirado");
    }

    const existing = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id: req.userId },
      },
    });

    if (existing) {
      throw new AppError(409, "Email já cadastrado");
    }

    const updateData: {
      firstName: string;
      surname: string;
      email: string;
      password?: string;
    } = {
      firstName: data.firstName,
      surname: data.surname,
      email: data.email,
    };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        surname: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
});

router.put("/me/avatar", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = updateAvatarSchema.parse(req.body);

    if (!req.userId) {
      throw new AppError(401, "Token inválido ou expirado");
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { avatarUrl: data.avatarUrl },
      select: {
        id: true,
        firstName: true,
        surname: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
});

export default router;
