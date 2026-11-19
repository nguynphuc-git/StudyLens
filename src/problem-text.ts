const explicitMath = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;
export function normalizeProblemText(value: string): string {
  const protectedParts: string[] = [];
  let text = value.normalize('NFC').replace(explicitMath, match => {
    protectedParts.push(match); return `\uE000${protectedParts.length - 1}\uE001`;
  }).replace(/\r\n?/g, '\n').replace(/[\u00a0\u2007\u202f]/g, ' ').replace(/\u00ad/g, '')
    .replace(/[\t ]+/g, ' ').replace(/ *\n */g, '\n').trim();
  const labels = [...text.matchAll(/(?:^|\s)(?:\([a-hA-H]\)|[a-hA-H][.)])(?=\s|[\d{∅Øℕℤℚℝℂ])/g)];
  if (labels.length >= 2) text = text.replace(/(?:^|\s)(\([a-hA-H]\)|[a-hA-H][.)])\s*(?=\S)/g, '\n$1 ');
  const lines = text.split('\n'); let output = '';
  for (const line of lines) {
    if (!line) { if (output) output = output.trimEnd() + '\n\n'; continue; }
    const boundary = /^(?:\([a-hA-H]\)|[a-hA-H][.)]|\d{1,3}[.)])\s|^(?:question|problem|exercise|bài(?:\s+tập)?|câu)\s*\d|^[•●▪]\s/iu.test(line);
    output += !output || output.endsWith('\n') ? line : (boundary ? '\n' : ' ') + line;
  }
  return output.trim().replace(/\uE000(\d+)\uE001/g, (_, index: string) => protectedParts[Number(index)]);
}

/** Only remove our own display wrappers; never strip arbitrary mathematical braces. */
export function stripProblemLayout(value: string): string {
  const marker = '\\class{mathfolio-line}{'; let result = '', position = 0;
  while (position < value.length) {
    const start = value.indexOf(marker, position);
    if (start < 0) return result + value.slice(position);
    const between = value.slice(position, start);
    if (!position || between.trim()) result += between;
    let depth = 1; let end = start + marker.length;
    for (; end < value.length; end++) {
      if (value[end] === '\\') { end++; continue; }
      if (value[end] === '{') depth++;
      if (value[end] === '}') { depth--; if (depth === 0) break; }
    }
    if (depth !== 0) return result + value.slice(start);
    result += value.slice(start + marker.length, end) + '\n'; position = end + 1;
  }
  return result.trim();
}
