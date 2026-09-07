import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { AdTemplate } from "@/lib/models/AdTemplate";
import { toApiError } from "@/lib/api/errors";
import { requirePermission } from "@/lib/auth/server";
import { TemplateCodeValidator } from "@/lib/services/templateValidation";
import { z } from "zod";

const AdTemplateCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  category: z.enum(["banner", "native", "video", "interactive"]),
  code: z.string().min(1),
  variables: z.array(z.object({
    name: z.string().min(1).max(50),
    type: z.enum(["text", "url", "media", "color"]),
    required: z.boolean().default(false),
    defaultValue: z.string().max(500).optional(),
  })).default([]),
  preview: z.string().max(2048).optional(),
  isActive: z.boolean().default(true),
});

const AdTemplateUpdateSchema = AdTemplateCreateSchema.partial();

export async function GET(req: Request) {
  try {
    await requirePermission("templates.manage");
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build query
    const query: any = {};
    if (category && category !== "all") {
      query.category = category;
    }
    if (isActive !== null) {
      query.isActive = isActive === "true";
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AdTemplate.find(query)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AdTemplate.countDocuments(query),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return NextResponse.json(toApiError(err), { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await requirePermission("templates.manage");
    await connectDB();
    
    const body = AdTemplateCreateSchema.parse(await req.json());
    
    // Validate template code
    const validationResult = TemplateCodeValidator.validateTemplate(body.code);
    
    // Create template with validation status
    const templateData = {
      ...body,
      validationStatus: validationResult.isValid ? "valid" : "invalid",
      lastValidated: new Date(),
      createdBy: "507f1f77bcf86cd799439011", // TODO: Get from session
    };

    const created = await AdTemplate.create(templateData);
    
    // Return template with validation results
    return NextResponse.json({
      item: created,
      validation: validationResult,
    }, { status: 201 });
  } catch (err) {
    const apiError = toApiError(err);
    const status =
      apiError.error === "Validation error" ? 400 : 
      apiError.error === "Forbidden" ? 403 : 500;
    return NextResponse.json(apiError, { status });
  }
}