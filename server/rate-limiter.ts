import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts.entries()) {
    if (entry.blockedUntil && entry.blockedUntil < now) {
      loginAttempts.delete(ip);
    } else if (!entry.blockedUntil && now - entry.firstAttemptTime > WINDOW_MS) {
      loginAttempts.delete(ip);
    }
  }
}

setInterval(cleanupOldEntries, 5 * 60 * 1000);

export function loginRateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  const entry = loginAttempts.get(ip);
  
  if (entry?.blockedUntil && entry.blockedUntil > now) {
    const remainingTime = Math.ceil((entry.blockedUntil - now) / 1000 / 60);
    return res.status(429).json({ 
      message: `Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.`
    });
  }
  
  if (!entry || now - entry.firstAttemptTime > WINDOW_MS) {
    loginAttempts.set(ip, {
      attempts: 1,
      firstAttemptTime: now,
    });
  } else {
    entry.attempts++;
    
    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.blockedUntil = now + BLOCK_DURATION_MS;
      const blockMinutes = BLOCK_DURATION_MS / 1000 / 60;
      return res.status(429).json({ 
        message: `Muitas tentativas de login. Sua conta foi temporariamente bloqueada por ${blockMinutes} minutos.`
      });
    }
  }
  
  next();
}

export function resetLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}
