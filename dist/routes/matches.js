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
const recommendationsSchema = zod_1.z.object({
    demographics: zod_1.z.object({
        familySize: zod_1.z.enum(["2", "3-4", "5+"]),
        primaryUse: zod_1.z.string(),
        primaryEnvironment: zod_1.z.string(),
    }),
    financials: zod_1.z.object({
        maxBudget: zod_1.z.number(),
    }),
    technicalPreferences: zod_1.z.object({
        categories: zod_1.z.array(zod_1.z.enum(["Hatch", "Sedan", "SUV", "Picape", "Eletrico", "Premium"])),
        vehicleAge: zod_1.z.enum(["0km", "up_to_3_years", "up_to_10_years"]),
        transmission: zod_1.z.string(),
    }),
    priorities: zod_1.z.object({
        economy: zod_1.z.number(),
        power: zod_1.z.number(),
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
router.post("/recommendations", auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const userProfile = recommendationsSchema.parse(req.body);
        const userId = req.userId;
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
        const aiServiceUrl = (process.env.AI_SERVICE_URL || "http://localhost:8000").replace(/\/+$/, "");
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
        const enrichedMatches = [];
        // Salvar automaticamente apenas o melhor match no banco de dados para o usuário
        if (aiResults.matches && aiResults.matches.length > 0) {
            const topMatches = aiResults.matches.slice(0, 1); // Salva apenas o melhor resultado (maior compatibilidade)
            for (const aiMatch of topMatches) {
                try {
                    const matchRecord = await prisma_js_1.default.savedMatch.upsert({
                        where: {
                            userId_carId: {
                                userId: userId,
                                carId: aiMatch.id
                            }
                        },
                        update: {
                            matchPercentage: Math.max(0, Math.round(aiMatch.match_score * 100))
                        },
                        create: {
                            userId: userId,
                            carId: aiMatch.id,
                            matchPercentage: Math.max(0, Math.round(aiMatch.match_score * 100))
                        },
                        include: { car: true }
                    });
                    enrichedMatches.push(formatMatch(matchRecord));
                }
                catch (saveErr) {
                    console.error(`Erro ao salvar match automático para o carro ${aiMatch.id}:`, saveErr);
                }
            }
        }
        res.json({
            status: "success",
            matches: enrichedMatches
        });
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