interface TextImageSection {
  title: string;
  lines: string[];
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let currentLine = '';

  for (const character of Array.from(text)) {
    const nextLine = currentLine + character;
    if (currentLine && context.measureText(nextLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = character;
    } else {
      currentLine = nextLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [''];
}

export function downloadTextImage(title: string, sections: TextImageSection[], filename: string) {
  const width = 1080;
  const horizontalPadding = 84;
  const contentWidth = width - horizontalPadding * 2;
  const measuringCanvas = document.createElement('canvas');
  const measuringContext = measuringCanvas.getContext('2d');
  if (!measuringContext) return;

  measuringContext.font = '32px sans-serif';
  const preparedSections = sections.map((section) => ({
    ...section,
    wrappedLines: section.lines.flatMap((line) => wrapText(measuringContext, line, contentWidth)),
  }));
  const height = 210 + preparedSections.reduce(
    (total, section) => total + 76 + section.wrappedLines.length * 52 + 42,
    0
  );
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return;

  context.fillStyle = '#fffdf9';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#166534';
  context.font = 'bold 54px sans-serif';
  context.fillText(title, horizontalPadding, 105);
  context.fillStyle = '#64748b';
  context.font = '26px sans-serif';
  context.fillText(`生成时间：${new Date().toLocaleString('zh-CN')}`, horizontalPadding, 157);

  let y = 230;
  for (const section of preparedSections) {
    context.fillStyle = '#dcfce7';
    context.fillRect(horizontalPadding - 18, y - 45, contentWidth + 36, 62);
    context.fillStyle = '#14532d';
    context.font = 'bold 34px sans-serif';
    context.fillText(section.title, horizontalPadding, y);
    y += 68;
    context.fillStyle = '#111827';
    context.font = '32px sans-serif';
    for (const line of section.wrappedLines) {
      context.fillText(line, horizontalPadding, y);
      y += 52;
    }
    y += 42;
  }

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
