/**
 * Compresses an image client-side using the Canvas API if it exceeds a certain size.
 * Non-image files and files already within the limit are returned unchanged.
 */
export async function compressImage(
  file: File,
  maxSizeMB: number = 5,
  maxWidth: number = 2000,
  quality: number = 0.8
): Promise<File> {
  const fileSizeBytes = file.size;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Skip compression: already small enough OR not an image (video/audio pass through)
  if (fileSizeBytes <= maxSizeBytes || !file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Scale down proportionally if wider than maxWidth; height follows aspect ratio
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}
