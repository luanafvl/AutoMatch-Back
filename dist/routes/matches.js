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
console.log("Matches router loaded");
const createMatchSchema = zod_1.z.object({
    carId: zod_1.z.string().min(1, "carId é obrigatório"),
    matchPercentage: zod_1.z.number().min(0).max(100),
});
const recommendationsSchema = zod_1.z.object({
    demographics: zod_1.z.object({
        familySize: zod_1.z.string(),
        primaryUse: zod_1.z.string(),
        primaryEnvironment: zod_1.z.string(),
    }),
    financials: zod_1.z.object({
        maxBudget: zod_1.z.number(),
        costTolerance: zod_1.z.string(),
    }),
    technicalPreferences: zod_1.z.object({
        categories: zod_1.z.array(zod_1.z.string()),
        vehicleAge: zod_1.z.string(),
        transmission: zod_1.z.string(),
    }),
    priorities: zod_1.z.object({
        economy: zod_1.z.number(),
        power: zod_1.z.number(),
        comfort: zod_1.z.number(),
        safety: zod_1.z.number(),
    }),
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
router.post("/recommendations", async (req, res, next) => {
    try {
        const userProfile = recommendationsSchema.parse(req.body);
        const cars = await prisma_js_1.default.car.findMany();
        const formattedCars = cars.map(car => ({
            id: car.id,
            nome: car.name,
            preco: car.price,
            categoria: car.category,
            specs: {
                potencia: car.power,
                consumo: car.consumption
            }
        }));
        const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
        const response = await fetch(`${aiServiceUrl}/match`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_profile: userProfile,
                available_cars: formattedCars
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: "Erro desconhecido na IA" }));
            throw new error_js_1.AppError(500, `IA Service Error: ${errorData.detail || response.statusText}`);
        }
        const aiResults = await response.json();
        res.json(aiResults);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.issues[0].message });
            return;
        }
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