import { Types } from "mongoose";
import { z } from "zod";

/** Returns true if the string is a valid 24-char MongoDB ObjectId hex. */
export function isValidObjectId(id: string) {
  return Types.ObjectId.isValid(id);
}

/** Validates and converts a string id to a Mongoose ObjectId — throws if invalid. */
export function ensureObjectId(id: string, label = "id") {
  if (!isValidObjectId(id)) {
    throw new Error(`Invalid ObjectId for ${label}`);
  }
  return new Types.ObjectId(id);
}

/** Zod validator for use inside request body schemas that accept an ObjectId string. */
export const ObjectIdStringSchema = z
  .string()
  .refine((v) => Types.ObjectId.isValid(v), "Invalid ObjectId");

