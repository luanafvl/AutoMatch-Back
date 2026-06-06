"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = __importDefault(require("../../lib/prisma.js"));
const auth_js_1 = require("../../middleware/auth.js");
const error_js_1 = require("../../middleware/error.js");
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
const carSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, "ID é obrigatório"),
    name: zod_1.z.string().min(1, "Nome é obrigatório"),
    year: zod_1.z.number().int(),
    price: zod_1.z.number().min(0),
    category: zod_1.z.string().min(1, "Categoria é obrigatória"),
    specs: zod_1.z.object({
        engine: zod_1.z.string(),
        power: zod_1.z.string(),
        consumption: zod_1.z.string(),
        weight: zod_1.z.string(),
    }),
    costs: zod_1.z.object({
        ipva: zod_1.z.number(),
        insurance: zod_1.z.number(),
        maintenance: zod_1.z.number(),
    }),
    features: zod_1.z.array(zod_1.z.string()),
    images: zod_1.z.object({
        main: zod_1.z.string(),
        thumbnails: zod_1.z.array(zod_1.z.string()),
    }),
});
router.get("/", auth_js_1.requireAdmin, async (_req, res, next) => {
    try {
        const cars = await prisma_js_1.default.car.findMany();
        res.json(cars.map(formatCar));
    }
    catch (err) {
        next(err);
    }
});
router.post("/", auth_js_1.requireAdmin, async (req, res, next) => {
    try {
        const data = carSchema.parse(req.body);
        const existing = await prisma_js_1.default.car.findUnique({ where: { id: data.id } });
        if (existing) {
            throw new error_js_1.AppError(409, "Carro com este ID já existe");
        }
        const car = await prisma_js_1.default.car.create({
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
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.issues[0].message });
            return;
        }
        next(err);
    }
});
router.put("/:id", auth_js_1.requireAdmin, async (req, res, next) => {
    try {
        const existing = await prisma_js_1.default.car.findUnique({ where: { id: String(req.params.id) } });
        if (!existing) {
            throw new error_js_1.AppError(404, "Carro não encontrado");
        }
        const data = carSchema.omit({ id: true }).parse(req.body);
        const car = await prisma_js_1.default.car.update({
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
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.issues[0].message });
            return;
        }
        next(err);
    }
});
router.delete("/:id", auth_js_1.requireAdmin, async (req, res, next) => {
    try {
        const existing = await prisma_js_1.default.car.findUnique({ where: { id: String(req.params.id) } });
        if (!existing) {
            throw new error_js_1.AppError(404, "Carro não encontrado");
        }
        await prisma_js_1.default.savedMatch.deleteMany({ where: { carId: String(req.params.id) } });
        await prisma_js_1.default.car.delete({ where: { id: String(req.params.id) } });
        res.status(204).send();
    }
    catch (err) {
        if (err instanceof error_js_1.AppError) {
            res.status(err.statusCode).json({ error: err.message });
            return;
        }
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=cars.js.map