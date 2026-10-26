/**
 * Turns a Shopify product description into bullet strings for the PDP.
 *
 * Prefers real list items from `descriptionHtml` (admin bullet lists → `<li>`).
 * Falls back to newline / dash-prefixed lines from plain `description`.
 */
export function getProductDescriptionBullets({
  description,
  descriptionHtml,
}: {
  description: string;
  descriptionHtml: string;
}): string[] {
  const fromHtml = [
    ...descriptionHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi),
  ]
    .map((match) => stripHtml(match[1] ?? ''))
    .filter(Boolean);

  if (fromHtml.length > 0) {
    return fromHtml;
  }

  return description
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-–—•*]\s+/, '').trim())
    .filter(Boolean);
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
