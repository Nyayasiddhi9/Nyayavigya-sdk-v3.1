import { Request, Response, NextFunction } from 'express';

export const jsonResponse = (req: Request, res: Response, next: NextFunction) => {
  // Simple JSON response middleware
  res.header('Content-Type', 'application/json');
  next();
};