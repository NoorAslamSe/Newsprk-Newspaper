import type { Article } from "@/types";
import { validateStructuralBlocks, validateJsonLd, type ValidationResult } from "./structuralValidation";

export interface QualityGateResult {
  passed: boolean;
  gates: Record<string, ValidationResult>;
}

export function runQualityGates(article: Article): QualityGateResult {
  const gates: Record<string, ValidationResult> = {};

  // Structural gate
  if (article.content_type === "comparison" || article.content_type === "review") {
    gates.structural = validateStructuralBlocks(article as any);
  } else {
    gates.structural = { valid: true, errors: [] };
  }

  // Schema gate
  if (article.seo_metadata?.jsonLd) {
    gates.schema = validateJsonLd(article.seo_metadata.jsonLd as Record<string, unknown>);
  } else {
    gates.schema = { valid: true, errors: [] };
  }

  // Uniqueness gate (basic check — title should not be empty)
  gates.uniqueness = {
    valid: !!article.title && article.title.length > 0,
    errors: article.title ? [] : ["Title is empty"],
  };

  // Content type gate
  gates.content_type = {
    valid: !!article.content_type,
    errors: article.content_type ? [] : ["content_type not set"],
  };

  const passed = Object.values(gates).every((g) => g.valid);

  return { passed, gates };
}
