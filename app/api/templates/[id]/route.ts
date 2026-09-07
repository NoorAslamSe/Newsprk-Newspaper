import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AdTemplate } from "@/lib/models/AdTemplate";
import { toApiError } from "@/lib/api/errors";
import { requirePermission } from "@/lib/auth/server";
import { TemplateCodeValidator } from "@/lib/services/templateValidation";
import { z } from "zod";

const AdTemplateUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional(),
  category: z.enum(["banner", "native", "video", "interactive"]).optional(),
  code: z.string().min(1).optional(),
  variables: z.array(z.object({
    name: z.string().min(1).max(50),
    type: z.enum(["text", "url", "media", "color"]),
    required: z.boolean().default(false),
    defaultValue: z.string().max(500).optional(),
  })).optional(),
  preview: z.string().max(2048).optional(),
  isActive: z.boolean().optional(),
  validationStatus: z.enum(["valid", "invalid", "warning"]).optional(),
  lastValidated: z.date().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("templates.manage");
    const { id } = await params;
    await connectDB();
    const item = await AdTemplate.findById(id)
      .populate("createdBy", "name email")
      .lean();
    
    if (!item) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    
    return NextResponse.json({ item });
  } catch (err) {
    return NextResponse.json(toApiError(err), { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("templates.manage");
    const { id } = await params;
    await connectDB();
    
    const body = AdTemplateUpdateSchema.parse(await req.json());
    
    // If code is being updated, validate it
    let validationResult = null;
    if (body.code) {
      validationResult = TemplateCodeValidator.validateTemplate(body.code);
      body.validationStatus = validationResult.isValid ? "valid" : "invalid";
      body.lastValidated = new Date();
    }
    
    const updated = await AdTemplate.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate("createdBy", "name email");
    
    if (!updated) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    
    return NextResponse.json({
      item: updated,
      validation: validationResult,
    });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : 
      apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("templates.manage");
    const { id } = await params;
    await connectDB();
    
    const deleted = await AdTemplate.findByIdAndDelete(id);
    
    if (!deleted) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Template deleted successfully" });
  } catch (err) {
    const apiError = toApiError(err);
    const status = apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}