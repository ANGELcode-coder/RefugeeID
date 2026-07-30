import { type Request, type Response, type NextFunction } from "express";
import { type User } from "@supabase/supabase-js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  req.app.locals.supabase.auth.getUser(token)
    .then(({ data: { user }, error }: { data: { user: User | null }, error: Error | null }) => {
      if (error || !user) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return;
      }
      (req as any).authUser = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: 'Token verification failed' });
    });
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  req.app.locals.supabase.auth.getUser(token)
    .then(({ data: { user } }: { data: { user: User | null } }) => {
      if (user) (req as any).authUser = user;
      next();
    })
    .catch(() => next());
}
