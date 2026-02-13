import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, z } from 'zod';

export const validate =
  (schema: AnyZodObject) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void res;
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    req.body = parsed.body;
    req.params = parsed.params;
    req.query = parsed.query;
    next();
  };

export const paginationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  }),
  body: z.object({}).passthrough().optional().default({}),
  params: z.object({}).passthrough().optional().default({}),
});
