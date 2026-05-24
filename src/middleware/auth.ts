import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "automatch-dev-secret-change-in-production";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  requireAuth(req, res, () => {
    if (req.userRole !== "ADMIN") {
      res.status(403).json({ error: "Acesso restrito a administradores" });
      return;
    }
    next();
  });
}
