import { RequestHandler } from 'express';
import { AnyZodObject, ZodError } from 'zod';

interface ValidateSchemas {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
}

export function validate(schemas: ValidateSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query)  req.query  = schemas.query.parse(req.query);
      if (schemas.body)   req.body   = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err);
      } else {
        next(err);
      }
    }
  };
}
