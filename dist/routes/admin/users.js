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
router.get("/", auth_js_1.requireAdmin, async (_req, res, next) => {
    try {
        const users = await prisma_js_1.default.user.findMany({
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
    }
    catch (err) {
        next(err);
    }
});
const roleSchema = zod_1.z.object({
    role: zod_1.z.enum(["USER", "ADMIN"], { message: "Role deve ser USER ou ADMIN" }),
});
router.put("/:id/role", auth_js_1.requireAdmin, async (req, res, next) => {
    try {
        const { role } = roleSchema.parse(req.body);
        const targetId = String(req.params.id);
        if (targetId === req.userId) {
            throw new error_js_1.AppError(400, "Você não pode alterar sua própria role");
        }
        const user = await prisma_js_1.default.user.findUnique({ where: { id: targetId } });
        if (!user) {
            throw new error_js_1.AppError(404, "Usuário não encontrado");
        }
        const updated = await prisma_js_1.default.user.update({
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
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.issues[0].message });
            return;
        }
        next(err);
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map