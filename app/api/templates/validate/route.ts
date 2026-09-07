import { NextResponse } from "next/server";
import { TemplateCodeValidator } from "@/lib/services/templateValidation";
import { toApiError } from "@/lib/api/errors";
import { z } from "zod";

const ValidateTemplateSchema = z.object({
  code: z.string().min(1),
  type: z.enum(["html", "css", "javascript", "template"]).default("template"),
});

export async function POST(req: Request) {
  try {
    const body = ValidateTemplateSchema.parse(await req.json());
    
    let validationResult;
    
    switch (body.type) {
      case "html":
        validationResult = TemplateCodeValidator.validateHTML(body.code);
        break;
      case "css":
        validationResult = TemplateCodeValidator.validateCSS(body.code);
        break;
      case "javascript":
        validationResult = TemplateCodeValidator.validateJavaScript(body.code);
        break;
      case "template":
      default:
        validationResult = TemplateCodeValidator.validateTemplate(body.code);
        break;
    }
    
    // Add helpful error messages
    const enhancedErrors = validationResult.errors.map(error => ({
      ...error,
      helpfulMessage: TemplateCodeValidator.getHelpfulErrorMessage(error),
    }));
    
    return NextResponse.json({
      ...validationResult,
      errors: enhancedErrors,
    });
  } catch (err) {
    const apiError = toApiError(err);
    const status = apiError.error === "Validation error" ? 400 : 500;
    return NextResponse.json(apiError, { status });
  }
}