/**
 * Build a Content-Disposition attachment header safe for Node (ASCII-only
 * filename + RFC 5987 filename* for Unicode display names).
 */
export function attachmentContentDisposition(filename: string): string {
  const normalized = String(filename ?? '').trim() || 'download.pdf';
  const asciiFallback =
    normalized
      .replace(/[^\x20-\x7E]/g, '_')
      .replace(/["\\]/g, '_')
      .replace(/\s+/g, '_') || 'download.pdf';
  const encoded = encodeURIComponent(normalized).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
