import { Router } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../middleware/error.js";

const router = Router();

const createMatchSchema = z.object({
  carId: z.string().min(1, "carId é obrigatório"),
  matchPercentage: z.number().min(0).max(100),
});

function formatMatch(row: any) {
  return {
    id: row.id,
    car: {
      id: row.car.id,
      name: row.car.name,
      year: row.car.year,
      price: row.car.price,
      category: row.car.category,
      specs: {
        engine: row.car.engine,
        power: row.car.power,
        consumption: row.car.consumption,
        weight: row.car.weight,
      },
      costs: {
        ipva: row.car.ipva,
        insurance: row.car.insurance,
        maintenance: row.car.maintenance,
      },
      features: JSON.parse(row.car.features),
      images: {
        main: row.car.mainImage,
        thumbnails: JSON.parse(row.car.thumbnailImages),
      },
    },
    savedAt: row.savedAt,
    matchPercentage: row.matchPercentage,
  };
}

router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const matches = await prisma.savedMatch.findMany({
      where: { userId: req.userId! },
      include: { car: true },
      orderBy: { savedAt: "desc" },
    });

    res.json(matches.map(formatMatch));
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = createMatchSchema.parse(req.body);

    const car = await prisma.car.findUnique({
      where: { id: data.carId },
    });

    if (!car) {
      throw new AppError(404, "Carro não encontrado");
    }

    const existing = await prisma.savedMatch.findUnique({
      where: {
        userId_carId: {
          userId: req.userId!,
          carId: data.carId,
        },
      },
    });

    if (existing) {
      throw new AppError(409, "Match já salvo");
    }

    const match = await prisma.savedMatch.create({
      data: {
        userId: req.userId!,
        carId: data.carId,
        matchPercentage: data.matchPercentage,
      },
      include: { car: true },
    });

    res.status(201).json(formatMatch(match));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const match = await prisma.savedMatch.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!match) {
      throw new AppError(404, "Match não encontrado");
    }

    if (match.userId !== req.userId) {
      throw new AppError(403, "Não autorizado");
    }

    await prisma.savedMatch.delete({
      where: { id: String(req.params.id) },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
