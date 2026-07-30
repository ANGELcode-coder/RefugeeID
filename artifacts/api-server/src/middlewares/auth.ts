import { type Request, type Response, type NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.slice(7);

  req.app.locals.supabase.auth.getUser(token)
    .then(({ data: { user }, error }) => {
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      (req as any).authUser = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: 'Token verification failed' });
    });
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  req.app.locals.supabase.auth.getUser(token)
    .then(({ data: { user } }) => {
      if (user) (req as any).authUser = user;
      next();
    })
    .catch(() => next());
}
