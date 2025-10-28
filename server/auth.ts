import bcrypt from "bcryptjs";
import { db } from "./db";
import { adminUsers } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

declare module 'express-session' {
  interface SessionData {
    adminId?: string;
    adminEmail?: string;
    adminRole?: string;
  }
}

export async function loginAdmin(email: string, password: string) {
  const admin = await db.query.adminUsers.findFirst({
    where: eq(adminUsers.email, email),
  });

  if (!admin) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
  
  if (!isValidPassword) {
    return null;
  }

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Não autorizado. Faça login como administrador." });
  }
  next();
}
