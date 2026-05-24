import { Router } from "express";
import { z } from "zod";
import prisma from "../../lib/prisma.js";
import { requireAdmin } from "../../middleware/auth.js";
import { AppError } from "../../middleware/error.js";

const router = Router();

function formatCar(row: any) {
  return {
    id: row.id,
    name: row.name,
    year: row.year,
    price: row.price,
    category: row.category,
    specs: {
      engine: row.engine,
      power: row.power,
      consumption: row.consumption,
      weight: row.weight,
    },
    costs: {
      ipva: row.ipva,
      insurance: row.insurance,
      maintenance: row.maintenance,
    },
    features: JSON.parse(row.features),
    images: {
      main: row.mainImage,
      thumbnails: JSON.parse(row.thumbnailImages),
    },
  };
}

const carSchema = z.object({
  id: z.string().min(1, "ID é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  year: z.number().int(),
  price: z.number().min(0),
  category: z.string().min(1, "Categoria é obrigatória"),
  specs: z.object({
    engine: z.string(),
    power: z.string(),
    consumption: z.string(),
    weight: z.string(),
  }),
  costs: z.object({
    ipva: z.number(),
    insurance: z.number(),
    maintenance: z.number(),
  }),
  features: z.array(z.string()),
  images: z.object({
    main: z.string(),
    thumbnails: z.array(z.string()),
  }),
});

router.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const cars = await prisma.car.findMany();
    res.json(cars.map(formatCar));
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const data = carSchema.parse(req.body);

    const existing = await prisma.car.findUnique({ where: { id: data.id } });
    if (existing) {
      throw new AppError(409, "Carro com este ID já existe");
    }

    const car = await prisma.car.create({
      data: {
        id: data.id,
        name: data.name,
        year: data.year,
        price: data.price,
        category: data.category,
        engine: data.specs.engine,
        power: data.specs.power,
        consumption: data.specs.consumption,
        weight: data.specs.weight,
        ipva: data.costs.ipva,
        insurance: data.costs.insurance,
        maintenance: data.costs.maintenance,
        features: JSON.stringify(data.features),
        mainImage: data.images.main,
        thumbnailImages: JSON.stringify(data.images.thumbnails),
      },
    });

    res.status(201).json(formatCar(car));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
});

router.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.car.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) {
      throw new AppError(404, "Carro não encontrado");
    }

    const data = carSchema.omit({ id: true }).parse(req.body);

    const car = await prisma.car.update({
      where: { id: String(req.params.id) },
      data: {
        name: data.name,
        year: data.year,
        price: data.price,
        category: data.category,
        engine: data.specs.engine,
        power: data.specs.power,
        consumption: data.specs.consumption,
        weight: data.specs.weight,
        ipva: data.costs.ipva,
        insurance: data.costs.insurance,
        maintenance: data.costs.maintenance,
        features: JSON.stringify(data.features),
        mainImage: data.images.main,
        thumbnailImages: JSON.stringify(data.images.thumbnails),
      },
    });

    res.json(formatCar(car));
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.issues[0].message });
      return;
    }
    next(err);
  }
});

router.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.car.findUnique({ where: { id: String(req.params.id) } });
    if (!existing) {
      throw new AppError(404, "Carro não encontrado");
    }

    await prisma.savedMatch.deleteMany({ where: { carId: String(req.params.id) } });
    await prisma.car.delete({ where: { id: String(req.params.id) } });

    res.status(204).send();
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

export default router;
