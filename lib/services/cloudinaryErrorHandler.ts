/**
 * DEPRECATED — Cloudinary has been fully removed from this project.
 * All media is now served via Direct-to-CDN (S3 / Cloudflare R2).
 * This file is a stub to prevent build errors from legacy imports.
 */

export class CloudinaryErrorHandler {
  static handle(_error: unknown): void {
    console.warn('CloudinaryErrorHandler: Cloudinary is deprecated. No-op.');
  }
}