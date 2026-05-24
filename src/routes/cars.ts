import { Router } from "express";
import prisma from "../lib/prisma.js";

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

router.get("/", async (_req, res, next) => {
  try {
    const cars = await prisma.car.findMany();
    res.json(cars.map(formatCar));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const car = await prisma.car.findUnique({
      where: { id: req.params.id },
    });

    if (!car) {
      res.status(404).json({ error: "Carro não encontrado" });
      return;
    }

    res.json(formatCar(car));
  } catch (err) {
    next(err);
  }
});

export default router;
