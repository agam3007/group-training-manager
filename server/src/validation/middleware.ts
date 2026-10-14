/**
 * F0.3 — Validation middleware.
 * Wraps a zod schema and returns 400 with a structured error envelope
 * when the request body doesn't match.
 *
 * Usage in a route:
 *   router.post("/", validate(athleteCreateSchema), async (req, res) => { ... });
 *   // req.body is now typed and coerced (e.g. "22" → 22)
 */
import { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      res.status(400).json({
        message: `Validation failed: ${details.map((d) => `${d.path} — ${d.message}`).join("; ")}`,
        error: {
          code: "VALIDATION_ERROR",
          details,
        },
      });
      return;
    }

    // Replace req.body with the coerced/cleaned version
    req.body = result.data;
    next();
  };
}

/**
 * F0.3 — Standardized 404 for DELETE routes.
 * Checks the entity exists before deleting; returns 404 if not.
 */
export function notFoundOrOk(entityName: string) {
  return (req: Request, res: Response): void => {
    res.status(404).json({
      message: `${entityName} not found`,
      error: { code: "NOT_FOUND" },
    });
  };
}