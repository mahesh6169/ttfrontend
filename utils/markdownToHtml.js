// Simple markdown to HTML converter for basic formatting
export function simpleMarkdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown;

  // Convert headers H6 → H1 (process higher levels first to avoid conflicts)
  html = html
    .replace(/^###### (.*)$/gim, '<h6 class="text-sm font-semibold mb-1 mt-3">$1</h6>')
    .replace(/^##### (.*)$/gim,  '<h5 class="text-base font-semibold mb-2 mt-3">$1</h5>')
    .replace(/^#### (.*)$/gim,   '<h4 class="text-lg font-semibold mb-2 mt-4">$1</h4>')
    .replace(/^### (.*)$/gim,    '<h3 class="text-xl font-semibold mb-2 mt-4">$1</h3>')
    .replace(/^## (.*)$/gim,     '<h2 class="text-2xl font-bold mb-3 mt-6">$1</h2>')
    .replace(/^# (.*)$/gim,      '<h1 class="text-3xl font-bold mb-4">$1</h1>');

  // Convert bold text
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>');
  
  // Convert italic text (avoid catching bold markers)
  html = html.replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, '$1<em class="italic">$2</em>');

  // Split into blocks and handle paragraphs/lists
  html = html.split(/\n{2,}/).map(block => {
    const trimmed = block.trim();
    
    // Skip if block already contains HTML tags (headers, lists, etc.)
    if (/^<(h\d|ul|ol|li|pre|blockquote|p)/i.test(trimmed)) {
      return block;
    }
    
    // Handle unordered lists
    if (/^- /m.test(trimmed)) {
      const items = trimmed.split('\n')
        .map(line => line.startsWith('- ') ? `<li class="ml-6 mb-1">${line.substring(2)}</li>` : line)
        .join('\n');
      return `<ul class="list-disc mb-4">${items}</ul>`;
    }
    
    // Wrap in paragraph if it's plain text
    return trimmed ? `<p class="mb-4">${trimmed}</p>` : '';
  }).filter(block => block).join('\n\n');

  return html;
}