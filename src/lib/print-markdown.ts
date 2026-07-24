function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function markdownToHtml(markdown: string): string {
  const html: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  const closeList = () => {
    if (listType) html.push(`</${listType}>`);
    listType = null;
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (line.startsWith('# ')) {
      closeList();
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      closeList();
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith('- ')) {
      if (listType !== 'ul') {
        closeList();
        listType = 'ul';
        html.push('<ul>');
      }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
    } else if (orderedMatch) {
      if (listType !== 'ol') {
        closeList();
        listType = 'ol';
        html.push('<ol>');
      }
      html.push(`<li>${escapeHtml(orderedMatch[1])}</li>`);
    } else if (line.startsWith('> ')) {
      closeList();
      html.push(`<blockquote>${escapeHtml(line.slice(2))}</blockquote>`);
    } else if (line) {
      closeList();
      html.push(`<p>${escapeHtml(line)}</p>`);
    } else {
      closeList();
    }
  }
  closeList();
  return html.join('');
}

export function printMarkdownAsPdf(markdownPages: string[], filename: string): void {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('浏览器阻止了导出窗口，请允许弹出窗口后重试。');
    return;
  }
  printWindow.opener = null;
  const pages = markdownPages
    .map((page) => `<section class="record-page">${markdownToHtml(page)}</section>`)
    .join('');
  printWindow.document.write(`
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(filename)}</title>
        <style>
          @page { size: A4; margin: 18mm; }
          body { color: #111; font-family: "Microsoft YaHei", "Noto Sans SC", sans-serif; font-size: 12pt; line-height: 1.65; }
          .record-page + .record-page { break-before: page; page-break-before: always; }
          h1 { margin: 0 0 6mm; text-align: center; font-size: 24pt; }
          h2 { margin: 7mm 0 2mm; border-bottom: 1px solid #777; font-size: 16pt; }
          h3 { margin: 5mm 0 1mm; font-size: 13pt; }
          p { margin: 1.5mm 0; white-space: pre-wrap; }
          ul, ol { margin: 2mm 0; padding-left: 8mm; }
          blockquote { margin: 7mm 0 0; border-top: 1px solid #777; padding-top: 3mm; color: #444; font-size: 10.5pt; }
        </style>
      </head>
      <body>${pages}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
