"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
const error_js_1 = require("../middleware/error.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "automatch-dev-secret-change-in-production";
const registerSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    surname: zod_1.z.string().optional().default(""),
    email: zod_1.z.string().email("Email inválido"),
    password: zod_1.z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Email inválido"),
    password: zod_1.z.string().min(1, "Senha é obrigatória"),
});
const updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    surname: zod_1.z.string().optional().default(""),
    email: zod_1.z.string().email("Email inválido"),
    password: zod_1.z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
});
const updateAvatarSchema = zod_1.z.object({
    avatarUrl: zod_1.z.string().min(1, "Imagem inválida"),
});
router.post("/register", async (req, res, next) => {
    try {
        const data = registerSchema.parse(req.body);
        const existing = await prisma_js_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (existing) {
            throw new error_js_1.AppError(409, "Email já cadastrado");
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
        const user = await prisma_js_1.default.user.create({
            data: {
                firstName: data.firstName,
                surname: data.surname,
                email: data.email,
                password: hashedPassword,
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.status(201).json({
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                surname: user.surname,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
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
router.post("/login", async (req, res, next) => {
    try {
        const data = loginSchema.parse(req.body);
        const user = await prisma_js_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw new error_js_1.AppError(401, "Email ou senha inválidos");
        }
        const valid = await bcryptjs_1.default.compare(data.password, user.password);
        if (!valid) {
            throw new error_js_1.AppError(401, "Email ou senha inválidos");
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: "7d",
        });
        res.json({
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                surname: user.surname,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
            },
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
router.put("/me", auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const data = updateProfileSchema.parse(req.body);
        if (!req.userId) {
            throw new error_js_1.AppError(401, "Token inválido ou expirado");
        }
        const existing = await prisma_js_1.default.user.findFirst({
            where: {
                email: data.email,
                NOT: { id: req.userId },
            },
        });
        if (existing) {
            throw new error_js_1.AppError(409, "Email já cadastrado");
        }
        const updateData = {
            firstName: data.firstName,
            surname: data.surname,
            email: data.email,
        };
        if (data.password) {
            updateData.password = await bcryptjs_1.default.hash(data.password, 10);
        }
        const user = await prisma_js_1.default.user.update({
            where: { id: req.userId },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                surname: true,
                email: true,
                role: true,
                avatarUrl: true,
            },
        });
        res.json({ user });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            res.status(400).json({ error: err.issues[0].message });
            return;
        }
        next(err);
    }
});
router.put("/me/avatar", auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const data = updateAvatarSchema.parse(req.body);
        if (!req.userId) {
            throw new error_js_1.AppError(401, "Token inválido ou expirado");
        }
        const user = await prisma_js_1.default.user.update({
            where: { id: req.userId },
            data: { avatarUrl: data.avatarUrl },
            select: {
                id: true,
                firstName: true,
                surname: true,
                email: true,
                role: true,
                avatarUrl: true,
            },
        });
        res.json({ user });
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
//# sourceMappingURL=auth.js.map