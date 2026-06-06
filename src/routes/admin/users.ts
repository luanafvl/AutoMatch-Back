import { Router } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma.js";
import { requireAdmin, AuthRequest } from "../../middleware/auth.js";
import { AppError } from "../../middleware/error.js";

const router = Router();

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        surname: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    next(err);
  }
});

const roleSchema = z.object({
  role: z.enum(["USER", "ADMIN"], { message: "Role deve ser USER ou ADMIN" }),
});

router.put("/:id/role", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { role } = roleSchema.parse(req.body);

    const targetId = String(req.params.id);

    if (targetId === req.userId) {
      throw new AppError(400, "Você não pode alterar sua própria role");
    }

    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) {
      throw new AppError(404, "Usuário não encontrado");
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { role },
      select: {
        id: true,
        firstName: true,
        surname: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
});

export default router;
