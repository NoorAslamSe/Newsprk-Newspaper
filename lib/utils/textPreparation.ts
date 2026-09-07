/**
 * Strips HTML/Markdown formatting and normalises whitespace for TTS input.
 * Pipeline order matters: block-level tags are replaced with pause markers FIRST
 * so that " . " separators survive the strip-all regex that follows.
 */
export function prepareTextForSpeech(html: string): string {
    if (!html) return "";

    // Step 1 — Replace block-level tags with " . " so the TTS engine pauses naturally at paragraph/heading boundaries
    let text = html.replace(/<br\s*\/?>/gi, " . ");
    text = text.replace(/<p[^>]*>/gi, " ");
    text = text.replace(/<\/p>/gi, " . ");
    text = text.replace(/<h[1-6][^>]*>/gi, " ");
    text = text.replace(/<\/h[1-6]>/gi, " . ");

    // Step 2 — Strip all remaining HTML tags (inline elements, attributes, etc.)
    text = text.replace(/<[^>]*>?/gm, "");

    // Clean up Markdown formatting (if any leaked in)
    text = text.replace(/(\*\*|__)(.*?)\1/g, "$2"); 
    text = text.replace(/(\*|_)(.*?)\1/g, "$2");
    text = text.replace(/\[(.*?)\]\(.*?\)/g, "$1"); // Links removal
    text = text.replace(/#+\s/g, ""); // Headings removal
    
    // Step 3 — Decode HTML entities so the TTS engine reads real words, not escape codes
    text = text.replace(/&nbsp;/g, " ");
    text = text.replace(/&amp;/g, "and");
    text = text.replace(/&lt;/g, "<");
    text = text.replace(/&gt;/g, ">");
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");

    // Replace multiple spaces with a single space
    text = text.replace(/\s+/g, " ");

    // Ensure sentences end with a natural pause
    // (We overcompensated earlier with ' . ', let's clean up multiple dots)
    text = text.replace(/\s\.\s/g, ". ");
    text = text.replace(/\.+/g, ".");

    return text.trim();
}
