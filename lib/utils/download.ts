/**
 * Downloads a file from a URL by fetching it as a blob.
 * Direct <a href> downloads often trigger a new tab for cross-origin URLs;
 * fetching as a blob first forces the browser to treat it as a file download.
 */
export async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    // Programmatic click triggers a download dialog without navigation
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Revoke the object URL to release memory after the download starts
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback: open in new tab if blob fetch fails (e.g. CORS restrictions)
    window.open(url, '_blank');
  }
}

/** Downloads multiple files sequentially with a small delay between each to prevent browser throttling. */
export async function downloadMultipleFiles(files: { url: string, filename: string }[]) {
  for (const file of files) {
    await downloadFile(file.url, file.filename);
    // 200ms gap prevents browsers from blocking rapid consecutive downloads as a security measure
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}
