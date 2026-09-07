/**
 * Runtime environment variable audit for the media upload system.
 * Warns (not throws) so missing config doesn't hard-crash the app —
 * only the upload features degrade gracefully.
 * Separate from lib/env.ts (which uses Zod for startup validation of critical vars).
 */
export function validateEnvVariables() {
  const missingVariables: string[] = [];

  // Legacy Cloudinary vars — kept for backward-compat checks even though Cloudinary is removed
  const requiredCloudinary = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET'
  ];

  requiredCloudinary.forEach((envVar) => {
    if (!process.env[envVar]) missingVariables.push(envVar);
  });

  // At least one CDN backend must be configured for file uploads to work
  const hasAWS = process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID;
  const hasR2 = process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID;

  if (!hasAWS && !hasR2) {
    missingVariables.push('Either AWS S3 or Cloudflare R2 credentials are required for CDN uploads.');
  }

  if (missingVariables.length > 0) {
    console.warn('Missing environment variables for Media Upload System:', missingVariables.join(', '));
  }
}
