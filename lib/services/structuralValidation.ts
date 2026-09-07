import type { ComparisonArticle } from "@/types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStructuralBlocks(article: ComparisonArticle): ValidationResult {
  const errors: string[] = [];

  if (article.content_type === "comparison" || article.content_type === "review") {
    const blocks = article.structural_blocks;
    if (!blocks) {
      errors.push("Missing: structural_blocks entirely");
    } else {
      if (!blocks.question_answered) errors.push("Missing: Question Answered");
      if (!blocks.context) errors.push("Missing: Context");
      if (!blocks.comparison) errors.push("Missing: Comparison/Interpretation");
      if (!blocks.action) errors.push("Missing: Action");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateJsonLd(schema: Record<string, unknown>): ValidationResult {
  const errors: string[] = [];

  if (!schema["@context"]) errors.push("Missing @context");
  if (!schema["@type"]) errors.push("Missing @type");

  return { valid: errors.length === 0, errors };
}

export function checkDisclosurePresent(hasAffiliateLinks: boolean, hasDisclosure: boolean): ValidationResult {
  if (hasAffiliateLinks && !hasDisclosure) {
    return {
      valid: false,
      errors: ["Inline affiliate disclosure missing on page with affiliate links (FTC violation)"],
    };
  }
  return { valid: true, errors: [] };
}
