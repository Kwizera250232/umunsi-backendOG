/** Strip admin-editor-only UI from article HTML before save or public display. */
export function stripEditorChromeFromHtml(html: string): string {
  if (!html) return '';

  let cleaned = html;

  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\bresize-handle[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  cleaned = cleaned.replace(/<div[^>]*class="[^"]*\bimage-controls[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  cleaned = cleaned.replace(
    /<div[^>]*class="[^"]*\bimage-container[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    (_match, inner: string) => {
      const imgMatch = inner.match(/<img[\s\S]*?>/i);
      return imgMatch ? imgMatch[0] : inner.replace(/<div[^>]*class="[^"]*\bresize-handle[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
    }
  );

  cleaned = cleaned.replace(/\sclass="([^"]*)"/gi, (_match, classNames: string) => {
    const next = classNames
      .split(/\s+/)
      .filter((name) => name && !['selected', 'resizable-image', 'image-container'].includes(name))
      .join(' ');
    return next ? ` class="${next}"` : '';
  });

  if (typeof window === 'undefined') return cleaned;

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div id="article-root">${cleaned}</div>`, 'text/html');
  const root = doc.getElementById('article-root');
  if (!root) return cleaned;

  root.querySelectorAll('.resize-handle, .image-controls, .image-container').forEach((node) => {
    const image = node.querySelector('img');
    const parent = node.parentElement;
    if (image && parent && node.classList.contains('image-container')) {
      parent.insertBefore(image, node);
    }
    node.remove();
  });

  root.querySelectorAll('.selected, .resizable-image').forEach((node) => {
    node.classList.remove('selected', 'resizable-image', 'image-container');
  });

  root.querySelectorAll('figcaption.umunsi-caption').forEach((caption) => {
    if (!caption.textContent?.trim()) {
      caption.remove();
    }
  });

  return root.innerHTML;
}
