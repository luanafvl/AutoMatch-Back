"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const router = (0, express_1.Router)();
function formatCar(row) {
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
        const cars = await prisma_js_1.default.car.findMany();
        res.json(cars.map(formatCar));
    }
    catch (err) {
        next(err);
    }
});
router.get("/:id", async (req, res, next) => {
    try {
        const car = await prisma_js_1.default.car.findUnique({
            where: { id: req.params.id },
        });
        if (!car) {
            res.status(404).json({ error: "Carro não encontrado" });
            return;
        }
        res.json(formatCar(car));
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=cars.js.map