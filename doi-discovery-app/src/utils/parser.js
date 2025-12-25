
/**
 * Parses a raw text block of references into an array of strings.
 * Assumes references are numbered like [1], [2], etc.
 * 
 * @param {string} text 
 * @returns {Array<{id: string, text: string}>}
 */
export function parseReferences(text) {
  if (!text) return [];

  // Regex to match [n] at the start of a line or after a newline
  // We used a lookahead/splitting approach or just match the block.
  // Strategy: Split by `\[\d+\]` but keep the delimiters if possible or just reconstruct.
  
  // Alternative: match `\[\d+\].*?` until the next `\[\d+\]` or end of string.
  // But we need to handle multi-line references. 
  
  // Let's rely on splitting by the marker `[\d+]`
  // Note: Some refs might be `1.` or `(1)`. The user prompt specifically shows `[ number ]`.
  
  const parts = text.split(/(\[\d+\])/).filter(p => p.trim().length > 0);
  
  const references = [];
  let currentRef = null;

  for (const part of parts) {
    if (/^\[\d+\]$/.test(part.trim())) {
      if (currentRef) {
        references.push(currentRef);
      }
      currentRef = { id: part.trim(), text: "" };
    } else if (currentRef) {
      currentRef.text += " " + part.trim();
    }
  }
  
  if (currentRef) {
    references.push(currentRef);
  }

  // Clean up whitespace
  return references.map(ref => ({
    id: ref.id,
    text: ref.text.replace(/\s+/g, ' ').trim()
  }));
}
