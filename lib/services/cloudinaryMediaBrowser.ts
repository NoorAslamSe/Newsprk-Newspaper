/**
 * DEPRECATED — Cloudinary has been fully removed from this project.
 * All media is now served via Direct-to-CDN (S3 / Cloudflare R2).
 * This file is a stub to prevent build errors from legacy imports.
 */

export class CloudinaryMediaBrowser {
  static async deleteMedia(_publicIds: string[]): Promise<{ deleted: string[]; failed: string[] }> {
    console.warn('CloudinaryMediaBrowser.deleteMedia: Cloudinary is deprecated. No-op.');
    return { deleted: _publicIds, failed: [] };
  }

  static async getMediaById(_publicId: string): Promise<null> {
    console.warn('CloudinaryMediaBrowser.getMediaById: Cloudinary is deprecated. Returning null.');
    return null;
  }

  static generateThumbnailUrl(_publicId: string, _width: number): string {
    return '';
  }

  static generateMediumUrl(_publicId: string, _width: number): string {
    return '';
  }
}