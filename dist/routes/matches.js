"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const auth_js_1 = require("../middleware/auth.js");
const error_js_1 = require("../middleware/error.js");
const router = (0, express_1.Router)();
const createMatchSchema = zod_1.z.object({
    carId: zod_1.z.string().min(1, "carId é obrigatório"),
    matchPercentage: zod_1.z.number().min(0).max(100),
});
function formatMatch(row) {
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
router.get("/", auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const matches = await prisma_js_1.default.savedMatch.findMany({
            where: { userId: req.userId },
            include: { car: true },
            orderBy: { savedAt: "desc" },
        });
        res.json(matches.map(formatMatch));
    }
    catch (err) {
        next(err);
    }
});
router.post("/", auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const data = createMatchSchema.parse(req.body);
        const car = await prisma_js_1.default.car.findUnique({
            where: { id: data.carId },
        });
        if (!car) {
            throw new error_js_1.AppError(404, "Carro não encontrado");
        }
        const existing = await prisma_js_1.default.savedMatch.findUnique({
            where: {
                userId_carId: {
                    userId: req.userId,
                    carId: data.carId,
                },
            },
        });
        if (existing) {
            throw new error_js_1.AppError(409, "Match já salvo");
        }
        const match = await prisma_js_1.default.savedMatch.create({
            data: {
                userId: req.userId,
                carId: data.carId,
                matchPercentage: data.matchPercentage,
            },
            include: { car: true },
        });
        res.status(201).json(formatMatch(match));
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.issues[0].message });
            return;
        }
        next(err);
    }
});
router.delete("/:id", auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const match = await prisma_js_1.default.savedMatch.findUnique({
            where: { id: String(req.params.id) },
        });
        if (!match) {
            throw new error_js_1.AppError(404, "Match não encontrado");
        }
        if (match.userId !== req.userId) {
            throw new error_js_1.AppError(403, "Não autorizado");
        }
        await prisma_js_1.default.savedMatch.delete({
            where: { id: String(req.params.id) },
        });
        res.status(204).send();
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=matches.js.map