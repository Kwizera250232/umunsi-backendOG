/**
 * Split article HTML into segments, inserting a marker after the Nth paragraph
 * so mid-article ads can be rendered between React-managed content blocks.
 */
export const splitHtmlAfterParagraphs = (html: string, afterCount = 3): string[] => {
  if (!html?.trim()) return [''];

  const paragraphRegex = /<\/p>/gi;
  let matchCount = 0;
  let splitIndex = -1;
  let match: RegExpExecArray | null;

  while ((match = paragraphRegex.exec(html)) !== null) {
    matchCount += 1;
    if (matchCount === afterCount) {
      splitIndex = match.index + match[0].length;
      break;
    }
  }

  if (splitIndex === -1) return [html];

  return [html.slice(0, splitIndex), html.slice(splitIndex)];
};
