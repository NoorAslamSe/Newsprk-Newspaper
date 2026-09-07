import { z } from "zod";
import { ObjectIdStringSchema } from "@/lib/objectid";
import { HexColorSchema } from "@/lib/validations/common";

/**
 * Zod schemas for Category API endpoints.
 * `parent` accepts null (top-level) or a valid ObjectId string (sub-category).
 * CategoryUpdateSchema is a full partial — any field combination is valid for PATCH.
 */

export const CategoryCreateSchema = z.object({
  name: z.string().min(1).max(120),
  parent: ObjectIdStringSchema.nullable().optional().default(null),
  meta: z.record(z.string(), z.unknown()).optional().default({}),
  color: HexColorSchema.optional().default("#64748b"),
});

export const CategoryUpdateSchema = CategoryCreateSchema.partial();

