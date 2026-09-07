/**
 * Client-side thumbnail generator using the Canvas API.
 * For images: draws the file onto a resized canvas and returns a data URL.
 * For videos: seeks to 1 second in, captures the frame, and returns a JPEG data URL.
 * Returns '' for unsupported types (e.g. audio files).
 */
export async function generateThumbnail(
  file: File,
  targetWidth: number = 300,
  quality: number = 0.8
): Promise<string> {
  if (file.type.startsWith('video/')) {
    return generateVideoThumbnail(file);
  } else if (file.type.startsWith('image/')) {
    return generateImageThumbnail(file, targetWidth, quality);
  }
  return ''; // Unsupported type — caller should not display a thumbnail
}

function generateImageThumbnail(file: File, targetWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      if (!ctx) return reject(new Error('Canvas context not available'));
      const ratio = targetWidth / img.width;
      const targetHeight = img.height * ratio;

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      resolve(canvas.toDataURL(file.type, quality));
    };
    img.onerror = (e) => reject(e);
    img.src = URL.createObjectURL(file);
  });
}

function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.muted = true;
    
    video.onloadeddata = () => {
      // Seek to 1 second (or midpoint for very short videos) to skip black/loading frames
      video.currentTime = Math.min(1, video.duration / 2 || 0);
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    
    video.onerror = (e) => reject(e);
  });
}
