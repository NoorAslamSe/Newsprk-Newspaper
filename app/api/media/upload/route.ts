import { NextRequest, NextResponse } from 'next/server';

/**
 * This route is DEPRECATED.
 * All uploads now go through the CDN presigned URL flow:
 *   POST /api/upload/url  → get presigned URL
 *   PUT  <presigned URL>  → upload directly from browser to S3/R2
 *   POST /api/media/save  → save metadata to MongoDB
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This upload endpoint is deprecated. Use the CDN presigned URL flow instead.',
      docs: '/api/upload/url',
    },
    { status: 410 } // 410 Gone
  );
}