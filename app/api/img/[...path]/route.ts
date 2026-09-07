import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const REFERENCE_BASE = path.join(
  process.cwd(),
  "..",
  "design-reference",
  "foxiz.io",
  "default"
);

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const filePath = path.join(REFERENCE_BASE, ...pathSegments);

  // Security: ensure we don't escape the reference directory
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(path.normalize(REFERENCE_BASE))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(normalizedPath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const ext = path.extname(normalizedPath).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  const fileBuffer = fs.readFileSync(normalizedPath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

