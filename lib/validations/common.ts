import { z } from "zod";
import { ObjectIdStringSchema } from "@/lib/objectid";

/**
 * Shared Zod primitives re-used across multiple validation schemas.
 * Import these instead of duplicating definitions in domain-specific files.
 *
 * PaginationQuerySchema: standard page/limit for list endpoints.
 * ObjectIdParamSchema:   validates :id URL params as MongoDB ObjectIds.
 * EmailSchema:           RFC 5321 max-254-char email.
 * HexColorSchema:        6-digit hex color (#rrggbb).
 */

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const ObjectIdParamSchema = z.object({
  id: ObjectIdStringSchema,
});

export const EmailSchema = z.string().email().max(254);

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color");

