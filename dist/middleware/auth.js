"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "automatch-dev-secret-change-in-production";
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        res.status(401).json({ error: "Token não fornecido" });
        return;
    }
    const token = header.slice(7);
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = payload.userId;
        req.userRole = payload.role;
        next();
    }
    catch {
        res.status(401).json({ error: "Token inválido ou expirado" });
    }
}
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.userRole !== "ADMIN") {
            res.status(403).json({ error: "Acesso restrito a administradores" });
            return;
        }
        next();
    });
}
//# sourceMappingURL=auth.js.map